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
      <div
        className={cn(
          "flex items-center h-[52px] border-b border-zinc-800/60 shrink-0 px-3 gap-2.5",
          collapsed && "justify-center"
        )}
      >
        <FlaskConical size={15} className="text-zinc-500 shrink-0" />
        {!collapsed && (
          <span
            className="text-[15px] text-zinc-100 tracking-tight whitespace-nowrap leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            LabRecon
          </span>
        )}
      </div>

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
                "flex items-center h-8 px-2 gap-2.5 rounded-[4px] text-[13px]",
                "transition-colors duration-100",
                active
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <Icon size={14} className="shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-zinc-800/60 p-1.5 shrink-0">
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-full h-7 rounded-[4px] text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50 transition-colors duration-100"
        >
          {collapsed ? (
            <PanelLeftOpen size={13} />
          ) : (
            <PanelLeftClose size={13} />
          )}
        </button>
      </div>
    </aside>
  );
}
