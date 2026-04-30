import { useEffect, useState, useCallback } from "react";

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
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

function validatePositive(value, label = "Amount") {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return num;
}

export default function AdminAccountLabTab() {
  // Bank-account state
  const [accounts, setAccounts] = useState([]);
  const [createForm, setCreateForm] = useState({ type: "access", accountId: "", owner: "" });
  const [actionForm, setActionForm] = useState({ accountId: "", amount: "" });
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");

  // Credit-card state
  const [cards, setCards] = useState([]);
  const [cardForm, setCardForm] = useState({ cardNumber: "", customerId: "", creditLimit: "" });
  const [cardActionForm, setCardActionForm] = useState({ cardNumber: "", amount: "" });
  const [cardMessage, setCardMessage] = useState("");
  const [cardError, setCardError] = useState("");

  const [busy, setBusy] = useState(false);

  const refreshAccounts = useCallback(async () => {
    try {
      const data = await apiRequest("/accounts/list");
      setAccounts(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setAccountError(err.message);
    }
  }, []);

  const refreshCards = useCallback(async () => {
    try {
      const data = await apiRequest("/creditcard/list");
      setCards(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setCardError(err.message);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
    refreshCards();
  }, [refreshAccounts, refreshCards]);

  // ---------- Bank account handlers ----------
  async function handleCreateAccount(e) {
    e.preventDefault();
    setAccountError("");
    setAccountMessage("");
    setBusy(true);
    try {
      if (!createForm.accountId.trim()) throw new Error("Account ID is required");
      if (!createForm.owner.trim()) throw new Error("Owner is required");
      const created = await apiRequest("/accounts/create", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setAccountMessage(`Created ${created.accountType} account ${created.accountId}`);
      setCreateForm({ type: "access", accountId: "", owner: "" });
      await refreshAccounts();
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAccountAction(action) {
    setAccountError("");
    setAccountMessage("");
    setBusy(true);
    try {
      if (!actionForm.accountId.trim()) throw new Error("Select an account");
      const amount = validatePositive(actionForm.amount);
      const result = await apiRequest(`/accounts/${encodeURIComponent(actionForm.accountId)}/${action}`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      setAccountMessage(`${action} of $${amount.toFixed(2)} OK. New balance: $${Number(result.balance).toFixed(2)}`);
      setActionForm((f) => ({ ...f, amount: "" }));
      await refreshAccounts();
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleApplyMonthlyFees() {
    setAccountError("");
    setAccountMessage("");
    setBusy(true);
    try {
      const result = await apiRequest("/accounts/apply-monthly-fees", { method: "POST" });
      setAccountMessage(`Processed ${result.processed} account(s).`);
      await refreshAccounts();
    } catch (err) {
      setAccountError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // ---------- Credit card handlers ----------
  async function handleCreateCard(e) {
    e.preventDefault();
    setCardError("");
    setCardMessage("");
    setBusy(true);
    try {
      if (!cardForm.cardNumber.trim()) throw new Error("Card number is required");
      if (!cardForm.customerId.trim()) throw new Error("Customer ID is required");
      const limit = validatePositive(cardForm.creditLimit, "Credit limit");
      const created = await apiRequest("/creditcard/create", {
        method: "POST",
        body: JSON.stringify({
          cardNumber: cardForm.cardNumber,
          customerId: cardForm.customerId,
          creditLimit: limit,
        }),
      });
      setCardMessage(`Created card ${created.cardNumber} for customer ${created.customerId}`);
      setCardForm({ cardNumber: "", customerId: "", creditLimit: "" });
      await refreshCards();
    } catch (err) {
      setCardError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCardAction(action) {
    setCardError("");
    setCardMessage("");
    setBusy(true);
    try {
      if (!cardActionForm.cardNumber.trim()) throw new Error("Select a card");
      const amount = validatePositive(cardActionForm.amount);
      await apiRequest(`/creditcard/${encodeURIComponent(cardActionForm.cardNumber)}/${action}`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      setCardMessage(`${action} of $${amount.toFixed(2)} OK on card ${cardActionForm.cardNumber}`);
      setCardActionForm((f) => ({ ...f, amount: "" }));
      await refreshCards();
    } catch (err) {
      setCardError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-account-lab" style={{ display: "grid", gap: 24 }}>
      <header>
        <h2>Business (Admin)</h2>
        <p style={{ color: "#555", marginTop: -4 }}>
          Manage the new business-layer accounts (Access / Savings / Business) and the
          standalone Credit Card product. These sit alongside, but separate from, the
          existing customer accounts.
        </p>
      </header>

      {/* ================= BANK ACCOUNTS ================= */}
      <section className="panel" style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h3>Bank Accounts</h3>

        <form onSubmit={handleCreateAccount} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, alignItems: "end", marginBottom: 12 }}>
          <label>
            Type
            <select
              value={createForm.type}
              onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
            >
              <option value="access">Access</option>
              <option value="savings">Savings</option>
              <option value="business">Business</option>
            </select>
          </label>
          <label>
            Account ID
            <input
              value={createForm.accountId}
              onChange={(e) => setCreateForm({ ...createForm, accountId: e.target.value })}
            />
          </label>
          <label>
            Owner
            <input
              value={createForm.owner}
              onChange={(e) => setCreateForm({ ...createForm, owner: e.target.value })}
            />
          </label>
          <button type="submit" disabled={busy}>Create Account</button>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, alignItems: "end", marginBottom: 12 }}>
          <label>
            Account
            <select
              value={actionForm.accountId}
              onChange={(e) => setActionForm({ ...actionForm, accountId: e.target.value })}
            >
              <option value="">-- select --</option>
              {accounts.map((a) => (
                <option key={a.accountId} value={a.accountId}>
                  {a.accountId} ({a.accountType}) - {a.owner}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={actionForm.amount}
              onChange={(e) => setActionForm({ ...actionForm, amount: e.target.value })}
            />
          </label>
          <button type="button" onClick={() => handleAccountAction("deposit")} disabled={busy}>Deposit</button>
          <button type="button" onClick={() => handleAccountAction("withdraw")} disabled={busy}>Withdraw</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button type="button" onClick={refreshAccounts} disabled={busy}>Refresh</button>
          <button type="button" onClick={handleApplyMonthlyFees} disabled={busy}>
            Run Month-End (Apply Fees + Reset)
          </button>
        </div>

        {accountMessage && <p className="status" style={{ color: "seagreen" }}>{accountMessage}</p>}
        {accountError && <p className="status error" style={{ color: "crimson" }}><strong>Error:</strong> {accountError}</p>}

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
              <th style={{ padding: 6 }}>Account ID</th>
              <th>Type</th>
              <th>Owner</th>
              <th>Balance</th>
              <th>Monthly Fee</th>
              <th>Tracker</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 12, color: "#888" }}>No accounts yet.</td></tr>
            )}
            {accounts.map((a) => (
              <tr key={a.accountId} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 6 }}>{a.accountId}</td>
                <td>{a.accountType}</td>
                <td>{a.owner}</td>
                <td>${Number(a.balance).toFixed(2)}</td>
                <td>${Number(a.monthlyFee).toFixed(2)}</td>
                <td>
                  {a.accountType === "savings" && (
                    <span>Withdrawals: {a.withdrawalCount} (free left: {a.freeWithdrawalsRemaining})</span>
                  )}
                  {a.accountType === "business" && (
                    <span>Net input: ${Number(a.monthlyNetInput).toFixed(2)} / ${a.netInputThreshold}</span>
                  )}
                  {a.accountType === "access" && <span>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ================= CREDIT CARDS ================= */}
      <section className="panel" style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h3>Credit Cards</h3>

        <form onSubmit={handleCreateCard} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, alignItems: "end", marginBottom: 12 }}>
          <label>
            Card Number
            <input
              value={cardForm.cardNumber}
              onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
            />
          </label>
          <label>
            Customer ID
            <input
              value={cardForm.customerId}
              onChange={(e) => setCardForm({ ...cardForm, customerId: e.target.value })}
            />
          </label>
          <label>
            Credit Limit
            <input
              type="number"
              min="1"
              step="0.01"
              value={cardForm.creditLimit}
              onChange={(e) => setCardForm({ ...cardForm, creditLimit: e.target.value })}
            />
          </label>
          <button type="submit" disabled={busy}>Create Card</button>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, alignItems: "end", marginBottom: 12 }}>
          <label>
            Card
            <select
              value={cardActionForm.cardNumber}
              onChange={(e) => setCardActionForm({ ...cardActionForm, cardNumber: e.target.value })}
            >
              <option value="">-- select --</option>
              {cards.map((c) => (
                <option key={c.cardNumber} value={c.cardNumber}>
                  {c.cardNumber} (cust {c.customerId})
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={cardActionForm.amount}
              onChange={(e) => setCardActionForm({ ...cardActionForm, amount: e.target.value })}
            />
          </label>
          <button type="button" onClick={() => handleCardAction("charge")} disabled={busy}>Charge</button>
          <button type="button" onClick={() => handleCardAction("payment")} disabled={busy}>Payment</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <button type="button" onClick={refreshCards} disabled={busy}>Refresh</button>
        </div>

        {cardMessage && <p className="status" style={{ color: "seagreen" }}>{cardMessage}</p>}
        {cardError && <p className="status error" style={{ color: "crimson" }}><strong>Error:</strong> {cardError}</p>}

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
              <th style={{ padding: 6 }}>Card Number</th>
              <th>Customer</th>
              <th>Limit</th>
              <th>Current Balance</th>
              <th>Available Credit</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 12, color: "#888" }}>No credit cards yet.</td></tr>
            )}
            {cards.map((c) => (
              <tr key={c.cardNumber} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 6 }}>{c.cardNumber}</td>
                <td>{c.customerId}</td>
                <td>${Number(c.creditLimit).toFixed(2)}</td>
                <td>${Number(c.currentBalance).toFixed(2)}</td>
                <td>${Number(c.availableCredit).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
