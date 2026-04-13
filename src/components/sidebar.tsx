"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FlaskConical,
  Search,
  BookMarked,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/search", label: "Search Labs", icon: Search },
  { href: "/tracker", label: "My Tracker", icon: BookMarked },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative hidden md:flex flex-col h-full shrink-0 bg-zinc-950 border-r border-zinc-800/60",
        "transition-[width] duration-200 ease-out overflow-hidden",
        collapsed ? "w-12" : "w-[220px]"
      )}
    >
      {/* Wordmark */}
      <Link
        href="/"
        className={cn(
          "flex items-center h-[52px] border-b border-zinc-800/60 shrink-0 px-3 gap-2.5",
          collapsed && "justify-center"
        )}
      >
        <FlaskConical size={15} className="text-zinc-500 shrink-0" aria-hidden="true" />
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span
              className="text-[15px] text-zinc-100 tracking-tight whitespace-nowrap leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              LabRecon
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/12 text-blue-400 border border-blue-500/20 rounded-[3px] tracking-wider uppercase font-mono leading-none">
              Beta
            </span>
          </div>
        )}
      </Link>

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex-1 py-1.5 px-1.5 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={collapsed ? label : undefined}
              className={cn(
                "flex items-center h-9 px-2 gap-2.5 rounded-[4px] text-[13px]",
                "transition-colors duration-100",
                active
                  ? "bg-zinc-800 text-zinc-100 shadow-[inset_2px_0_0_rgb(59_130_246)]"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <Icon size={14} className="shrink-0" aria-hidden="true" />
              {!collapsed && (
                <span className="whitespace-nowrap">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Cmd+K hint */}
      {!collapsed && (
        <div className="px-2.5 pb-2">
          <div className="flex items-center justify-between h-8 px-2 text-[10px] text-zinc-700">
            <span>Quick search</span>
            <div className="flex items-center gap-0.5">
              <kbd className="px-1 py-px bg-zinc-900 border border-zinc-800 rounded-[2px] font-mono text-zinc-600">⌘</kbd>
              <kbd className="px-1 py-px bg-zinc-900 border border-zinc-800 rounded-[2px] font-mono text-zinc-600">K</kbd>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="border-t border-zinc-800/60 p-1.5 shrink-0">
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-full h-8 rounded-[4px] text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50 transition-colors duration-100"
        >
          {collapsed ? (
            <PanelLeftOpen size={13} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={13} aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  );
}
