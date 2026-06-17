import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact",
  description: "透過 Email、GitHub 或 Discord 聯繫 Hawks。",
  alternates: {
    canonical: "https://hawks.tw/contact/",
  },
  openGraph: {
    title: "Contact",
    description: "透過 Email、GitHub 或 Discord 聯繫 Hawks。",
    url: "https://hawks.tw/contact/",
    images: ["/og/default.png"],
  },
};

export default function ContactLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
