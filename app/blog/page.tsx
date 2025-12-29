import { getSortedPostsData } from "../lib/posts";
import BlogClient from "./BlogClient";

export default function BlogPage() {
  const posts = getSortedPostsData();
  return <BlogClient posts={posts} />;
}
