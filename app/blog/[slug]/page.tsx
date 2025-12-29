import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSortedPostsData, getPostBySlug } from "../../lib/posts";
import ThemeStyles from "../../components/ThemeStyles";
import Header from "../../components/Header";
import MarkdownContent from "../../components/MarkdownContent"; // Import shared component

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
        <ThemeStyles />
        <Header />
        <main className="p-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">文章未找到</h1>
          <Link href="/blog" className="mt-4 text-[rgb(var(--accent))] hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            回到 Blog
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
        <main className="max-w-5xl mx-auto py-8">
          <Link 
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))] transition-colors mb-6"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgba(255,255,255,0.06)] group-hover:bg-[rgba(251,191,36,0.1)] transition-colors">
                <ArrowLeft className="h-4 w-4" />
            </div>
            <span>回到列表</span>
          </Link>

          <article className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgb(var(--panel))] overflow-hidden shadow-xl">
            <div className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-10">
                {post.banner && (
                  <div className="-mx-6 -mt-6 mb-8 sm:-mx-10 sm:-mt-10 border-b border-[rgba(255,255,255,0.06)]">
                    <img 
                      src={post.banner} 
                      alt={post.title} 
                      className="w-full h-auto max-h-[500px] object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-md bg-[rgba(251,191,36,0.1)] text-[rgb(var(--accent))]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-[rgb(var(--text))]">
                    {post.title}
                </h1>
                <div className="mt-4 flex items-center gap-4 text-sm text-[rgb(var(--muted))]">
                  <time className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--muted))] opacity-50"></span>
                    {post.date}
                  </time>
                </div>
            </div>

            <div className="p-6 sm:p-10">
                <MarkdownContent content={post.content} />
            </div>
          </article>
        </main>

        <footer className="mx-auto max-w-3xl px-4 pb-10 pt-8 text-xs text-[rgb(var(--muted))] text-center">
          <div className="opacity-70">© {new Date().getFullYear()} Hawks • made to feel like a profile, not a resume.</div>
        </footer>
      </div>
    </div>
  );
}
