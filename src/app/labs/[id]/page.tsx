import { and, desc, eq, ne } from "drizzle-orm";
import { ExternalLink, ChevronLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { grants, labs, publications } from "@/lib/db/schema";
import type { Lab } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { EmailSheet } from "@/components/email-sheet";
import { SaveButton } from "./save-button";
import { PubSparkline } from "@/components/pub-sparkline";

// ── Helpers ───────────────────────────────────────────────────────────────────

function activityLabel(score: number) {
  if (score >= 75) return "Active";
  if (score >= 50) return "Moderate";
  return "Stale";
}

function activityColors(score: number) {
  if (score >= 75)
    return "text-emerald-400 bg-emerald-500/8 border-emerald-500/20";
  if (score >= 50)
    return "text-amber-400 bg-amber-500/8 border-amber-500/20";
  return "text-red-400 bg-red-500/8 border-red-500/20";
}

function activityDot(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function formatUSD(amount: number | null): string {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
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

function SimilarLabCard({ lab }: { lab: Lab }) {
  const skills = JSON.parse(lab.skills) as string[];

  return (
    <Link
      href={`/labs/${lab.id}`}
      className={cn(
        "flex flex-col gap-2 p-4",
        "bg-zinc-900 border border-zinc-800 rounded-[4px]",
        "transition-[border-color,box-shadow,transform] duration-100 ease-out",
        "hover:-translate-y-px hover:border-blue-500/20",
        "hover:shadow-[0_4px_16px_rgba(59,130,246,0.04)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-[13px] text-zinc-100 leading-snug"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {lab.piName}
        </h3>
        <span
          className={cn(
            "size-[6px] rounded-full mt-[5px] shrink-0",
            activityDot(lab.activityScore)
          )}
          title={activityLabel(lab.activityScore)}
        />
      </div>

      <p className="text-[10px] text-zinc-600 uppercase tracking-wide truncate -mt-0.5">
        {lab.labName}
      </p>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="inline-block px-1.5 py-[3px] text-[9px] text-zinc-500 bg-zinc-800/60 rounded-[2px] leading-none"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const labId = parseInt(id, 10);
  if (isNaN(labId)) return {};
  const lab = db.select().from(labs).where(eq(labs.id, labId)).get();
  if (!lab) return {};
  return {
    title: `${lab.piName} — ${lab.labName} | LabRecon`,
    description: lab.researchSummary.slice(0, 160),
  };
}

export default async function LabPage({ params }: { params: Params }) {
  const { id } = await params;
  const labId = parseInt(id, 10);
  if (isNaN(labId)) notFound();

  const lab = db.select().from(labs).where(eq(labs.id, labId)).get();
  if (!lab) notFound();

  const pubs = db
    .select()
    .from(publications)
    .where(eq(publications.labId, labId))
    .orderBy(desc(publications.year))
    .all();

  const grantList = db
    .select()
    .from(grants)
    .where(eq(grants.labId, labId))
    .all();

  // Similar labs: same department first, fill with cross-department
  const sameDept = db
    .select()
    .from(labs)
    .where(and(eq(labs.department, lab.department), ne(labs.id, labId)))
    .orderBy(desc(labs.activityScore))
    .limit(4)
    .all();

  const similarLabs =
    sameDept.length >= 4
      ? sameDept
      : [
          ...sameDept,
          ...db
            .select()
            .from(labs)
            .where(and(ne(labs.department, lab.department), ne(labs.id, labId)))
            .orderBy(desc(labs.activityScore))
            .limit(4 - sameDept.length)
            .all(),
        ];

  const skills = JSON.parse(lab.skills) as string[];
  const hasPubs = pubs.length > 0;
  const pubYears = pubs.map((p) => p.year);
  const isUndergradFriendly = lab.activityScore >= 80;

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

      {/* ── Header ───────────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between gap-6 mb-3 animate-fade-up"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex-1 min-w-0">
          <h1
            className="text-[36px] leading-[1.06] text-zinc-50 mb-2 text-pretty"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {lab.piName}
          </h1>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            {lab.piTitle}
          </p>
          <p className="text-[13px] text-zinc-600 mt-0.5">
            {lab.department}
            <span className="text-zinc-800 mx-2">·</span>
            {lab.college}
          </p>

          {lab.labWebsite && (
            <a
              href={lab.labWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[12px] text-zinc-700 hover:text-blue-400 transition-colors duration-100"
            >
              <ExternalLink size={11} />
              {displayHost(lab.labWebsite)}
            </a>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border",
              activityColors(lab.activityScore)
            )}
          >
            <span
              className={cn(
                "size-[5px] rounded-full",
                activityDot(lab.activityScore)
              )}
            />
            {activityLabel(lab.activityScore)}
            <span className="opacity-50">·</span>
            <span className="tabular-nums">{lab.activityScore}</span>
          </span>

          {isUndergradFriendly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border border-blue-500/20 text-blue-400 bg-blue-500/5">
              <GraduationCap size={11} />
              Undergrad Friendly
            </span>
          )}

          <p className="text-[11px] text-zinc-600">
            {lab.labName}
          </p>
        </div>
      </div>

      <Rule />

      {/* ── Research Summary ─────────────────────────────────────── */}
      <Section label="Research Overview" delay={80}>
        <p className="text-[14px] text-zinc-400 leading-[1.85] max-w-prose">
          {lab.researchSummary}
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
                {pubs.length} paper{pubs.length !== 1 ? "s" : ""} · {Math.min(...pubYears)}–{Math.max(...pubYears)}
              </span>
            </div>

            <div>
              {pubs.map((pub, i) => (
                <div
                  key={pub.id}
                  className={cn(
                    "flex flex-col gap-1.5 py-4",
                    i > 0 && "border-t border-zinc-800/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {pub.url ? (
                      <a
                        href={pub.url}
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
                    <p className="text-[11px] text-zinc-600">
                      {pub.venue}
                      {pub.authors && (
                        <>
                          <span className="text-zinc-800 mx-1.5">·</span>
                          {pub.authors}
                        </>
                      )}
                    </p>
                    {pub.citations != null && pub.citations > 0 && (
                      <span className="text-[10px] text-zinc-700 tabular-nums">
                        {pub.citations.toLocaleString()} citations
                      </span>
                    )}
                  </div>
                  {pub.abstract && (
                    <p className="text-[11px] text-zinc-600 leading-[1.6] line-clamp-2 mt-0.5">
                      {pub.abstract}
                    </p>
                  )}
                </div>
              ))}
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
                      {grant.amount && (
                        <>
                          <span className="text-zinc-800">·</span>
                          <span className="text-[12px] text-zinc-500 tabular-nums">
                            {formatUSD(grant.amount)}
                          </span>
                        </>
                      )}
                    </div>
                    {(grant.startDate || grant.endDate) && (
                      <span className="text-[11px] text-zinc-700 tabular-nums shrink-0">
                        {grant.startDate?.slice(0, 4)}
                        {grant.endDate && `–${grant.endDate.slice(0, 4)}`}
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

      {skills.length > 0 && (
        <>
          <Rule />
          {/* ── Skills ───────────────────────────────────────────── */}
          <Section label="Skills & Tools" delay={280}>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2.5 py-1 rounded-[3px] text-[12px] text-blue-400 bg-slate-800 leading-none"
                >
                  {skill}
                </span>
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
          piName={lab.piName}
          piEmail={lab.email}
          labName={lab.labName}
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
                <SimilarLabCard key={sl.id} lab={sl} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
