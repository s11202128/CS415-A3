import { useState } from "react";

/**
 * RatingPrompt – inline 1-5 star rating with optional comment.
 *
 * Props:
 *  - issueId: string                – id of the ChatIssue to rate
 *  - onSubmitted(updatedIssue):void – called after the rating POST succeeds
 *  - apiBase?: string               – defaults to /api
 */
export default function RatingPrompt({ issueId, onSubmitted, apiBase = "/api" }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!rating) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/chatbot/rate/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, ratingComment: comment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit rating");
      }
      const updated = await res.json();
      setDone(true);
      if (onSubmitted) onSubmitted(updated);
    } catch (err) {
      setError(err.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return <div className="bof-rating bof-rating-thanks">Thank you for your feedback!</div>;
  }

  return (
    <div className="bof-rating">
      <div>How was your experience?</div>
      <div className="bof-rating-stars" role="radiogroup" aria-label="Rate this response">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`bof-rating-star ${(hover || rating) >= n ? "active" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        placeholder="Tell us more... (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
      />
      {error && <div style={{ color: "#b00020", fontSize: 12, marginTop: 4 }}>{error}</div>}
      <button className="submit" disabled={!rating || submitting} onClick={submit}>
        {submitting ? "Sending..." : "Submit Rating"}
      </button>
    </div>
  );
}
