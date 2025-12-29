"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import { visit } from "unist-util-visit";
import { Plugin } from "unified";

interface PostContentProps {
  content?: string;
}

// 自定義插件：處理 :::info 語法
const remarkAdmonitions: Plugin = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (
        node.type === "containerDirective" ||
        node.type === "leafDirective" ||
        node.type === "textDirective"
      ) {
        const data = node.data || (node.data = {});
        const tagName = node.type === "textDirective" ? "span" : "div";

        data.hName = tagName;
        data.hProperties = {
          ...(data.hProperties || {}),
          className: ["admonition", `admonition-${node.name}`],
        };
      }
    });
  };
};

export default function PostContent({ content }: PostContentProps) {
  return (
    <div className="max-w-none text-[rgb(var(--text))]">
      {/* 定義 Admonition 的全域樣式 */}
      <style jsx global>{`
        .admonition {
          margin: 1.5rem 0;
          padding: 1rem;
          border-left: 4px solid;
          border-radius: 0.5rem;
          background-color: rgba(255, 255, 255, 0.03);
        }
        
        /* Info (藍色/預設) */
        .admonition-info {
          border-color: #3b82f6;
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        /* Warning (黃色) */
        .admonition-warning {
          border-color: #eab308;
          background-color: rgba(234, 179, 8, 0.1);
        }
        
        /* Danger/Error (紅色) */
        .admonition-danger, .admonition-error {
          border-color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
        }
        
        /* Success (綠色) */
        .admonition-success, .admonition-tip {
          border-color: #22c55e;
          background-color: rgba(34, 197, 94, 0.1);
        }

        /* 讓 Admonition 內的標題稍微明顯一點 */
        .admonition > *:first-child {
          margin-top: 0;
        }
        .admonition > *:last-child {
          margin-bottom: 0;
        }
      `}</style>

      {content ? (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkDirective, remarkAdmonitions]}
          components={{
            // 明確指定標題樣式，確保一定會變大
            h1: ({node, ...props}) => <h1 className="text-4xl font-bold mt-10 mb-6 text-[rgb(var(--text))]" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-3xl font-bold mt-8 mb-4 text-[rgb(var(--text))]" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-2xl font-bold mt-6 mb-3 text-[rgb(var(--text))]" {...props} />,
            h4: ({node, ...props}) => <h4 className="text-xl font-bold mt-4 mb-2 text-[rgb(var(--text))]" {...props} />,
            
            // 其他元素的樣式
            p: ({node, ...props}) => <p className="my-4 leading-relaxed text-[rgb(var(--muted))]" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-inside my-4 space-y-1 text-[rgb(var(--muted))]" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside my-4 space-y-1 text-[rgb(var(--muted))]" {...props} />,
            li: ({node, ...props}) => <li className="ml-4" {...props} />,
            a: ({node, ...props}) => <a className="text-[rgb(var(--accent))] no-underline hover:underline" {...props} />,
            blockquote: ({node, ...props}) => (
              <blockquote className="border-l-4 border-[rgb(var(--accent))] bg-[rgba(251,191,36,0.05)] py-2 px-4 my-6 rounded-r-lg text-[rgb(var(--muted))]" {...props} />
            ),
            hr: ({node, ...props}) => <hr className="border-[rgba(255,255,255,0.06)] my-8" {...props} />,
            
            // 程式碼區塊
            code: ({node, className, children, ...props}: any) => {
              const match = /language-(\w+)/.exec(className || '')
              const isInline = !match && !String(children).includes('\n');
              return isInline ? (
                <code className="text-[rgb(var(--accent))] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              ) : (
                <pre className="bg-[rgb(var(--bg))] border border-[rgba(255,255,255,0.06)] p-4 rounded-xl overflow-x-auto my-6">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              )
            },
            
            // 圖片與表格
            img: ({node, ...props}) => (
              <img className="rounded-xl border border-[rgba(255,255,255,0.06)] w-full h-auto object-cover my-8" {...props} />
            ),
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-6">
                <table className="w-full text-left border-collapse" {...props} />
              </div>
            ),
            th: ({node, ...props}) => <th className="border-b border-[rgba(255,255,255,0.1)] pb-2 pt-2 font-bold text-[rgb(var(--text))]" {...props} />,
            td: ({node, ...props}) => <td className="border-b border-[rgba(255,255,255,0.06)] py-2 text-[rgb(var(--muted))]" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <p>內容待補充...</p>
      )}
    </div>
  );
}
