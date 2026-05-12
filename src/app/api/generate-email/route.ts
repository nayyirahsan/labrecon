import Anthropic from "@anthropic-ai/sdk";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { email_generations, publications, researchers, user_profiles } from "@/lib/db/schema";
import { createServerClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

const DAILY_LIMIT = 5;

const SYSTEM_PROMPTS = {
  professional: `You write cold emails from undergraduate students to research professors.

Rules:
- Total length: under 200 words (not counting the subject line or the Reference line)
- Structure: subject line → opening finding → background → ask → closing → Reference
- Do NOT start with "Dear Professor" or any salutation — open directly with the specific finding
- Opening: 1 sentence naming an exact result, number, or technique from the referenced paper — be concrete, not vague
- Background: 2–3 sentences connecting the student's actual skills to the specific methods used in the paper
- Ask: one clear sentence requesting a 20-minute informational call or meeting
- Closing: one sentence with available days/times (make them up), then sign off
- Tone: professional but direct — like a capable student, not a supplicant
- No filler: ban "I would love to", "I am very excited about", "I came across your work", "as a student passionate about"
- Flowing prose only — no bullet points
- Subject line format: Subject: [concise subject, max 10 words]
- Sign off: "Best,\\n[Student Name]"
- Final line (after sign off): "Reference: [DOI]" — use the actual DOI of the paper you referenced`,

  conversational: `You write warm, authentic cold emails from undergraduate students to research professors.

Rules:
- Total length: under 200 words (not counting the subject line or the Reference line)
- Do NOT start with "Dear Professor" or any salutation — open directly with the finding
- Opening: 1 sentence about a specific, concrete finding from one of the papers — name it exactly
- Background: 2 sentences connecting the student's actual background to the lab's specific methods
- Ask: casual, direct ask for a brief meeting or chat
- Closing: 1 sentence, friendly, with available times
- No filler: ban "I would love to", "I am passionate about", "I came across your research", "as someone who"
- Flowing prose only — no bullet points
- Subject line format: Subject: [concise subject, max 10 words]
- Sign off: "Thanks,\\n[Student Name]"
- Final line (after sign off): "Reference: [DOI]" — use the actual DOI of the paper you referenced`,
};

async function getDailyCount(userId: string): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(email_generations)
    .where(
      and(
        eq(email_generations.user_id, userId),
        sql`${email_generations.generated_at} > now() - interval '1 day'`
      )
    );
  return Number(result[0]?.value ?? 0);
}

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const generationsToday = await getDailyCount(user.id);
  return Response.json({
    generations_today: generationsToday,
    generations_remaining: Math.max(0, DAILY_LIMIT - generationsToday),
  });
}

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { researcher_id?: string; name?: string; tone?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { researcher_id, name = "Student", tone = "professional" } = body;

  if (!researcher_id || typeof researcher_id !== "string") {
    return Response.json({ error: "researcher_id is required" }, { status: 400 });
  }

  // Fetch researcher
  const researcher = await db
    .select()
    .from(researchers)
    .where(eq(researchers.id, researcher_id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!researcher) {
    return Response.json({ error: "Researcher not found" }, { status: 404 });
  }

  // Fetch 3 most recent publications ordered by year desc, cited_by_count desc
  const pubs = await db
    .select({
      title: publications.title,
      abstract: publications.abstract,
      venue: publications.venue,
      year: publications.year,
      doi: publications.doi,
    })
    .from(publications)
    .where(eq(publications.researcher_id, researcher_id))
    .orderBy(desc(publications.year), desc(publications.cited_by_count))
    .limit(3);

  // Fetch user profile
  const userProfile = await db
    .select()
    .from(user_profiles)
    .where(eq(user_profiles.id, user.id))
    .limit(1)
    .then((r) => r[0] ?? null);

  // Check daily limit
  const generationsToday = await getDailyCount(user.id);
  if (generationsToday >= DAILY_LIMIT) {
    return Response.json(
      { error: "Daily limit reached", limit: DAILY_LIMIT, reset: "tomorrow" },
      { status: 429 }
    );
  }

  const systemPrompt =
    tone === "conversational"
      ? SYSTEM_PROMPTS.conversational
      : SYSTEM_PROMPTS.professional;

  const referencedPub = pubs[0] ?? null;

  const pubsBlock =
    pubs.length > 0
      ? pubs
          .map(
            (p, i) =>
              `[Paper ${i + 1}]
Title: "${p.title}"
Year: ${p.year ?? "unknown"}
Venue: ${p.venue ?? "unknown"}
DOI: ${p.doi ?? "unavailable"}
Abstract: ${p.abstract ? p.abstract.slice(0, 400) : "not available"}`
          )
          .join("\n\n")
      : "No publications available — reference the research focus instead.";

  const userMessage = `Write a cold email with these details:

STUDENT
Name: ${name}
Major: ${userProfile?.major ?? "not specified"}
Year: ${userProfile?.year ?? "not specified"}
Technical skills: ${userProfile?.skills ?? "not specified"}
Research interests: ${userProfile?.interests ?? "not specified"}

PROFESSOR
Name: Prof. ${researcher.name}
Title: ${researcher.title ?? "Professor"}
Department: ${researcher.department ?? "not specified"}
Research focus: ${researcher.research_summary?.slice(0, 500) ?? "not specified"}

PUBLICATIONS (choose exactly ONE to reference):
${pubsBlock}

CRITICAL REQUIREMENTS:
1. Do NOT open with "Dear Professor" or any salutation — start the email body with the specific finding itself
2. Name the exact result, metric, technique, or conclusion from ONE paper — be precise, not vague
3. Connect the student's skills (${userProfile?.skills ?? "not specified"}) to a specific method or technique from that paper
4. The very last line of the email (after the sign-off) must be: "Reference: [DOI]" using the actual DOI
5. Keep under 200 words total (excluding subject line and Reference line)
6. Output only the email text, starting with "Subject:"`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 700,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const email =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Record generation
    await db.insert(email_generations).values({
      user_id: user.id,
      researcher_id,
    });

    const newTotal = generationsToday + 1;

    return Response.json({
      email,
      referenced_doi: referencedPub?.doi ?? null,
      referenced_paper_title: referencedPub?.title ?? null,
      generations_today: newTotal,
      generations_remaining: Math.max(0, DAILY_LIMIT - newTotal),
    });
  } catch (err) {
    console.error("[generate-email]", err);
    return Response.json(
      { error: "Failed to generate email. Check your ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
