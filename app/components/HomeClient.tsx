"use client";

import React from "react";
import { rolesTop } from "../data/roles";
import ProfileSidebar from "./ProfileSidebar";
import ReadmeSection from "./ReadmeSection";
import ProjectsSection from "./ProjectsSection"; // Import
import PostsAside from "./PostsAside";
import { Post, Talk } from "../types";
import Header from "./Header";
import ThemeStyles from "./ThemeStyles";

interface HomeClientProps {
  posts: Post[];
  talks: Talk[];
}

export default function HomeClient({ posts, talks }: HomeClientProps) {
  const [leftWidth, setLeftWidth] = React.useState(360);
  const [rightWidth, setRightWidth] = React.useState(300);
  const [isDraggingLeft, setIsDraggingLeft] = React.useState(false);
  const [isDraggingRight, setIsDraggingRight] = React.useState(false);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        setLeftWidth(prev => Math.max(280, Math.min(400, prev + e.movementX)));
      }
      if (isDraggingRight) {
        setRightWidth(prev => Math.max(280, Math.min(400, prev - e.movementX)));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingLeft, isDraggingRight]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-3">
          <main className="grid grid-cols-1 gap-4 py-5 lg:flex lg:gap-0" style={{
            display: 'flex',
            gap: '0',
            height: 'auto',
          }}>
        <aside 
          className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgb(var(--panel))] overflow-hidden lg:flex-shrink-0" 
          style={{
            width: `${leftWidth}px`,
            minWidth: '280px',
            maxWidth: '400px',
            transition: 'width 0.1s ease',
          }}
        >
          <ProfileSidebar roles={rolesTop} />
        </aside>

        <div 
          className="hidden lg:block w-1 mx-1 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.20)] cursor-col-resize transition-colors flex-shrink-0 select-none"
          onMouseDown={() => setIsDraggingLeft(true)}
        />

        <section 
          className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgb(var(--panel))] p-5 lg:flex-1" 
          style={{
            flex: '1 1 auto',
            minWidth: '300px',
          }}>
          <ReadmeSection />
          <ProjectsSection /> {/* Add here */}
        </section>

        <div 
          className="hidden lg:block w-1 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.20)] cursor-col-resize transition-colors flex-shrink-0 select-none"
          onMouseDown={() => setIsDraggingRight(true)}
        />

        <aside 
          className="p-5 lg:flex-shrink-0" 
          style={{
            width: `${rightWidth}px`,
            minWidth: '280px',
            maxWidth: '400px',
            transition: 'width 0.1s ease',
          }}>
          <PostsAside posts={posts} talks={talks} />
        </aside>
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-xs text-[rgb(var(--muted))]">
          <div className="opacity-70">© {new Date().getFullYear()} Hawks • made to feel like a profile, not a resume.</div>
        </footer>
      </div>
    </div>
  );
}
