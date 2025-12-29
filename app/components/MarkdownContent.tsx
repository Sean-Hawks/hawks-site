"use client";

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

type CodeProps = Parameters<NonNullable<Components["code"]>>[0];
type PreProps = Parameters<NonNullable<Components["pre"]>>[0];

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
      <h1 className="text-4xl font-bold mt-10 mb-6 text-[rgb(var(--text))]" {...props} />
    ),
    h2: (props) => (
      <h2 className="text-3xl font-bold mt-8 mb-4 text-[rgb(var(--text))]" {...props} />
    ),
    h3: (props) => (
      <h3 className="text-2xl font-bold mt-6 mb-3 text-[rgb(var(--text))]" {...props} />
    ),
    h4: (props) => (
      <h4 className="text-xl font-bold mt-4 mb-2 text-[rgb(var(--text))]" {...props} />
    ),

    // 避免 p 內塞進 block element（admonition/pre 等）造成 DOM repair
    p: (props) => (
      <div className="my-4 leading-relaxed text-[rgb(var(--muted))]" {...props} />
    ),

    ul: (props) => (
      <ul className="list-disc list-inside my-4 space-y-1 text-[rgb(var(--muted))]" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal list-inside my-4 space-y-1 text-[rgb(var(--muted))]" {...props} />
    ),
    li: (props) => <li className="ml-4" {...props} />,
    a: (props) => (
      <a className="text-[rgb(var(--accent))] no-underline hover:underline" {...props} />
    ),
    blockquote: (props) => (
      <blockquote className="border-l-4 border-[rgb(var(--accent))] bg-[rgba(251,191,36,0.05)] py-2 px-4 my-6 rounded-r-lg text-[rgb(var(--muted))]" {...props} />
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
            "text-[rgb(var(--accent))] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded text-sm font-mono",
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
      <img
        className="rounded-xl border border-[rgba(255,255,255,0.06)] w-full h-auto object-cover my-8"
        alt={props.alt ?? ""}
        {...props}
      />
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
