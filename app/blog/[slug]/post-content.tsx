import MarkdownContent from "../../components/MarkdownContent";

interface PostContentProps {
  content?: string;
  slug?: string;
}

export default function PostContent({ content, slug }: PostContentProps) {
  return (
    <MarkdownContent
      content={content}
      assetBasePath={slug ? `/images/posts/${slug}` : undefined}
    />
  );
}
