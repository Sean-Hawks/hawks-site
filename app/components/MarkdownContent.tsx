"use client";

/* eslint-disable @next/next/no-img-element */
import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import type { Plugin } from "unified";

type Directiveish = {
  type: string;
  name?: string;
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
};

function isDirectiveish(node: unknown): node is Directiveish {
  return typeof node === "object" && node !== null && "type" in node;
}

const remarkAdmonitions: Plugin = () => {
  return (tree) => {
    visit(tree, (node: unknown) => {
      if (!isDirectiveish(node)) return;

      if (
        node.type !== "containerDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "textDirective"
      ) {
        return;
      }

      const data = (node.data ??= {});
      const tagName = node.type === "textDirective" ? "span" : "div";

      data.hName = tagName;
      data.hProperties = {
        ...(data.hProperties ?? {}),
        className: ["admonition", `admonition-${node.name ?? "note"}`],
      };
    });
  };
};

// 修正：改用 React 原生屬性型別，避免 Parameters<string> 錯誤
type PreProps = React.ComponentPropsWithoutRef<"pre">;
type CodeProps = React.ComponentPropsWithoutRef<"code"> & { inline?: boolean };

export default function MarkdownContent({ content }: { content?: string }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="max-w-none text-[rgb(var(--text))]" suppressHydrationWarning />
    );
  }

  const components: Components = {
    pre: ({ node, className, children, ...props }: PreProps & { node?: unknown }) => {
      void node;
      return (
        <pre
          className={[
            "bg-[rgb(var(--bg))] border border-[rgba(255,255,255,0.06)] p-4 rounded-xl overflow-x-auto my-6",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {children}
        </pre>
      );
    },

    h1: (props) => (
      <h1 className="text-3xl sm:text-4xl font-extrabold mt-12 mb-6 text-[rgb(var(--text))] tracking-tight border-b border-[rgba(255,255,255,0.06)] pb-4" {...props} />
    ),
    h2: (props) => (
      <h2 className="text-2xl sm:text-3xl font-bold mt-10 mb-4 text-[rgb(var(--text))] tracking-tight" {...props} />
    ),
    h3: (props) => (
      <h3 className="text-xl sm:text-2xl font-bold mt-8 mb-3 text-[rgb(var(--text))] tracking-tight" {...props} />
    ),
    h4: (props) => (
      <h4 className="text-lg sm:text-xl font-bold mt-6 mb-2 text-[rgb(var(--text))]" {...props} />
    ),

    // 避免 p 內塞進 block element（admonition/pre 等）造成 DOM repair
    p: (props) => (
      <div className="my-5 leading-8 text-[rgb(var(--muted))] text-base sm:text-lg tracking-wide" {...props} />
    ),

    ul: (props) => (
      <ul className="list-disc list-inside my-6 space-y-2 text-[rgb(var(--muted))] marker:text-[rgb(var(--accent))]" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal list-inside my-6 space-y-2 text-[rgb(var(--muted))] marker:text-[rgb(var(--accent))]" {...props} />
    ),
    li: (props) => <li className="ml-4 pl-1" {...props} />,
    a: (props) => (
      <a className="text-[rgb(var(--accent))] font-medium no-underline hover:underline decoration-2 underline-offset-2 transition-all hover:text-[rgb(251,191,36)]" {...props} />
    ),
    blockquote: (props) => (
      <blockquote className="border-l-4 border-[rgb(var(--accent))] bg-[rgba(255,255,255,0.03)] py-4 px-6 my-8 rounded-r-xl text-[rgb(var(--muted))] italic font-medium" {...props} />
    ),
    hr: (props) => <hr className="border-[rgba(255,255,255,0.06)] my-8" {...props} />,

    code: ({ node, inline, className, children, ...props }: CodeProps & { node?: unknown }) => {
      void node;

      if (!inline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      return (
        <code
          className={[
            "text-[rgb(251,191,36)] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-[rgba(255,255,255,0.08)]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {children}
        </code>
      );
    },

    img: (props) => (
      <div className="relative my-10 group">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[rgb(var(--accent))] to-purple-600 opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
        <img
          className="relative rounded-xl border border-[rgba(255,255,255,0.08)] w-full h-auto object-cover shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
          alt={props.alt ?? ""}
          {...props}
        />
        {props.alt && (
          <div className="mt-3 text-center text-sm text-[rgb(var(--muted))] opacity-70">
            {props.alt}
          </div>
        )}
      </div>
    ),

    table: (props) => (
      <div className="overflow-x-auto my-6">
        <table className="w-full text-left border-collapse" {...props} />
      </div>
    ),
    th: (props) => (
      <th className="border-b border-[rgba(255,255,255,0.1)] pb-2 pt-2 font-bold text-[rgb(var(--text))]" {...props} />
    ),
    td: (props) => (
      <td className="border-b border-[rgba(255,255,255,0.06)] py-2 text-[rgb(var(--muted))]" {...props} />
    ),
  };

  return (
    <div className="max-w-none text-[rgb(var(--text))]" suppressHydrationWarning>
      <style jsx global>{`
        .admonition {
          margin: 1.5rem 0;
          padding: 1rem;
          border-left: 4px solid;
          border-radius: 0.5rem;
          background-color: rgba(255, 255, 255, 0.03);
        }
        .admonition-info { border-color: #3b82f6; background-color: rgba(59, 130, 246, 0.1); }
        .admonition-warning { border-color: #eab308; background-color: rgba(234, 179, 8, 0.1); }
        .admonition-danger, .admonition-error { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.1); }
        .admonition-success, .admonition-tip { border-color: #22c55e; background-color: rgba(34, 197, 94, 0.1); }
        .admonition > *:first-child { margin-top: 0; }
        .admonition > *:last-child { margin-bottom: 0; }
      `}</style>

      {content ? (
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkDirective, remarkAdmonitions]} components={components}>
          {content}
        </ReactMarkdown>
      ) : (
        <div className="text-[rgb(var(--muted))]">內容待補充...</div>
      )}
    </div>
  );
}
