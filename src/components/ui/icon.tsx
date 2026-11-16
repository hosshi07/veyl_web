export function Arrow({
  diagonal = false,
  className = "",
}: {
  diagonal?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      {diagonal ? (
        <path d="M5 19 19 5M5 5h14v14" />
      ) : (
        <path d="M3 12h17m-6-6 6 6-6 6" />
      )}
    </svg>
  );
}
export function GateMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="32"
      viewBox="0 0 28 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="M3 29V4L14 1l11 3v25M8 27V8l6-2 6 2v19M14 6v26M0 29h10m8 0h10" />
    </svg>
  );
}
