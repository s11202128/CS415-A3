import { useEffect, useState } from "react";

/**
 * MyChatbotHistory – customer-facing list of their own past chatbot Q&As.
 * Loads from the auth-protected /api/chatbot/my-issues endpoint.
 */
export default function MyChatbotHistory({ apiBase = "/api", authToken }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!authToken) {
        setError("Sign in to view your chat history.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiBase}/chatbot/my-issues`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) {
          throw new Error(`Failed to load (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiBase, authToken]);

  return (
    <div className="bof-chatbot-history" aria-live="polite">
      <div className="bof-chatbot-history-title">Your past conversations</div>
      {loading && <div className="bof-chatbot-history-empty">Loading...</div>}
      {error && (
        <div className="bof-chatbot-history-empty" style={{ color: "#b00020" }}>
          {error}
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="bof-chatbot-history-empty">
          No past conversations yet.
        </div>
      )}
      {items.map((it) => (
        <div key={it.issueId} className="bof-chatbot-history-item">
          <div className="bof-chatbot-history-meta">
            <span className={`bof-pill ${it.status}`}>{it.status}</span>
            <span className="bof-chatbot-history-cat">{it.category}</span>
            <span className="bof-chatbot-history-date">
              {new Date(it.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="bof-chatbot-history-q">
            <strong>You:</strong> {it.query}
          </div>
          <div className="bof-chatbot-history-a">
            <strong>Bot:</strong> {it.response}
          </div>
          {it.rating ? (
            <div className="bof-chatbot-history-rating">
              Your rating: {"★".repeat(it.rating)}
              {"☆".repeat(5 - it.rating)}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
