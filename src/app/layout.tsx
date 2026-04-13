import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { PageTransition } from "@/components/page-transition";
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
  display: "swap",
});

export const metadata: Metadata = {
  title: "LabRecon — Research Intelligence for Undergraduates",
  description:
    "Discover UT Austin research labs, explore faculty profiles, and generate personalized cold emails with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${instrumentSerif.variable} dark h-full antialiased`}
    >
      <body className="h-full flex flex-col md:flex-row bg-zinc-950 text-zinc-50 overflow-hidden">
        <TooltipProvider>
          {/* Mobile top bar — only visible below md breakpoint */}
          <MobileHeader />
          {/* Desktop sidebar — hidden on mobile */}
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <PageTransition>{children}</PageTransition>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
