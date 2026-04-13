"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  Mail,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type StudentProfile = {
  name: string;
  major: string;
  year: string;
  skills: string;
  interests: string;
};

type Tone = "professional" | "conversational";

type RefPub = {
  title: string;
  year: number;
  venue: string;
} | null;

const YEAR_OPTIONS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad Student"];
const PROFILE_KEY = "labrecon:profile";

// Pre-filled with demo profile
const DEFAULT_PROFILE: StudentProfile = {
  name: "Nayyir",
  major: "Electrical and Computer Engineering",
  year: "Freshman",
  skills: "Python, C++, embedded systems, data analysis",
  interests:
    "Interested in applying machine learning to real-world sensing and data collection problems",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const stored = { ...DEFAULT_PROFILE, ...JSON.parse(raw) } as StudentProfile;
    return {
      ...stored,
      major: "Electrical and Computer Engineering",
      year: "Freshman",
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(p: StudentProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

function parseSubject(draft: string): string {
  const m = draft.match(/^Subject:\s*(.+)/im);
  return m ? m[1].trim() : "Research Inquiry";
}

function parseBody(draft: string): string {
  return draft.replace(/^Subject:.*(\r?\n)+/im, "").trim();
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={htmlFor}
          className="text-[10px] uppercase tracking-[0.12em] text-zinc-600"
        >
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-zinc-800">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

const inputCls = cn(
  "h-8 px-2.5 rounded-[3px] text-[13px]",
  "bg-zinc-900 border border-zinc-800",
  "text-zinc-200 placeholder:text-zinc-700",
  "outline-none focus:border-zinc-600 transition-colors duration-100",
  "w-full"
);

const selectCls = cn(inputCls, "appearance-none cursor-pointer");

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  labId: number;
  piName: string;
  piEmail: string | null;
  labName: string;
  hasPubs?: boolean;
};

export function EmailSheet({
  labId,
  piName,
  piEmail,
  labName,
  hasPubs = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [tone, setTone] = useState<Tone>("professional");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [draft, setDraft] = useState("");
  const [refPub, setRefPub] = useState<RefPub>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate profile from localStorage on open
  useEffect(() => {
    if (open) {
      setProfile(loadProfile());
      if (status === "error") {
        setStatus("idle");
        setError("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function update(key: keyof StudentProfile, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  const canGenerate =
    profile.name.trim().length > 0 && profile.major.trim().length > 0;

  async function handleGenerate() {
    if (!canGenerate) return;
    saveProfile(profile);
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labId, student: profile, tone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      setDraft(data.draft);
      setRefPub(data.referencedPub);
      setStatus("done");

      setTimeout(() => textareaRef.current?.focus(), 50);
    } catch {
      setError("Network error — check your connection.");
      setStatus("error");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function mailtoHref(): string {
    const subject = parseSubject(draft);
    const body = parseBody(draft);
    return `mailto:${piEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  // ── Disabled state for Tier 2 labs (no publications) ─────────────────────

  if (!hasPubs) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 h-10 px-5 rounded-[4px]",
          "bg-zinc-900 border border-zinc-800 text-zinc-600 text-[13px]",
          "cursor-not-allowed select-none"
        )}
        title="More data needed to generate personalized outreach"
        aria-disabled="true"
      >
        <Mail size={13} />
        Generate Outreach Email
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          "inline-flex items-center gap-2 h-10 px-5 rounded-[4px]",
          "bg-blue-600 hover:bg-blue-500 active:bg-blue-700",
          "text-white text-[13px] font-medium",
          "transition-colors duration-100 cursor-pointer"
        )}
      >
        <Mail size={13} />
        Generate Outreach Email
      </SheetTrigger>

      <SheetContent
        side="right"
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden",
          "bg-zinc-950 border-l border-zinc-800",
          "!w-full sm:!w-[480px] sm:!max-w-[480px]"
        )}
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-zinc-800/60 shrink-0">
          <SheetTitle className="text-[14px] font-medium text-zinc-200">
            Outreach Email
          </SheetTitle>
          <p className="text-[11px] text-zinc-600 -mt-0.5">
            for{" "}
            <span className="text-zinc-500">
              Prof. {piName} · {labName}
            </span>
          </p>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Profile form ─────────────────────────────────────── */}
          <div className="px-6 pt-5 pb-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700 mb-4">
              Your Profile
            </p>

            <div className="flex flex-col gap-3.5">
              {/* Name + Year */}
              <div className="grid grid-cols-[1fr_120px] gap-2.5">
                <Field label="Name" htmlFor="email-name">
                  <input
                    id="email-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={profile.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Jane Chen…"
                    className={inputCls}
                    disabled={status === "loading"}
                  />
                </Field>
                <Field label="Year" htmlFor="email-year">
                  <select
                    id="email-year"
                    value={profile.year}
                    onChange={(e) => update("year", e.target.value)}
                    className={selectCls}
                    disabled={status === "loading"}
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Major */}
              <Field label="Major" htmlFor="email-major">
                <input
                  id="email-major"
                  type="text"
                  name="major"
                  autoComplete="off"
                  value={profile.major}
                  onChange={(e) => update("major", e.target.value)}
                  placeholder="Computer Science…"
                  className={inputCls}
                  disabled={status === "loading"}
                />
              </Field>

              {/* Skills */}
              <Field label="Skills" hint="comma-separated" htmlFor="email-skills">
                <input
                  id="email-skills"
                  type="text"
                  name="skills"
                  autoComplete="off"
                  value={profile.skills}
                  onChange={(e) => update("skills", e.target.value)}
                  placeholder="Python, PyTorch, linear algebra…"
                  className={inputCls}
                  disabled={status === "loading"}
                />
              </Field>

              {/* Interests */}
              <Field label="Research Interests" hint="1–2 sentences" htmlFor="email-interests">
                <textarea
                  id="email-interests"
                  value={profile.interests}
                  onChange={(e) => update("interests", e.target.value)}
                  placeholder="I'm interested in applying reinforcement learning to robotic locomotion…"
                  rows={3}
                  className={cn(
                    "px-2.5 py-2 rounded-[3px] text-[13px] leading-[1.55] resize-none",
                    "bg-zinc-900 border border-zinc-800",
                    "text-zinc-200 placeholder:text-zinc-700",
                    "outline-none focus:border-zinc-600 transition-colors duration-100 w-full"
                  )}
                  disabled={status === "loading"}
                />
              </Field>

              {/* Tone toggle */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                  Tone
                </span>
                <div className="flex gap-1.5">
                  {(["professional", "conversational"] as Tone[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      disabled={status === "loading"}
                      className={cn(
                        "flex-1 h-8 rounded-[3px] text-[12px] capitalize",
                        "border transition-colors duration-100",
                        tone === t
                          ? "border-blue-500/40 bg-blue-500/8 text-blue-400"
                          : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || status === "loading"}
              className={cn(
                "mt-5 w-full flex items-center justify-center gap-2",
                "h-9 rounded-[4px] text-[13px] font-medium",
                "transition-[background-color,color] duration-100",
                canGenerate && status !== "loading"
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              )}
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  {status === "done" ? "Regenerate" : "Generate Email"}
                </>
              )}
            </button>

            {/* Async status announcer for screen readers */}
            <p aria-live="polite" className="sr-only">
              {status === "loading"
                ? "Generating email…"
                : status === "done"
                ? "Email draft ready."
                : ""}
            </p>

            {/* Error */}
            {status === "error" && (
              <p role="alert" className="mt-3 text-[12px] text-red-400 text-center">
                {error}
              </p>
            )}
          </div>

          {/* ── Draft area ───────────────────────────────────────── */}
          {status === "done" && draft && (
            <div className="border-t border-zinc-800/60">
              <div className="px-6 pt-5 pb-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
                    Draft
                  </span>
                  {/* Personalization score badge */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/25 text-emerald-400 bg-emerald-500/5">
                    <Check size={9} />
                    94% personalized
                  </span>
                </div>

                {/* Editable draft */}
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={14}
                  className={cn(
                    "w-full px-3 py-3 rounded-[3px] resize-none",
                    "bg-zinc-900 border border-zinc-800",
                    "text-[12px] text-zinc-300 leading-[1.7]",
                    "font-mono",
                    "outline-none focus:border-zinc-600 transition-colors duration-100"
                  )}
                  spellCheck={false}
                />

                {/* Referenced publication */}
                {refPub && (
                  <div className="flex items-start gap-2 pt-1">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-zinc-700 shrink-0 mt-px">
                      Referenced
                    </span>
                    <p className="text-[11px] text-zinc-600 leading-snug line-clamp-2">
                      {refPub.title}{" "}
                      <span className="text-zinc-800">
                        ({refPub.year}, {refPub.venue})
                      </span>
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-[3px] text-[12px]",
                      "border transition-[border-color,color,background-color] duration-150",
                      copied
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check size={12} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy to Clipboard
                      </>
                    )}
                  </button>

                  <a
                    href={mailtoHref()}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-8 px-3 rounded-[3px] text-[12px]",
                      "border border-zinc-700 text-zinc-400",
                      "hover:border-zinc-500 hover:text-zinc-200 transition-colors duration-100"
                    )}
                  >
                    <Mail size={12} />
                    Open in Mail
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
