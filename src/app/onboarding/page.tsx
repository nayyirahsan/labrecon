"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const YEAR_OPTIONS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad Student"];

const inputCls = cn(
  "w-full h-9 px-3 rounded-[3px] text-[13px]",
  "bg-zinc-900 border border-zinc-800",
  "text-zinc-200 placeholder:text-zinc-700",
  "outline-none focus:border-zinc-600 transition-colors duration-100"
);

const selectCls = cn(inputCls, "appearance-none cursor-pointer");

export default function OnboardingPage() {
  const router = useRouter();
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("Freshman");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ major, year, skills, interests }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1
          className="text-[28px] text-zinc-100 mb-1 leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Set up your profile
        </h1>
        <p className="text-[13px] text-zinc-600 mb-8">
          Used to personalize your outreach emails
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_120px] gap-2.5">
            <div>
              <label
                htmlFor="major"
                className="block text-[10px] uppercase tracking-[0.12em] text-zinc-600 mb-1.5"
              >
                Major
              </label>
              <input
                id="major"
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                required
                placeholder="Computer Science"
                className={inputCls}
              />
            </div>
            <div>
              <label
                htmlFor="year"
                className="block text-[10px] uppercase tracking-[0.12em] text-zinc-600 mb-1.5"
              >
                Year
              </label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={selectCls}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="skills"
              className="block text-[10px] uppercase tracking-[0.12em] text-zinc-600 mb-1.5"
            >
              Skills{" "}
              <span className="text-zinc-800 normal-case tracking-normal">
                — comma-separated
              </span>
            </label>
            <input
              id="skills"
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Python, PyTorch, linear algebra…"
              className={inputCls}
            />
          </div>

          <div>
            <label
              htmlFor="interests"
              className="block text-[10px] uppercase tracking-[0.12em] text-zinc-600 mb-1.5"
            >
              Research interests{" "}
              <span className="text-zinc-800 normal-case tracking-normal">
                — 1–2 sentences
              </span>
            </label>
            <textarea
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="I'm interested in applying machine learning to robotic systems…"
              rows={3}
              className={cn(
                "w-full px-3 py-2 rounded-[3px] text-[13px] leading-[1.55] resize-none",
                "bg-zinc-900 border border-zinc-800",
                "text-zinc-200 placeholder:text-zinc-700",
                "outline-none focus:border-zinc-600 transition-colors duration-100"
              )}
            />
          </div>

          {error && (
            <p role="alert" className="text-[12px] text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !major.trim()}
            className={cn(
              "h-9 rounded-[4px] text-[13px] font-medium mt-1 transition-colors duration-100",
              loading || !major.trim()
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Saving…
              </span>
            ) : (
              "Continue to LabRecon"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
