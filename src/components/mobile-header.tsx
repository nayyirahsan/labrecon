"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, Menu, Search, BookMarked } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/search", label: "Search Labs", icon: Search },
  { href: "/tracker", label: "My Tracker", icon: BookMarked },
] as const;

export function MobileHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden flex items-center justify-between h-[52px] px-4 bg-zinc-950 border-b border-zinc-800/60 shrink-0 z-30">
      {/* Logo */}
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2"
      >
        <FlaskConical size={15} className="text-zinc-500" aria-hidden="true" />
        <span
          className="text-[15px] text-zinc-100 tracking-tight leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          LabRecon
        </span>
      </Link>

      {/* Hamburger → Sheet (controlled so nav clicks close it) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label="Open navigation menu"
          className={cn(
            "flex items-center justify-center",
            "h-10 w-10 rounded-[4px]",
            "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50",
            "transition-colors duration-100 cursor-pointer"
          )}
        >
          <Menu size={18} />
        </SheetTrigger>

        <SheetContent
          side="left"
          showCloseButton={false}
          className="!w-[220px] flex flex-col p-0 bg-zinc-950 border-r border-zinc-800/60"
        >
          {/* Sheet wordmark */}
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center h-[52px] px-3 border-b border-zinc-800/60 shrink-0 gap-2.5"
          >
            <FlaskConical size={15} className="text-zinc-500 shrink-0" aria-hidden="true" />
            <span
              className="text-[15px] text-zinc-100 tracking-tight leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              LabRecon
            </span>
          </Link>

          {/* Nav — each link closes the Sheet */}
          <nav aria-label="Main navigation" className="flex-1 py-1.5 px-1.5 flex flex-col gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center h-10 px-2 gap-2.5 rounded-[4px] text-[13px]",
                    "transition-colors duration-100",
                    active
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  <Icon size={14} className="shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
