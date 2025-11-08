import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="relative flex h-screen w-full overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(18,153,144,0.22),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),_rgba(2,6,23,0.95))]" />
      <Sidebar />
      <main className="relative z-10 flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-8">
        <div className="mx-auto w-full max-w-7xl rounded-3xl border border-white/10 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70">
          {children}
        </div>
      </main>
    </div>
  );
};
