import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "./adminNavItems";

/**
 * AdminTopNav — horizontal tab strip for the admin shell. Mirrors TopNav
 * (auto-overflow into "More ▾") but matches on a single `activeSection`
 * string instead of customer-side (tab + sub) compound keys.
 */
const MORE_BUTTON_WIDTH = 110;
const MAX_INLINE = 8;

export default function AdminTopNav({ activeSection, onSelectSection }) {
  const rowRef = useRef(null);
  const measureRef = useRef(null);
  const moreRef = useRef(null);

  const [visibleCount, setVisibleCount] = useState(Math.min(ADMIN_NAV_ITEMS.length, MAX_INLINE));
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    function recalc() {
      const available = row.clientWidth;
      const widths = Array.from(measure.children).map(
        (b) => b.getBoundingClientRect().width
      );
      const inlineWidths = widths.slice(0, MAX_INLINE);
      const total = inlineWidths.reduce((a, b) => a + b, 0);
      const everythingFits = total <= available && ADMIN_NAV_ITEMS.length <= MAX_INLINE;

      if (everythingFits) {
        setVisibleCount(ADMIN_NAV_ITEMS.length);
        return;
      }

      const budget = available - MORE_BUTTON_WIDTH;
      let used = 0;
      let count = 0;
      for (let i = 0; i < inlineWidths.length; i++) {
        if (used + inlineWidths[i] > budget) break;
        used += inlineWidths[i];
        count++;
      }
      setVisibleCount(Math.max(Math.min(count, MAX_INLINE), 1));
    }

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(row);
    window.addEventListener("resize", recalc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleClick(item) {
    setOpen(false);
    onSelectSection(item.id);
  }

  const primary = ADMIN_NAV_ITEMS.slice(0, visibleCount);
  const overflow = ADMIN_NAV_ITEMS.slice(visibleCount);
  const overflowActive = overflow.some((i) => i.id === activeSection);

  return (
    <nav
      className="sticky top-16 z-20 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 border-b border-white/10 shadow-card"
      aria-label="Admin sections"
    >
      <div ref={rowRef} className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-8 flex items-stretch h-12 relative">
        <div className="min-w-0 flex items-center gap-1 overflow-hidden">
          {primary.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeSection;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item)}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative flex items-center gap-2 px-3 lg:px-3.5 h-12 text-sm font-semibold whitespace-nowrap transition-colors shrink-0",
                  isActive
                    ? "text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/5",
                ].join(" ")}
              >
                <Icon className={["h-4 w-4 shrink-0", isActive && "text-cyan-300"].join(" ")} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="adminnav-underline"
                    className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Hidden mirror for measuring */}
        <div
          ref={measureRef}
          aria-hidden="true"
          className="absolute -top-[9999px] left-0 flex items-center gap-1 invisible pointer-events-none"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <span
                key={item.id}
                className="relative flex items-center gap-2 px-3 lg:px-3.5 h-12 text-sm font-semibold whitespace-nowrap shrink-0"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </span>
            );
          })}
        </div>

        {overflow.length > 0 && (
          <div ref={moreRef} className="relative flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className={[
                "relative flex items-center gap-1.5 px-3 lg:px-3.5 h-12 text-sm font-semibold whitespace-nowrap transition-colors",
                overflowActive || open
                  ? "text-white bg-white/5"
                  : "text-slate-300 hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span>More</span>
              <ChevronDown className={["h-3.5 w-3.5 transition-transform", open && "rotate-180"].join(" ")} />
              {overflowActive && (
                <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-cyan-400" />
              )}
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  role="menu"
                  className="absolute right-0 top-full mt-1 w-60 rounded-xl bg-navy-900 border border-white/10 shadow-card-hover p-1.5 z-50"
                >
                  {overflow.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeSection;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => handleClick(item)}
                        className={[
                          "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                          isActive
                            ? "bg-cyan-500/15 text-white border-l-2 border-cyan-400 pl-[10px]"
                            : "text-slate-300 hover:bg-white/5 hover:text-white",
                        ].join(" ")}
                      >
                        <Icon className={["h-4 w-4 shrink-0", isActive && "text-cyan-300"].join(" ")} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </nav>
  );
}
