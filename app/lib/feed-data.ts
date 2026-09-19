import { getSortedPostsData } from "./posts";
import { getSortedTalksData } from "./talks";
import { getAllLibraryItems } from "./library";
import { buildFeedItems } from "./feeds";
export function getFeedItems() {
  return buildFeedItems(
    getSortedPostsData(),
    getSortedTalksData(),
    getAllLibraryItems(),
  );
}
