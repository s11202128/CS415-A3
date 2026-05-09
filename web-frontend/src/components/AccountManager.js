import { useState } from "react";
import AccountActions from "./AccountActions";

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) || "/api";

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export default function AccountManager() {
  const [type, setType] = useState("access");
  const [accountId, setAccountId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [owner, setOwner] = useState("");
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh(id) {
    const summary = await apiRequest(`/accounts/${encodeURIComponent(id)}/summary`);
    setAccount(summary);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const created = await apiRequest("/accounts/create", {
        method: "POST",
        body: JSON.stringify({ type, accountId, customerId, owner }),
      });
      setAccount(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-manager" style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, maxWidth: 520 }}>
      <h3>New Account</h3>
      <form onSubmit={handleCreate} style={{ display: "grid", gap: 8 }}>
        <label>
          Account Type:&nbsp;
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="access">Access</option>
            <option value="savings">Savings</option>
            <option value="business">Business</option>
          </select>
        </label>
        <label>
          Account ID:&nbsp;
          <input value={accountId} onChange={(e) => setAccountId(e.target.value)} required />
        </label>
        <label>
          Customer ID:&nbsp;
          <input type="number" min="1" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
        </label>
        <label>
          Owner:&nbsp;
          <input value={owner} onChange={(e) => setOwner(e.target.value)} required />
        </label>
        <button type="submit" disabled={busy}>Create Account</button>
      </form>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {account && (
        <div style={{ marginTop: 16 }}>
          <h4>Account #{account.accountId} ({account.accountType})</h4>
          <p>Owner: {account.owner}</p>
          <p>Balance: ${Number(account.balance).toFixed(2)}</p>
          <p>This month's fee: ${Number(account.monthlyFee).toFixed(2)}</p>

          {account.accountType === "savings" && (
            <p>Withdrawals used: {account.withdrawalCount} of 1 free used</p>
          )}

          {account.accountType === "business" && (
            <div>
              <p>Net input: ${Number(account.monthlyNetInput).toFixed(2)} of ${account.netInputThreshold}</p>
              <div style={{ background: "#eee", height: 12, borderRadius: 6, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (Number(account.monthlyNetInput) / Number(account.netInputThreshold)) * 100))}%`,
                    background: Number(account.monthlyNetInput) >= Number(account.netInputThreshold) ? "seagreen" : "orange",
                    height: "100%",
                  }}
                />
              </div>
            </div>
          )}

          <AccountActions accountId={account.accountId} onChanged={() => refresh(account.accountId)} />
        </div>
      )}
    </div>
  );
}
