"use client";

import MarkdownContent from "../../components/MarkdownContent";

interface PostContentProps {
  content?: string;
}

export default function PostContent({ content }: PostContentProps) {
  return <MarkdownContent content={content} />;
}
