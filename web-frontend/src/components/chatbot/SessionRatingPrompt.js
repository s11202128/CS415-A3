import { useState } from "react";

/**
 * SessionRatingPrompt – one rating per chat session, shown after the user
 * ends the session. POSTs to /api/chatbot/sessions/:sessionId/rate.
 */
export default function SessionRatingPrompt({
  sessionId,
  apiBase = "/api",
  onSubmitted,
}) {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (done) {
    return (
      <div className="bof-rating bof-rating-thanks" role="status">
        Thank you for rating this session!
      </div>
    );
  }

  async function submit() {
    if (!rating) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/chatbot/sessions/${sessionId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit rating");
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
    <div className="bof-rating" role="group" aria-label="Rate this session">
      <div>How would you rate this support session?</div>
      <div className="bof-rating-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`bof-rating-star ${
              n <= (hover || rating) ? "active" : ""
            }`}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        placeholder="Optional feedback..."
        maxLength={500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <div style={{ color: "#b00020", fontSize: 12 }}>{error}</div>}
      <button
        type="button"
        className="submit"
        disabled={!rating || submitting}
        onClick={submit}
      >
        {submitting ? "Submitting..." : "Submit rating"}
      </button>
    </div>
  );
}
