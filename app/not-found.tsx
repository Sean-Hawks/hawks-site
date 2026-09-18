import Link from 'next/link';
import Header from './components/Header';
import ThemeStyles from './components/ThemeStyles';
import { ArrowRight, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <p className="font-mono text-sm tracking-[0.18em] text-[rgb(var(--accent))]">404 / SIGNAL LOST</p>
        <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl">這個頁面走丟了</h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-[rgb(var(--muted))]">網址可能有誤，或內容已經搬家。你可以從文章列表重新找起，也可以搜尋標題或關鍵字。</p>
        <Link href="/search/" className="mt-8 inline-flex min-h-12 items-center gap-3 border border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--accent)/0.10)] px-5 py-3 font-semibold text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.18)]">
          <Search className="h-5 w-5" aria-hidden="true" />搜尋站內內容
        </Link>
        <nav aria-label="尋找其他頁面" className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            { href: '/', label: '回到首頁', desc: '最近的文章與近況' },
            { href: '/blog/', label: '瀏覽文章', desc: '學習筆記、活動與生活' },
            { href: '/library/', label: '逛逛收藏', desc: '動畫、電影、音樂與遊戲' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.8)] p-5 hover:border-[rgb(var(--accent)/0.4)]">
              <span className="flex items-center justify-between gap-2 font-bold">{item.label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              <span className="mt-2 block text-sm leading-6 text-[rgb(var(--muted))]">{item.desc}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
