import Link from "next/link";
import { ArrowLeft, Calendar, Presentation, Video } from "lucide-react";
import { getSortedTalksData } from "../../lib/talks";
import ThemeStyles from "../../components/ThemeStyles";
import Header from "../../components/Header";
import MarkdownContent from "../../components/MarkdownContent";

export async function generateStaticParams() {
  const talks = getSortedTalksData();
  return talks.map((talk) => ({
    slug: talk.id,
  }));
}

export default function TalkDetailPage({ params }: { params: { slug: string } }) {
  const talks = getSortedTalksData();
  const talk = talks.find((t) => t.id === params.slug);

  if (!talk) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
        <ThemeStyles />
        <Header />
        <main className="p-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Talk 未找到</h1>
          <Link href="/talk" className="mt-4 text-[rgb(var(--accent))] hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            回到 Talks
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-3">
        <main className="max-w-4xl mx-auto py-8">
          <Link 
            href="/talk"
            className="group inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))] transition-colors mb-6"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgba(255,255,255,0.06)] group-hover:bg-[rgba(251,191,36,0.1)] transition-colors">
                <ArrowLeft className="h-4 w-4" />
            </div>
            <span>回到 Talks</span>
          </Link>

          <article className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgb(var(--panel))] overflow-hidden shadow-xl">
            <div className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-10">
                <div className="flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--muted))] mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {talk.date}
                  </span>
                  {talk.event && (
                    <span className="rounded bg-[rgba(255,255,255,0.06)] px-2.5 py-0.5 text-xs">
                      {talk.event}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-[rgb(var(--text))]">
                    {talk.title}
                </h1>

                <div className="mt-6 flex gap-3">
                  {talk.slides && (
                    <a href={talk.slides} target="_blank" className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-4 py-2 text-sm font-bold text-black hover:opacity-90 transition-opacity">
                      <Presentation className="h-4 w-4" /> View Slides
                    </a>
                  )}
                  {talk.video && (
                    <a href={talk.video} target="_blank" className="inline-flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.1)] px-4 py-2 text-sm font-medium text-[rgb(var(--text))] hover:bg-[rgba(255,255,255,0.15)] transition-colors">
                      <Video className="h-4 w-4" /> Watch Video
                    </a>
                  )}
                </div>
            </div>

            <div className="p-6 sm:p-10">
                <MarkdownContent content={talk.desc} />
            </div>
          </article>
        </main>

        <footer className="mx-auto max-w-3xl px-4 pb-10 pt-8 text-xs text-[rgb(var(--muted))] text-center">
          <div className="opacity-70">© {new Date().getFullYear()} Hawks</div>
        </footer>
      </div>
    </div>
  );
}
