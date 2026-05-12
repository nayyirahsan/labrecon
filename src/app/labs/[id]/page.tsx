export const dynamic = 'force-dynamic';

import { and, desc, eq, ne } from "drizzle-orm";
import { ExternalLink, ChevronLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { withTimeout } from "@/lib/db/query";
import { grants, researchers, publications } from "@/lib/db/schema";
import type { Researcher } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { EmailSheet } from "@/components/email-sheet";
import { SaveButton } from "./save-button";
import { PubSparkline } from "@/components/pub-sparkline";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUSD(amount: string | null): string {
  if (!amount) return "—";
  const n = parseFloat(amount.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function funderUrl(funder: string): string | null {
  const f = funder.toLowerCase();
  if (f.startsWith("nsf")) return "https://www.nsf.gov/awardsearch/";
  if (f.startsWith("nih")) return "https://reporter.nih.gov/";
  if (f.startsWith("darpa")) return "https://www.darpa.mil/work-with-us/for-universities";
  if (f.startsWith("doe")) return "https://www.energy.gov/science";
  if (f.includes("simons")) return "https://www.simonsfoundation.org/grant/";
  if (f.includes("cdc")) return "https://grants.nih.gov/funding/searchguide/index.html";
  return null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <h2 className="text-[10px] uppercase tracking-[0.14em] text-zinc-600 whitespace-nowrap">
        {label}
      </h2>
      <div className="flex-1 h-px bg-zinc-800/60" />
    </div>
  );
}

function Rule() {
  return <div className="h-px bg-zinc-800/50 my-9" />;
}

function Section({
  label,
  delay,
  children,
}: {
  label: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <section
      className="animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <SectionHeader label={label} />
      {children}
    </section>
  );
}

function SimilarLabCard({ researcher }: { researcher: Researcher }) {
  return (
    <Link
      href={`/labs/${researcher.id}`}
      className={cn(
        "flex flex-col gap-2 p-4",
        "bg-zinc-900 border border-zinc-800 rounded-[4px]",
        "transition-[border-color,box-shadow,transform] duration-100 ease-out",
        "hover:-translate-y-px hover:border-blue-500/20",
        "hover:shadow-[0_4px_16px_rgba(59,130,246,0.04)]"
      )}
    >
      <h3
        className="text-[13px] text-zinc-100 leading-snug"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {researcher.name}
      </h3>

      {researcher.department && (
        <p className="text-[10px] text-zinc-600 uppercase tracking-wide truncate -mt-0.5">
          {researcher.department}
        </p>
      )}

      {researcher.research_summary && (
        <p className="text-[11px] text-zinc-600 leading-[1.55] line-clamp-2 mt-auto">
          {researcher.research_summary}
        </p>
      )}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  try {
    const [lab] = await withTimeout(
      db.select().from(researchers).where(eq(researchers.id, id)),
      8000,
      []
    );
    if (!lab) return {};
    return {
      title: `${lab.name} | LabRecon`,
      description: lab.research_summary?.slice(0, 160) ?? undefined,
    };
  } catch (e) {
    console.error('DB query failed:', e);
    return {};
  }
}

export default async function LabPage({ params }: { params: Params }) {
  const { id } = await params;

  let lab: typeof researchers.$inferSelect | undefined;
  let pubs: (typeof publications.$inferSelect)[] = [];
  let grantList: (typeof grants.$inferSelect)[] = [];
  let similarLabs: (typeof researchers.$inferSelect)[] = [];

  try {
    const rows = await withTimeout(
      db.select().from(researchers).where(eq(researchers.id, id)),
      8000,
      []
    );
    lab = rows[0];
  } catch (e) {
    console.error('DB query failed:', e);
  }

  if (!lab) notFound();

  try {
    pubs = await withTimeout(
      db
        .select()
        .from(publications)
        .where(eq(publications.researcher_id, id))
        .orderBy(desc(publications.year)),
      8000,
      []
    );
  } catch (e) {
    console.error('DB query failed:', e);
  }

  try {
    grantList = await withTimeout(
      db.select().from(grants).where(eq(grants.researcher_id, id)),
      8000,
      []
    );
  } catch (e) {
    console.error('DB query failed:', e);
  }

  try {
    const sameDept = await withTimeout(
      db
        .select()
        .from(researchers)
        .where(and(eq(researchers.department, lab.department ?? ""), ne(researchers.id, id)))
        .orderBy(desc(researchers.last_updated_at))
        .limit(4),
      8000,
      []
    );

    similarLabs =
      sameDept.length >= 4
        ? sameDept
        : [
            ...sameDept,
            ...(await withTimeout(
              db
                .select()
                .from(researchers)
                .where(and(ne(researchers.department, lab.department ?? ""), ne(researchers.id, id)))
                .orderBy(desc(researchers.last_updated_at))
                .limit(4 - sameDept.length),
              8000,
              []
            )),
          ];
  } catch (e) {
    console.error('DB query failed:', e);
  }

  const hasPubs = pubs.length > 0;
  const pubYears = pubs.map((p) => p.year).filter((y): y is number => y !== null);
  const isUndergradFriendly = false;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 pb-20">
      {/* Breadcrumb */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors duration-100 mb-10"
      >
        <ChevronLeft size={12} />
        All labs
      </Link>

      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between gap-6 mb-3 animate-fade-up"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex-1 min-w-0">
          <h1
            className="text-[36px] leading-[1.06] text-zinc-50 mb-2 text-pretty"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {lab.name}
          </h1>
          {lab.title && (
            <p className="text-[13px] text-zinc-500 leading-relaxed">
              {lab.title}
            </p>
          )}
          {lab.department && (
            <p className="text-[13px] text-zinc-600 mt-0.5">
              {lab.department}
            </p>
          )}

          {lab.profile_url && (
            <a
              href={lab.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[12px] text-zinc-700 hover:text-blue-400 transition-colors duration-100"
            >
              <ExternalLink size={11} />
              {displayHost(lab.profile_url)}
            </a>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
          {isUndergradFriendly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border border-blue-500/20 text-blue-400 bg-blue-500/5">
              <GraduationCap size={11} />
              Undergrad Friendly
            </span>
          )}
        </div>
      </div>

      <Rule />

      {/* ── Research Summary ─────────────────────────────────────── */}
      <Section label="Research Overview" delay={80}>
        <p className="text-[14px] text-zinc-400 leading-[1.85] max-w-prose">
          {lab.research_summary}
        </p>
      </Section>

      {hasPubs && (
        <>
          <Rule />
          {/* ── Publications ─────────────────────────────────────── */}
          <Section label="Recent Publications" delay={160}>
            {/* Sparkline */}
            <div className="flex items-center gap-3 mb-5">
              <PubSparkline years={pubYears} />
              <span className="text-[10px] text-zinc-700">
                {pubs.length} paper{pubs.length !== 1 ? "s" : ""}
                {pubYears.length > 0 && (
                  <> · {Math.min(...pubYears)}–{Math.max(...pubYears)}</>
                )}
              </span>
            </div>

            <div>
              {pubs.map((pub, i) => {
                const pubUrl = pub.doi ? `https://doi.org/${pub.doi}` : null;
                return (
                  <div
                    key={pub.id}
                    className={cn(
                      "flex flex-col gap-1.5 py-4",
                      i > 0 && "border-t border-zinc-800/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {pubUrl ? (
                        <a
                          href={pubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] text-zinc-200 hover:text-blue-400 transition-colors duration-100 leading-snug"
                        >
                          {pub.title}
                        </a>
                      ) : (
                        <p className="text-[13px] text-zinc-200 leading-snug">
                          {pub.title}
                        </p>
                      )}
                      <span className="text-[12px] text-zinc-700 tabular-nums shrink-0 mt-px">
                        {pub.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {pub.venue && (
                        <p className="text-[11px] text-zinc-600">{pub.venue}</p>
                      )}
                      {pub.cited_by_count != null && pub.cited_by_count > 0 && (
                        <span className="text-[10px] text-zinc-700 tabular-nums">
                          {pub.cited_by_count.toLocaleString()} citations
                        </span>
                      )}
                    </div>
                    {pub.abstract && (
                      <p className="text-[11px] text-zinc-600 leading-[1.6] line-clamp-2 mt-0.5">
                        {pub.abstract}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}

      {grantList.length > 0 && (
        <>
          <Rule />
          {/* ── Grants ───────────────────────────────────────────── */}
          <Section label="Active Grants" delay={240}>
            <div>
              {grantList.map((grant, i) => (
                <div
                  key={grant.id}
                  className={cn(
                    "flex flex-col gap-1.5 py-4",
                    i > 0 && "border-t border-zinc-800/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-baseline gap-2 min-w-0">
                      {grant.funder && (
                        <>
                          {funderUrl(grant.funder) ? (
                            <a
                              href={funderUrl(grant.funder)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[12px] text-zinc-300 font-medium shrink-0 hover:text-blue-400 transition-colors duration-100"
                            >
                              {grant.funder}
                            </a>
                          ) : (
                            <span className="text-[12px] text-zinc-300 font-medium shrink-0">
                              {grant.funder}
                            </span>
                          )}
                        </>
                      )}
                      {grant.amount && (
                        <>
                          <span className="text-zinc-800">·</span>
                          <span className="text-[12px] text-zinc-500 tabular-nums">
                            {formatUSD(grant.amount)}
                          </span>
                        </>
                      )}
                    </div>
                    {grant.year && (
                      <span className="text-[11px] text-zinc-700 tabular-nums shrink-0">
                        {grant.year}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-zinc-600 leading-snug">
                    {grant.title}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      <Rule />

      {/* ── CTAs ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 animate-fade-up"
        style={{ animationDelay: "320ms" }}
      >
        <EmailSheet
          labId={lab.id}
          piName={lab.name}
          piEmail={lab.email}
          labName={lab.department ?? ""}
          hasPubs={hasPubs}
        />
        <SaveButton labId={lab.id} />
      </div>

      {!hasPubs && (
        <p className="mt-2 text-[11px] text-zinc-700">
          More data needed to generate personalized outreach for this lab.
        </p>
      )}

      {/* ── Similar Labs ─────────────────────────────────────────── */}
      {similarLabs.length > 0 && (
        <>
          <div className="h-px bg-zinc-800/50 mt-14 mb-9" />
          <section
            className="animate-fade-up"
            style={{ animationDelay: "360ms" }}
          >
            <SectionHeader label="Similar Labs" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {similarLabs.map((sl) => (
                <SimilarLabCard key={sl.id} researcher={sl} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
