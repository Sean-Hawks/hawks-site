import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://hawks.tw";
const siteTitle = "hawks.tw";
const siteDescription =
  "Hawks 的個人網站，收集 Blog、Talk、Library、Project，以及一些關於程式、音樂、ACGM 和生活的筆記。";
const defaultImage = "/og/default.png";

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
                document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
              } catch (_) {
                document.documentElement.dataset.theme = "dark";
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
      <body>{children}</body>
    </html>
  );
}
