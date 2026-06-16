import TagsIndex from "../components/TagsIndex";

export const metadata = {
  title: "Tags",
  description: "依照使用次數排序的 Hawks 全站 tag 索引。",
};

export default function TagsPage() {
  return <TagsIndex />;
}
