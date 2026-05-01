import { useState } from "react";

/**
 * EscalationForm – inline "Talk to a human" callback request.
 * Shown after any unresolved bot reply.
 *
 * Props:
 *  - issueId        – originating ChatIssue id
 *  - defaultName    – pre-filled customer name
 *  - defaultEmail   – pre-filled customer email
 *  - customerId     – numeric id if logged in
 *  - apiBase        – defaults to /api
 *  - onSubmitted()  – called after successful POST
 */
export default function EscalationForm({
  issueId,
  defaultName = "",
  defaultEmail = "",
  customerId = null,
  apiBase = "/api",
  onSubmitted,
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (done) {
    return (
      <div className="bof-escalation done" role="status">
        ✅ Thanks — our support team will reach out to you soon.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="bof-escalation-cta"
        onClick={() => setOpen(true)}
      >
        🧑‍💼 Talk to a human
      </button>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/chatbot/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          customerName: defaultName || "Guest",
          customerEmail: defaultEmail || null,
          customerId,
          phone: phone.trim() || null,
          bestTime: bestTime.trim() || null,
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send request");
      }
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="bof-escalation" onSubmit={submit}>
      <div className="bof-escalation-title">Request a human callback</div>
      <label>
        Phone (optional)
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+679 ..."
        />
      </label>
      <label>
        Best time to call (optional)
        <input
          type="text"
          value={bestTime}
          onChange={(e) => setBestTime(e.target.value)}
          placeholder="e.g. weekday mornings"
        />
      </label>
      <label>
        Message <span style={{ color: "#b00020" }}>*</span>
        <textarea
          required
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe what you need help with..."
        />
      </label>
      {error && <div style={{ color: "#b00020", fontSize: 12 }}>{error}</div>}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="submit"
        >
          {submitting ? "Sending..." : "Send request"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bof-escalation-cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
