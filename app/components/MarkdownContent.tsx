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

function textFromChildren(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
        return textFromChildren(child.props.children);
      }

      return "";
    })
    .join("");
}

export function headingId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function MarkdownContent({ content }: { content?: string }) {
  const components: Components = {
    pre: ({ node, className, children, ...props }: PreProps & { node?: unknown }) => {
      void node;
      return (
        <pre
          className={[
            "bg-[rgb(var(--line)/0.05)] border border-[rgb(var(--line)/0.10)] p-4 rounded-xl overflow-x-auto my-6",
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

    h1: ({ children, ...props }) => (
      <h1 id={headingId(textFromChildren(children))} className="scroll-mt-24 text-3xl sm:text-4xl font-extrabold mt-12 mb-6 text-[rgb(var(--text))] tracking-tight border-b border-[rgb(var(--line)/0.10)] pb-4" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 id={headingId(textFromChildren(children))} className="scroll-mt-24 text-2xl sm:text-3xl font-bold mt-10 mb-4 text-[rgb(var(--text))] tracking-tight" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 id={headingId(textFromChildren(children))} className="scroll-mt-24 text-xl sm:text-2xl font-bold mt-8 mb-3 text-[rgb(var(--text))] tracking-tight" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 id={headingId(textFromChildren(children))} className="scroll-mt-24 text-lg sm:text-xl font-bold mt-6 mb-2 text-[rgb(var(--text))]" {...props}>
        {children}
      </h4>
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
    a: ({ href, ...props }) => {
      const isExternal = typeof href === "string" && /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-[rgb(var(--accent))] font-medium no-underline hover:underline decoration-2 underline-offset-2 transition-all hover:text-[rgb(251,191,36)]"
          {...props}
        />
      );
    },
    blockquote: (props) => (
      <blockquote className="border-l-4 border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.08)] py-4 px-6 my-8 rounded-r-xl text-[rgb(var(--muted))] italic font-medium" {...props} />
    ),
    hr: (props) => <hr className="border-[rgb(var(--line)/0.10)] my-8" {...props} />,

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
            "text-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.10)] px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-[rgb(var(--accent)/0.18)]",
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
          className="relative rounded-xl border border-[rgb(var(--line)/0.12)] w-full h-auto object-cover shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]"
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
      <th className="border-b border-[rgb(var(--line)/0.14)] pb-2 pt-2 font-bold text-[rgb(var(--text))]" {...props} />
    ),
    td: (props) => (
      <td className="border-b border-[rgb(var(--line)/0.09)] py-2 text-[rgb(var(--muted))]" {...props} />
    ),
  };

  return (
    <div className="max-w-none text-[rgb(var(--text))]">
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
