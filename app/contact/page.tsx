"use client";

import React from "react";
import { Mail, Github, MessageSquare } from "lucide-react";
import ThemeStyles from "../components/ThemeStyles";
import Header from "../components/Header";

export default function ContactPage() {
  const contacts = [
    {
      name: "Email",
      value: "me@hawks.tw", // 請修改為你的 Email
      icon: Mail,
      link: "mailto:me@hawks.tw",
      color: "text-red-400",
    },
    {
      name: "GitHub",
      value: "@Sean-Hawks", // 請修改為你的 GitHub
      icon: Github,
      link: "https://github.com/Sean-Hawks",
      color: "text-white",
    },
    {
      name: "Discord",
      value: "1awks", // 請修改為你的 Discord
      icon: MessageSquare,
      link: "#",
      color: "text-indigo-400",
    }
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-3">
        <main className="mx-auto max-w-2xl py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold">Contact Me</h1>
            <p className="mt-3 text-[rgb(var(--muted))]">
              有任何問題或合作邀約，歡迎透過以下方式聯繫我。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {contacts.map((item) => (
              <a
                key={item.name}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgb(var(--panel))] p-6 transition-all hover:bg-[rgb(var(--panel2))] hover:scale-[1.02]"
              >
                <div className={`rounded-lg bg-[rgba(255,255,255,0.06)] p-3 ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm text-[rgb(var(--muted))]">{item.name}</div>
                  <div className="font-semibold text-[rgb(var(--text))]">{item.value}</div>
                </div>
              </a>
            ))}
          </div>
        </main>

        <footer className="mx-auto max-w-2xl px-4 pb-10 pt-8 text-xs text-[rgb(var(--muted))] text-center">
          <div className="opacity-70">© {new Date().getFullYear()} Hawks</div>
        </footer>
      </div>
    </div>
  );
}
