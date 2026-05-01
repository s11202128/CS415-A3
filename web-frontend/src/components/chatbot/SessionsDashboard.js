import { useEffect, useMemo, useState } from "react";
import "./chatbot.css";

/**
 * SessionsDashboard – admin view grouping issues by session_id.
 * Shows aggregate status, per-session rating, and lets the admin drill
 * into a single session's full message thread.
 */
export default function SessionsDashboard({ authToken, apiBase = "/api" }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all"); // all | open | resolved | unresolved
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const headers = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    [authToken]
  );

  async function load() {
    if (!authToken) {
      setError("Admin token required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/chatbot/sessions`, { headers });
      if (!res.ok) throw new Error(`Failed to load sessions (${res.status})`);
      setSessions(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSession(id) {
    setSelectedId(id);
    setSelectedLoading(true);
    setSelected(null);
    try {
      const res = await fetch(`${apiBase}/chatbot/sessions/${id}`, { headers });
      if (!res.ok) throw new Error(`Failed to load session (${res.status})`);
      setSelected(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setSelectedLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const filtered = useMemo(() => {
    if (tab === "all") return sessions;
    return sessions.filter((s) => s.status === tab);
  }, [sessions, tab]);

  function fmt(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div className="bof-issues-dashboard">
      <h2>Chatbot Sessions</h2>

      <div className="bof-issues-controls">
        <div className="bof-issues-tabs">
          {["all", "open", "resolved", "unresolved"].map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <p style={{ color: "#b00020" }}>{error}</p>}

      <div style={{ overflowX: "auto" }}>
        <table className="bof-issues-table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Customer</th>
              <th>Summary</th>
              <th>Messages</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Started</th>
              <th>Ended</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "#777", padding: 20 }}>
                  {loading ? "Loading..." : "No sessions found."}
                </td>
              </tr>
            )}
            {filtered.map((s) => (
              <tr key={s.sessionId}>
                <td style={{ fontFamily: "monospace", fontSize: 11 }}>
                  {s.sessionId.slice(0, 12)}…
                </td>
                <td>
                  {s.customerName}
                  {s.customerEmail && (
                    <div style={{ fontSize: 11, color: "#666" }}>{s.customerEmail}</div>
                  )}
                </td>
                <td style={{ maxWidth: 300 }}>{s.summary || "—"}</td>
                <td style={{ textAlign: "center" }}>{s.messageCount}</td>
                <td>
                  <span className={`bof-pill ${s.status === "open" ? "unresolved" : s.status}`}>
                    {s.status}
                  </span>
                </td>
                <td>
                  {s.rating ? `${s.rating} ★` : "—"}
                  {s.comment && (
                    <div style={{ fontSize: 11, color: "#666", maxWidth: 160 }}>
                      “{s.comment}”
                    </div>
                  )}
                </td>
                <td style={{ fontSize: 12 }}>{fmt(s.startedAt)}</td>
                <td style={{ fontSize: 12 }}>{fmt(s.endedAt)}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => loadSession(s.sessionId)}
                    style={{ fontSize: 12 }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <div
          className="bof-session-modal-backdrop"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bof-session-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bof-session-modal-header">
              <strong>Session thread</strong>
              <button onClick={() => setSelectedId(null)} aria-label="Close">×</button>
            </div>
            {selectedLoading && <p>Loading...</p>}
            {selected && (
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                  <div><b>ID:</b> {selected.sessionId}</div>
                  <div><b>Customer:</b> {selected.customerName} {selected.customerEmail && `(${selected.customerEmail})`}</div>
                  <div><b>Status:</b> {selected.status} · <b>Messages:</b> {selected.messageCount}</div>
                  <div><b>Rating:</b> {selected.rating ? `${selected.rating} ★` : "—"} {selected.comment && `— "${selected.comment}"`}</div>
                </div>
                <div className="bof-session-thread">
                  {(selected.issues || []).map((it) => (
                    <div key={it.issueId} className="bof-session-turn">
                      <div className="bof-session-q"><b>Customer:</b> {it.query}</div>
                      <div className="bof-session-a"><b>Bot:</b> {it.response}</div>
                      <div className="bof-session-meta">
                        <span className={`bof-pill ${it.status}`}>{it.status}</span>
                        <span style={{ marginLeft: 8 }}>{fmt(it.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
