import { useEffect, useMemo, useRef, useState } from "react";
import RatingPrompt from "./RatingPrompt";
import EscalationForm from "./EscalationForm";
import MyChatbotHistory from "./MyChatbotHistory";
import SessionRatingPrompt from "./SessionRatingPrompt";
import "./chatbot.css";

// ---- helpers --------------------------------------------------------------

function newSessionId() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// Persistence key: scope to a user id (or "guest") so different sign-ins
// don't bleed messages into each other.
function storageKeyFor(currentUser) {
  const id =
    currentUser?.id || currentUser?.customerId || currentUser?.userId || "guest";
  return `bof.chatbot.v1.${id}`;
}

// Render a tiny subset of markdown safely (no dangerouslySetInnerHTML).
// Supports **bold** and [label](https://...) links. Everything else is text.
function renderRichText(text) {
  if (!text) return null;
  const parts = [];
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = linkRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index), key: key++ });
    }
    parts.push({ type: "link", label: match[1], href: match[2], key: key++ });
    lastIndex = linkRe.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex), key: key++ });
  }
  return parts.map((p) => {
    if (p.type === "link") {
      return (
        <a key={p.key} href={p.href} target="_blank" rel="noopener noreferrer">
          {p.label}
        </a>
      );
    }
    const segments = p.value.split(/(\*\*[^*]+\*\*)/g);
    return segments.map((seg, i) =>
      /^\*\*[^*]+\*\*$/.test(seg) ? (
        <strong key={`${p.key}-${i}`}>{seg.slice(2, -2)}</strong>
      ) : (
        <span key={`${p.key}-${i}`}>{seg}</span>
      )
    );
  });
}

const SUGGESTION_CHIPS = [
  "How do I check my account balance?",
  "What are the account fees?",
  "I lost my card",
  "How do I transfer money?",
  "How do I apply for a loan?",
  "How do I open an account?",
];

// Cap the persisted log so localStorage stays small.
const MAX_PERSISTED_MESSAGES = 50;

/**
 * ChatWidget – floating chatbot accessible from every page (incl. login).
 *
 * Props (all optional):
 *  - currentUser  : the logged-in user object (uses .fullName / .email / .id|.customerId)
 *  - apiBase      : API base path (defaults to /api)
 *  - authToken    : JWT for the customer-scoped /my-issues endpoint
 */
