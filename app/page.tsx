export const dynamic = "force-static";

import { getSortedPostsData } from "./lib/posts";
import { getSortedTalksData } from "./lib/talks";
import HomeHydrationGate from "./components/HomeHydrationGate";

export default function Page() {
	const posts = getSortedPostsData();
	const talks = getSortedTalksData();

	return <HomeHydrationGate posts={posts} talks={talks} />;
}
