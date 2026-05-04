import { useState } from "react";
import IssuesDashboard from "../chatbot/IssuesDashboard";
import SessionsDashboard from "../chatbot/SessionsDashboard";

export default function AdminChatbotTab({ authToken }) {
  const [subTab, setSubTab] = useState("issues"); // "issues" | "sessions"

  return (
    <div className="admin-chatbot" style={{ display: "grid", gap: 16 }}>
      <header>
        <h2>Chatbot Management</h2>
        <p style={{ color: "#555", marginTop: -4 }}>
          Review every chatbot conversation, drill into individual sessions, and
          export issues for audit. Switch between an issue-level and a
          session-level view using the tabs below.
        </p>
        <div
          role="tablist"
          aria-label="Chatbot sub-sections"
          style={{
            display: "inline-flex",
            gap: 6,
            marginTop: 12,
            padding: 4,
            border: "1px solid #d8dee9",
            borderRadius: 999,
            background: "#f5f7fb",
          }}
        >
          {[
            { id: "issues", label: "Issues" },
            { id: "sessions", label: "Sessions" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={subTab === t.id}
              onClick={() => setSubTab(t.id)}
              style={{
                padding: "6px 16px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                background: subTab === t.id ? "#0a1733" : "transparent",
                color: subTab === t.id ? "#fff" : "#1f2a44",
                transition: "background 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {!authToken && (
        <p style={{ color: "#b00020" }}>
          You must be logged in as an admin to view chatbot data.
        </p>
      )}

      {subTab === "issues" && <IssuesDashboard authToken={authToken} />}
      {subTab === "sessions" && <SessionsDashboard authToken={authToken} />}
    </div>
  );
}