export default function ChatWidget({
  currentUser = null,
  apiBase = "/api",
  authToken = null,
}) {
  const [open, setOpen] = useState(false);
  const [identified, setIdentified] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(() => newSessionId());
  const [unread, setUnread] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);

  const storageKey = useMemo(() => storageKeyFor(currentUser), [currentUser]);

  // Auto-identify logged-in users
  useEffect(() => {
    if (currentUser && currentUser.fullName) {
      setName(currentUser.fullName);
      setEmail(currentUser.email || "");
      setIdentified(true);
    }
  }, [currentUser]);

  // Restore persisted conversation on mount / user-switch
  useEffect(() => {
    setHydrated(false);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        if (parsed.sessionId) setSessionId(parsed.sessionId);
        if (parsed.identified) setIdentified(true);
        if (parsed.name && !currentUser?.fullName) setName(parsed.name);
        if (parsed.email && !currentUser?.email) setEmail(parsed.email);
        if (parsed.sessionEnded) setSessionEnded(true);
      } else {
        // Fresh slate for a new key
        setMessages([]);
      }
    } catch {
      /* corrupt cache – ignore */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist conversation whenever it changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      const trimmed = messages.slice(-MAX_PERSISTED_MESSAGES);
      localStorage.setItem(
        storageKey,
        JSON.stringify({ sessionId, messages: trimmed, identified, name, email, sessionEnded })
      );
    } catch {
      /* quota exceeded – silently drop */
    }
  }, [messages, sessionId, identified, name, email, sessionEnded, storageKey, hydrated]);

  // Greet on first open
  useEffect(() => {
    if (open && identified && messages.length === 0) {
      setMessages([
        {
          from: "bot",
          text: `Hi ${name || "there"}! I'm the Bank of Fiji virtual assistant. Ask me about accounts, fees, cards, loans, transfers or anything else — or pick a suggestion below.`,
          time: new Date().toISOString(),
          showChips: true,
        },
      ]);
    }
  }, [open, identified]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to newest message
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Unread counter: increment when bot replies while widget is closed
  useEffect(() => {
    if (!open && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.from === "bot") setUnread((u) => u + 1);
    }
    if (open) setUnread(0);
  }, [messages, open]);

  // ESC closes; auto-focus input on open
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        setTimeout(() => fabRef.current?.focus(), 0);
      }
    }
    window.addEventListener("keydown", onKey);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function startNewConversation() {
    setSessionId(newSessionId());
    setSessionEnded(false);
    setMessages([
      {
        from: "bot",
        text: `Starting a new conversation. How can I help, ${name || "there"}?`,
        time: new Date().toISOString(),
        showChips: true,
      },
    ]);
    setInput("");
    setShowHistory(false);
  }

  async function endChat() {
    if (sessionEnded || !sessionId) return;
    // Best-effort close on the server.
    try {
      await fetch(`${apiBase}/chatbot/sessions/${sessionId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      /* ignore – local UX still continues */
    }
    setSessionEnded(true);
    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, showChips: false })),
      {
        from: "bot",
        text:
          "This chat session has been closed. Please rate your experience below, or click 'New' to start a fresh conversation.",
        time: new Date().toISOString(),
      },
    ]);
  }

  async function sendQueryText(text) {
    const clean = String(text || "").trim();
    if (!clean || sending || sessionEnded) return;
    setInput("");
    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, showChips: false })),
      { from: "user", text: clean, time: new Date().toISOString() },
    ]);
    setSending(true);
    try {
      const res = await fetch(`${apiBase}/chatbot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name || "Guest",
          customerEmail: email || null,
          customerId: currentUser?.id || currentUser?.customerId || null,
          sessionId,
          query: clean,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed");
      }
      const issue = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: issue.response,
          time: issue.createdAt,
          issueId: issue.issueId,
          status: issue.status,
          rated: false,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: `Sorry, I couldn't reach support right now (${err.message}). Please try again.`,
          time: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQueryText(input);
    }
  }

  function markRated(issueId) {
    setMessages((prev) =>
      prev.map((m) => (m.issueId === issueId ? { ...m, rated: true } : m))
    );
  }

  function markEscalated(issueId) {
    setMessages((prev) =>
      prev.map((m) => (m.issueId === issueId ? { ...m, escalated: true } : m))
    );
  }

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  // Floating bubble (closed state)
  if (!open) {
    return (
      <button
        ref={fabRef}
        className="bof-chatbot-fab"
        aria-label={
          unread > 0 ? `Open chat support (${unread} new)` : "Open chat support"
        }
        onClick={() => setOpen(true)}
        title="Chat with Bank of Fiji Support"
      >
        💬
        {unread > 0 && (
          <span className="bof-chatbot-badge" aria-hidden="true">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    );
  }

  // Open dialog
  return (
    <div
      className="bof-chatbot-window"
      role="dialog"
      aria-modal="false"
      aria-label="Bank of Fiji Support Chat"
    >
      <div className="bof-chatbot-header">
        <span>Bank of Fiji Support</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {identified && authToken && (
            <button
              className="bof-chatbot-newconv"
              onClick={() => setShowHistory((s) => !s)}
              title="View my past conversations"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
            >
              {showHistory ? "Chat" : "History"}
            </button>
          )}
          {identified && !sessionEnded && (
            <button
              className="bof-chatbot-newconv"
              onClick={endChat}
              title="End this chat session"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
            >
              End
            </button>
          )}
          {identified && (
            <button
              className="bof-chatbot-newconv"
              onClick={startNewConversation}
              title="Start a new conversation"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
            >
              New
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
      </div>

      {!identified ? (
        <div className="bof-chatbot-identify">
          <div style={{ fontSize: 14 }}>
            Welcome! Please tell us who we're chatting with.
          </div>
          <label>
            Your name <span style={{ color: "#b00020" }}>*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              autoFocus
            />
          </label>
          <label>
            Email (optional, so we can follow up)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button disabled={!name.trim()} onClick={() => setIdentified(true)}>
            Start chat
          </button>
        </div>
      ) : showHistory ? (
        <MyChatbotHistory apiBase={apiBase} authToken={authToken} />
      ) : (
        <>
          <div
            className="bof-chatbot-body"
            ref={bodyRef}
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.from === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div className={`bof-chatbot-bubble ${m.from}`}>
                  <span>{renderRichText(m.text)}</span>
                  <span className="bof-chatbot-time">{formatTime(m.time)}</span>
                </div>

                {m.from === "bot" && m.showChips && (
                  <div className="bof-chatbot-chips" role="list">
                    {SUGGESTION_CHIPS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        className="bof-chatbot-chip"
                        onClick={() => sendQueryText(q)}
                        role="listitem"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {m.from === "bot" && m.issueId && !m.rated && (
                  <RatingPrompt
                    issueId={m.issueId}
                    apiBase={apiBase}
                    onSubmitted={() => markRated(m.issueId)}
                  />
                )}

                {m.from === "bot" &&
                  m.issueId &&
                  m.status === "unresolved" &&
                  !m.escalated && (
                    <EscalationForm
                      apiBase={apiBase}
                      issueId={m.issueId}
                      defaultName={name}
                      defaultEmail={email}
                      customerId={
                        currentUser?.id || currentUser?.customerId || null
                      }
                      onSubmitted={() => markEscalated(m.issueId)}
                    />
                  )}
              </div>
            ))}
            {sending && (
              <div className="bof-chatbot-bubble bot" aria-label="Bot is typing">
                <div className="bof-chatbot-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            {sessionEnded && (
              <SessionRatingPrompt
                sessionId={sessionId}
                apiBase={apiBase}
              />
            )}
          </div>

          <div className="bof-chatbot-footer">
            <input
              ref={inputRef}
              type="text"
              placeholder={sessionEnded ? "Session ended — click 'New' to chat again" : "Type your question..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={sending || sessionEnded}
              aria-label="Type your question"
            />
            <button
              onClick={() => sendQueryText(input)}
              disabled={!input.trim() || sending || sessionEnded}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
