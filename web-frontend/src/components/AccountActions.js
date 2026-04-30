import { useState } from "react";

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

export default function AccountActions({ accountId, onChanged }) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function validateAmount(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      throw new Error("Amount must be a positive number");
    }
    return num;
  }

  async function handleDeposit() {
    setError("");
    setBusy(true);
    try {
      const amount = validateAmount(depositAmount);
      await apiRequest(`/accounts/${encodeURIComponent(accountId)}/deposit`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      setDepositAmount("");
      if (onChanged) await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    setError("");
    setBusy(true);
    try {
      const amount = validateAmount(withdrawAmount);
      await apiRequest(`/accounts/${encodeURIComponent(accountId)}/withdraw`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      setWithdrawAmount("");
      if (onChanged) await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="account-actions" style={{ marginTop: 12, display: "grid", gap: 8 }}>
      <div>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Deposit amount"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
        />
        <button type="button" onClick={handleDeposit} disabled={busy}>Deposit</button>
      </div>
      <div>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Withdraw amount"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
        />
        <button type="button" onClick={handleWithdraw} disabled={busy}>Withdraw</button>
      </div>
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
    </div>
  );
}
