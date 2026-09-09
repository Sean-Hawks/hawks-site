import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://hawks.tw";
const siteTitle = "hawks.tw";
const siteDescription =
  "Hawks 的個人網站，記錄程式開發、機器學習與資安的學習歷程、活動心得和管樂生活，分享喜歡的動畫、電影、音樂與遊戲。";
const defaultImage = "/og/default.png";
const cloudflareAnalyticsToken = "430b038461df4770b3b0c08cea7572e6";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | hawks.tw",
  },
  description: siteDescription,
  applicationName: siteTitle,
  authors: [{ name: "Hawks", url: siteUrl }],
  creator: "Hawks",
  publisher: "Hawks",
  keywords: [
    "Hawks",
    "hawks.tw",
    "Blog",
    "Programming",
    "Music",
    "ACGM",
    "Library",
    "Personal Website",
  ],
  category: "personal website",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: siteTitle,
    images: [
      {
        url: defaultImage,
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [defaultImage],
  },
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/avatar.jpg", type: "image/png" },
    ],
    shortcut: "/avatar.jpg",
    apple: "/avatar.jpg",
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteTitle,
    url: siteUrl,
    inLanguage: "zh-TW",
    description: siteDescription,
    publisher: {
      "@type": "Person",
      name: "Hawks",
      url: siteUrl,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Hawks",
    url: siteUrl,
    sameAs: ["https://github.com/Sean-Hawks"],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem("theme-v2");
                document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
              } catch (_) {
                document.documentElement.dataset.theme = "light";
              }
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body>
        {children}
        <script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: cloudflareAnalyticsToken })}
        />
      </body>
    </html>
  );
}
