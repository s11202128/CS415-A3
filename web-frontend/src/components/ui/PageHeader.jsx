import { motion } from "framer-motion";

/**
 * PageHeader — premium gradient header used at the top of every customer page.
 * Provides consistent visual hierarchy across all tabs.
 */
export default function PageHeader({ icon: Icon, eyebrow, title, description, actions }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-cyan-700 text-white shadow-card-hover mb-6"
    >
      <div className="absolute -top-16 -right-12 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-teal-300/15 blur-3xl" />
      <div className="relative px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="grid place-items-center h-12 w-12 rounded-2xl bg-white/15 backdrop-blur shrink-0">
              <Icon className="h-6 w-6 text-cyan-200" />
            </div>
          )}
          <div>
            {eyebrow && (
              <p className="text-[11px] uppercase tracking-widest text-cyan-200/90 font-semibold">{eyebrow}</p>
            )}
            <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">{title}</h1>
            {description && <p className="mt-1 text-sm text-cyan-50/80 max-w-2xl">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </motion.header>
  );
}
