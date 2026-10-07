import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function CommentFeedback({
  tone,
  title,
  children,
}: {
  tone: "success" | "error" | "pending";
  title: string;
  children?: React.ReactNode;
}) {
  const Icon =
    tone === "error"
      ? AlertCircle
      : tone === "pending"
        ? Loader2
        : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-atomic="true"
      className={`flex items-start gap-3 border px-4 py-3 text-sm leading-6 ${
        tone === "error"
          ? "border-[rgb(var(--purple)/0.5)] bg-[rgb(var(--purple)/0.08)]"
          : "border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--accent)/0.08)]"
      }`}
    >
      <Icon
        size={20}
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${tone === "pending" ? "animate-spin motion-reduce:animate-none" : ""}`}
      />
      <div>
        <p className="font-semibold">{title}</p>
        {children && (
          <div className="mt-1 text-[rgb(var(--muted))]">{children}</div>
        )}
      </div>
    </div>
  );
}
