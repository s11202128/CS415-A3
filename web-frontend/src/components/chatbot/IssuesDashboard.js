import { useEffect, useMemo, useState } from "react";
import "./chatbot.css";

/**
 * IssuesDashboard – admin/staff view to review chatbot issues.
 *
 * All endpoints are admin-protected, so an auth token must be supplied.
 *
 * Props:
 *  - authToken (string)  – admin Bearer token. Required for live data.
 *  - apiBase   (string)  – defaults to /api
 */
export default function IssuesDashboard({ authToken, apiBase = "/api" }) {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("all"); // all | resolved | unresolved
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const authHeaders = useMemo(
    () => (authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    [authToken]
  );

  async function load() {
    if (!authToken) {
      setError("Admin token required to view chatbot issues.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [issuesRes, statsRes] = await Promise.all([
        fetch(`${apiBase}/chatbot/issues`, { headers: authHeaders }),
        fetch(`${apiBase}/chatbot/stats`, { headers: authHeaders }),
      ]);
      if (!issuesRes.ok) throw new Error(`Failed to load issues (${issuesRes.status})`);
      if (!statsRes.ok) throw new Error(`Failed to load stats (${statsRes.status})`);
      setIssues(await issuesRes.json());
      setStats(await statsRes.json());
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    if (!authToken) return;
    try {
      const res = await fetch(`${apiBase}/chatbot/export.csv`, { headers: authHeaders });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat_issues_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Export failed");
    }
  }

  useEffect(() => {
    load();
  }, [authToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return issues.filter((i) => {
      if (tab !== "all" && i.status !== tab) return false;
      if (category !== "all" && i.category !== category) return false;
      if (
        term &&
        !i.customerName.toLowerCase().includes(term) &&
        !i.query.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [issues, tab, category, search]);

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
      <h2>Chatbot Issues Dashboard</h2>

      {stats && (
        <div className="bof-issues-stats">
          <div className="bof-stat-card">
            <div className="label">Total</div>
            <div className="value">{stats.totalIssues}</div>
          </div>
          <div className="bof-stat-card">
            <div className="label">Resolved</div>
            <div className="value">{stats.resolvedCount}</div>
          </div>
          <div className="bof-stat-card">
            <div className="label">Unresolved</div>
            <div className="value">{stats.unresolvedCount}</div>
          </div>
          <div className="bof-stat-card">
            <div className="label">Avg Rating</div>
            <div className="value">{stats.averageRating || "—"}</div>
          </div>
          <div className="bof-stat-card">
            <div className="label">Resolution Rate</div>
            <div className="value">{stats.resolutionRate}%</div>
          </div>
        </div>
      )}

      <div className="bof-issues-controls">
        <input
          type="text"
          placeholder="Search by customer or query..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <div className="bof-issues-tabs">
          {["all", "resolved", "unresolved"].map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          <option value="account">Account</option>
          <option value="fees">Fees</option>
          <option value="card">Card</option>
          <option value="loan">Loan</option>
          <option value="transfer">Transfer</option>
          <option value="general">General</option>
          <option value="fraud">Fraud</option>
          <option value="other">Other</option>
        </select>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        <button onClick={exportCsv} disabled={loading || !authToken}>
          Export CSV
        </button>
      </div>

      {error && <p style={{ color: "#b00020" }}>{error}</p>}

      <div style={{ overflowX: "auto" }}>
        <table className="bof-issues-table">
          <thead>
            <tr>
              <th>Issue ID</th>
              <th>Customer</th>
              <th>Category</th>
              <th>Query</th>
              <th>Response</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#777", padding: 20 }}>
                  {loading ? "Loading..." : "No issues found."}
                </td>
              </tr>
            )}
            {filtered.map((i) => (
              <tr key={i.issueId}>
                <td style={{ fontFamily: "monospace", fontSize: 11 }}>
                  {i.issueId.slice(0, 8)}…
                </td>
                <td>
                  {i.customerName}
                  {i.customerEmail && (
                    <div style={{ fontSize: 11, color: "#666" }}>{i.customerEmail}</div>
                  )}
                </td>
                <td style={{ textTransform: "capitalize" }}>{i.category}</td>
                <td style={{ maxWidth: 240 }}>{i.query}</td>
                <td style={{ maxWidth: 280 }}>{i.response}</td>
                <td>
                  <span className={`bof-pill ${i.status}`}>{i.status}</span>
                </td>
                <td>
                  {i.rating ? `${i.rating} ★` : "—"}
                  {i.ratingComment && (
                    <div style={{ fontSize: 11, color: "#666", maxWidth: 160 }}>
                      “{i.ratingComment}”
                    </div>
                  )}
                </td>
                <td style={{ fontSize: 12 }}>{fmt(i.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
