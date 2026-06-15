import Link from "next/link";
import { Github, MessageSquarePlus } from "lucide-react";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import { guestbookEntries } from "../data/guestbook";

export const metadata = {
  title: "Guestbook",
  description: "路過 hawks.tw 時可以留下訊息。",
};

const signUrl =
  "https://github.com/Sean-Hawks/hawks-site/issues/new?template=guestbook.yml&title=%5BGuestbook%5D%20";

export default function GuestbookPage() {
  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-3">
        <section className="mb-8 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.88)] p-5 shadow-[0_22px_70px_rgb(var(--line)/0.10)] sm:p-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Guestbook
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">留言簿</h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
            如果你剛好逛到這裡，可以留一小段訊息。這個版本先用 GitHub issue 收留言，維護成本最低。
          </p>
          <a
            href={signUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--accent))] px-4 py-2 text-sm font-bold text-[rgb(var(--accent-foreground))] transition-opacity hover:opacity-90"
          >
            <Github className="h-4 w-4" />
            留言
          </a>
        </section>

        <div className="space-y-3">
          {guestbookEntries.map((entry) => (
            <article
              key={`${entry.name}-${entry.date}`}
              className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-5 shadow-[0_18px_60px_rgb(var(--line)/0.07)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold">{entry.name}</h2>
                <time className="text-xs text-[rgb(var(--muted))]">{entry.date}</time>
              </div>
              <p className="mt-3 leading-7 text-[rgb(var(--muted))]">{entry.message}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.035)] p-5 text-sm leading-7 text-[rgb(var(--muted))]">
          留言送出後會先進 GitHub issue。想顯示在這頁時，把內容整理到{" "}
          <code className="rounded bg-[rgb(var(--line)/0.06)] px-1.5 py-0.5">app/data/guestbook.ts</code>
          {" "}就可以。
        </div>

        <div className="mt-6">
          <Link href="/contact" className="text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]">
            想私下聯絡可以走 Contact
          </Link>
        </div>
      </main>
    </div>
  );
}
