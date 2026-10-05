"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Header from "./Header";
import { guiSnapshot, subscribeAppearance } from "../lib/appearance";

export default function HomeAppearance({
  classic,
  console: consoleHome,
}: {
  classic: ReactNode;
  console: ReactNode;
}) {
  const gui = useSyncExternalStore(subscribeAppearance, guiSnapshot, () => "classic");
  return (
    <>
      <Header />
      <div className="home-appearance" data-rendered-gui={gui}>
        {gui === "console" ? consoleHome : classic}
      </div>
    </>
  );
}
