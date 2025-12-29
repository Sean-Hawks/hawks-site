import { getSortedPostsData } from "./lib/posts";
import { getSortedTalksData } from "./lib/talks";
import HomeClient from "./components/HomeClient";

export default function Page() {
  const posts = getSortedPostsData();
  const talks = getSortedTalksData();
  
  return <HomeClient posts={posts} talks={talks} />;
}
