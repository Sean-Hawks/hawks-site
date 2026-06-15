import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hawks.tw"),
  title: {
    default: "hawks.tw",
    template: "%s | hawks.tw",
  },
  description: "Hawks' Blog",
  openGraph: {
    type: "website",
    url: "https://hawks.tw",
    title: "hawks.tw",
    description: "Hawks 的個人網站與部落格",
    siteName: "hawks.tw",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "Hawks",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "hawks.tw",
    description: "Hawks 的個人網站與部落格",
    images: ["/og/default.png"],
  },
  alternates: {
    canonical: "https://hawks.tw",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  icons: {
    icon: "/avatar.jpg",
    shortcut: "/avatar.jpg",
    apple: "/avatar.jpg",
  },
};
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
      </head>
      <body>{children}</body>
    </html>
  );
}
