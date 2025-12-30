import Link from "next/link";
import { Calendar } from "lucide-react";
import { getSortedPostsData } from "../lib/posts";
import ThemeStyles from "../components/ThemeStyles";
import Header from "../components/Header";

export default function BlogPage() {
  const posts = getSortedPostsData();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-3">
        <main className="max-w-6xl mx-auto pt-24 pb-12 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
          
          {/* 左側：Blog 目錄 (所有文章連結) */}
          <aside className="hidden lg:block">
            <div className="sticky top-40 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                Blog 目錄
              </h3>
              <nav className="space-y-1">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))] transition-colors truncate"
                  >
                    {post.title}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* 右側：文章列表 */}
          <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Blog</h1>
                <p className="text-[rgb(var(--muted))]">所有文章列表。</p>
            </div>

            <div className="space-y-6">
                {posts.map((post) => (
                    <Link 
                      key={post.slug} 
                      href={`/blog/${post.slug}`}
                      className="block group"
                    >
                        <article className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgb(var(--panel))] p-6 transition-all hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.03)]">
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--muted))] mb-3">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {post.date}
                                </span>
                                <div className="flex gap-1.5">
                                    {post.tags.map(tag => (
                                        <span key={tag} className="bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded text-[rgb(var(--accent))] opacity-80">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <h2 className="text-xl font-bold text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))] transition-colors mb-2">
                                {post.title}
                            </h2>
                            
                            <p className="text-sm text-[rgb(var(--muted))] line-clamp-2 leading-relaxed">
                                {post.desc}
                            </p>
                        </article>
                    </Link>
                ))}
            </div>
          </div>
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-8 text-xs text-[rgb(var(--muted))] text-center">
          <div className="opacity-70">© {new Date().getFullYear()} Hawks</div>
        </footer>
      </div>
    </div>
  );
}
