type ImdbRatingProps = {
  rating: number | null;
  href?: string;
  compact?: boolean;
};

export default function ImdbRating({
  rating,
  href,
  compact = false,
}: ImdbRatingProps) {
  const content = (
    <>
      <span className="rounded-[3px] bg-[#f5c518] px-1.5 py-0.5 font-sans text-[10px] font-black leading-none text-black">
        IMDb
      </span>
      <span className="font-semibold text-[rgb(var(--text))]">
        {rating === null ? "N/A" : rating.toFixed(1)}
      </span>
    </>
  );
  const className = [
    "inline-flex w-fit items-center rounded-md border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))]",
    compact ? "gap-1 px-1.5 py-1 text-[10px]" : "gap-2 px-2 py-1 text-xs",
  ].join(" ");

  if (!href) {
    return <span className={className}>{content}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} transition-colors hover:border-[#f5c518]/70`}
      aria-label={`Open IMDb rating: ${rating === null ? "not available" : rating.toFixed(1)}`}
    >
      {content}
    </a>
  );
}
