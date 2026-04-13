import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { count } from "drizzle-orm";
import { db } from "@/lib/db";
import { labs } from "@/lib/db/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { PageTransition } from "@/components/page-transition";
import { CommandPalette } from "@/components/command-palette";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "optional",
});

export const metadata: Metadata = {
  title: "LabRecon — Research Intelligence for Undergraduates",
  description:
    "Discover UT Austin research labs, explore faculty profiles, and generate personalized cold emails with AI.",
};

export const viewport: Viewport = {
  themeColor: "#17171f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const labCount = db.select({ v: count() }).from(labs).all()[0]?.v ?? 0;

  return (
    <html
      lang="en"
      className={`${geist.variable} ${instrumentSerif.variable} dark h-full antialiased`}
    >
      <body className="h-full flex flex-col md:flex-row bg-zinc-950 text-zinc-50 overflow-hidden">
        {/* Skip link — keyboard users bypass nav directly to content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:px-3 focus:py-2 focus:text-[13px] focus:bg-zinc-900 focus:border focus:border-zinc-700 focus:rounded-[4px] focus:text-zinc-100 focus:shadow-lg"
        >
          Skip to content
        </a>
        <TooltipProvider>
          {/* Global Cmd+K command palette */}
          <CommandPalette labCount={labCount} />
          {/* Mobile top bar — only visible below md breakpoint */}
          <MobileHeader />
          {/* Desktop sidebar — hidden on mobile */}
          <Sidebar />
          <main id="main-content" className="flex-1 overflow-y-auto">
            <PageTransition>{children}</PageTransition>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
