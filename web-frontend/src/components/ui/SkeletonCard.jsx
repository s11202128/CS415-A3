/**
 * SkeletonCard — animated shimmer placeholder for loading states.
 */
export default function SkeletonCard({ rows = 3, className = "" }) {
  return (
    <div className={["bof-card space-y-3", className].join(" ")}>
      <div className="bof-skeleton h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bof-skeleton h-4 w-full" />
      ))}
    </div>
  );
}
