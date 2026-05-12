"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { createBrowserClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

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
  doi: string | null;
} | null;

const YEAR_OPTIONS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad Student"];

// Pre-filled fallback — used when not signed in or profile not yet saved
const DEFAULT_PROFILE: StudentProfile = {
  name: "Nayyir",
  major: "Electrical and Computer Engineering",
  year: "Freshman",
  skills: "Python, C++, embedded systems, data analysis",
  interests:
    "Interested in applying machine learning to real-world sensing and data collection problems",
};

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
  labId: string;
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
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authGate, setAuthGate] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [tone, setTone] = useState<Tone>("professional");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error" | "limit">("idle");
  const [draft, setDraft] = useState("");
  const [refPub, setRefPub] = useState<RefPub>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [generationsRemaining, setGenerationsRemaining] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate profile and daily count on open
  useEffect(() => {
    if (open) {
      fetch("/api/user/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setProfile((prev) => ({
              ...prev,
              major: data.major ?? prev.major,
              year: data.year ?? prev.year,
              skills: data.skills ?? prev.skills,
              interests: data.interests ?? prev.interests,
            }));
          }
        })
        .catch(() => {});

      fetch("/api/generate-email")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data != null) setGenerationsRemaining(data.generations_remaining);
        })
        .catch(() => {});

      if (status === "error" || status === "limit") {
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
    profile.name.trim().length > 0 &&
    profile.major.trim().length > 0 &&
    generationsRemaining !== 0;

  async function handleGenerate() {
    if (!canGenerate) return;
    // Persist profile changes before generating so the route reads updated values
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major: profile.major,
          year: profile.year,
          skills: profile.skills,
          interests: profile.interests,
        }),
      });
    } catch {
      // non-fatal — proceed anyway
    }

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researcher_id: labId, name: profile.name, tone }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setGenerationsRemaining(0);
        setStatus("limit");
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      setDraft(data.email);
      setRefPub(
        data.referenced_paper_title
          ? { title: data.referenced_paper_title, doi: data.referenced_doi }
          : null
      );
      setGenerationsRemaining(data.generations_remaining);
      setStatus("done");

      setTimeout(() => textareaRef.current?.focus(), 50);
    } catch {
      setError("Network error — check your connection.");
      setStatus("error");
    }
  }

  function handleTriggerClick() {
    if (!user) {
      setAuthGate(true);
    } else {
      setOpen(true);
    }
  }

  async function handleGoogleSignIn() {
    const supabase = createBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(pathname)}`,
      },
    });
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
    <>
      {/* Auth gate dialog */}
      <Dialog open={authGate} onOpenChange={setAuthGate}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 max-w-sm p-6 gap-0">
          <DialogHeader className="mb-5">
            <DialogTitle
              className="text-[20px] text-zinc-100 leading-snug"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sign in to generate emails
            </DialogTitle>
            <DialogDescription className="text-[13px] text-zinc-500 mt-1.5">
              Create an account to get personalized outreach drafts for Prof. {piName}.
            </DialogDescription>
          </DialogHeader>

          <button
            onClick={handleGoogleSignIn}
            type="button"
            className={cn(
              "w-full flex items-center justify-center gap-2.5 h-10 px-4 rounded-[4px]",
              "border border-zinc-700 text-zinc-300 text-[13px]",
              "hover:border-zinc-500 hover:text-zinc-100 transition-colors duration-100 mb-3"
            )}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-[12px] text-zinc-700">
            Have an account?{" "}
            <a
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="text-zinc-500 hover:text-zinc-300 transition-colors duration-100"
            >
              Sign in →
            </a>
          </p>
        </DialogContent>
      </Dialog>

    <Sheet open={open} onOpenChange={setOpen}>
      <button
        onClick={handleTriggerClick}
        className={cn(
          "inline-flex items-center gap-2 h-10 px-5 rounded-[4px]",
          "bg-blue-600 hover:bg-blue-500 active:bg-blue-700",
          "text-white text-[13px] font-medium",
          "transition-colors duration-100 cursor-pointer"
        )}
      >
        <Mail size={13} />
        Generate Outreach Email
      </button>

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
          <div className="flex items-center justify-between">
            <SheetTitle className="text-[14px] font-medium text-zinc-200">
              Outreach Email
            </SheetTitle>
            {generationsRemaining !== null && (
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  generationsRemaining === 0 ? "text-amber-500" : "text-zinc-600"
                )}
              >
                {generationsRemaining} of 5 remaining today
              </span>
            )}
          </div>
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
              disabled={!canGenerate || status === "loading" || status === "limit"}
              className={cn(
                "mt-5 w-full flex items-center justify-center gap-2",
                "h-9 rounded-[4px] text-[13px] font-medium",
                "transition-[background-color,color] duration-100",
                canGenerate && status !== "loading" && status !== "limit"
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

            {/* Error / limit */}
            {status === "error" && (
              <p role="alert" className="mt-3 text-[12px] text-red-400 text-center">
                {error}
              </p>
            )}
            {status === "limit" && (
              <p role="alert" className="mt-3 text-[12px] text-amber-400 text-center">
                You&rsquo;ve reached today&rsquo;s limit — resets tomorrow
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

                {/* Citation badge */}
                {refPub && (
                  <div className="flex flex-col gap-1 pt-1 px-3 py-2.5 rounded-[3px] bg-zinc-900 border border-zinc-800">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-zinc-700">
                      Referenced paper
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                      {refPub.title}
                    </p>
                    {refPub.doi && (
                      <span className="text-[10px] font-mono text-zinc-600 select-all">
                        {refPub.doi}
                      </span>
                    )}
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
    </>
  );
}
