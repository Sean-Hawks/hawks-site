"use client";

import React from "react";
import HomeClient from "./HomeClient";
import type { Post, Talk } from "../types";

export default function HomeHydrationGate({
	posts,
	talks,
}: {
	posts: Post[];
	talks: Talk[];
}) {
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => setMounted(true), []);

	if (!mounted) {
		return <div suppressHydrationWarning />;
	}

	return <HomeClient posts={posts} talks={talks} />;
}
