import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

export default function CreditCardPanel({ currentUser }) {
  const [cardNumber, setCardNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [card, setCard] = useState(null);
  const [myCards, setMyCards] = useState([]);
  const [chargeAmount, setChargeAmount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const resolvedCustomerId = useMemo(
    () => String(currentUser?.customerId || currentUser?.userId || ""),
    [currentUser],
  );

  async function loadMyCards() {
    const result = await api.getMyCreditCards();
    const items = Array.isArray(result?.items) ? result.items : [];
    setMyCards(items);
    if (items.length > 0) {
      const selected = items.find((x) => x.cardNumber === card?.cardNumber) || items[0];
      setCard(selected);
    } else {
      setCard(null);
    }
  }

  useEffect(() => {
    setCustomerId(resolvedCustomerId);
  }, [resolvedCustomerId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadMyCards();
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load your credit cards");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function validateAmount(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      throw new Error("Amount must be a positive number");
    }
    return num;
  }

  async function refresh(id) {
    await loadMyCards();
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const linkedCustomerId = String(customerId || resolvedCustomerId || "");
      if (!linkedCustomerId) {
        throw new Error("Missing customer profile. Please log in again.");
      }
      await api.createCreditCard({
        cardNumber,
        customerId: linkedCustomerId,
        creditLimit: Number(creditLimit),
      });
      setCardNumber("");
      setCreditLimit("");
      await loadMyCards();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCharge() {
    setError("");
    setBusy(true);
    try {
      const amount = validateAmount(chargeAmount);
      if (card && amount > card.availableCredit) {
        throw new Error("Charge exceeds available credit");
      }
      await api.chargeCreditCard(card.cardNumber, amount);
      setChargeAmount("");
      await refresh(card.cardNumber);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePayment() {
    setError("");
    setBusy(true);
    try {
      const amount = validateAmount(paymentAmount);
      await api.payCreditCard(card.cardNumber, amount);
      setPaymentAmount("");
      await refresh(card.cardNumber);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="credit-card-panel" style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, maxWidth: 520 }}>
      <h3>Credit Card</h3>
      {!card && (
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 8 }}>
          <label>Card Number: <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required /></label>
          <label>Customer ID: <input value={customerId} required readOnly /></label>
          <label>Credit Limit: <input type="number" min="1" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} required /></label>
          <button type="submit" disabled={busy}>Create Card</button>
        </form>
      )}

      {card && (
        <div>
          {myCards.length > 1 && (
            <label style={{ display: "block", marginBottom: 8 }}>
              Card:
              <select
                value={card.cardNumber}
                onChange={(e) => {
                  const selected = myCards.find((x) => x.cardNumber === e.target.value);
                  setCard(selected || null);
                }}
                style={{ marginLeft: 8 }}
              >
                {myCards.map((x) => (
                  <option key={x.cardNumber} value={x.cardNumber}>{x.cardNumber}</option>
                ))}
              </select>
            </label>
          )}
          <p>Card: {card.cardNumber}</p>
          <p>Limit: ${Number(card.creditLimit).toFixed(2)}</p>
          <p>Current Balance: ${Number(card.currentBalance).toFixed(2)}</p>
          <p>Available Credit: ${Number(card.availableCredit).toFixed(2)}</p>

          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            <div>
              <input type="number" min="0" step="0.01" placeholder="Charge amount" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} />
              <button type="button" onClick={handleCharge} disabled={busy}>Charge</button>
            </div>
            <div>
              <input type="number" min="0" step="0.01" placeholder="Payment amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
              <button type="button" onClick={handlePayment} disabled={busy}>Make Payment</button>
            </div>
          </div>
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
    </div>
  );
}
