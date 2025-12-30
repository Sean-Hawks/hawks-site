import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hawks.tw"),
  title: {
    default: "hawks.tw",
    template: "%s | hawks.tw",
  },
  description: "Hawks' Blog",
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
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
