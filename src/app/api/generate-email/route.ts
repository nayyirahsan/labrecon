import Anthropic from "@anthropic-ai/sdk";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { labs, publications } from "@/lib/db/schema";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You write cold emails from undergraduate students to research professors.

Rules:
- Total length: under 200 words (not counting the subject line)
- Structure: subject line → hook → background → ask → closing
- Hook: 1 sentence that cites a specific finding or technique from the referenced paper — make it concrete, not vague praise
- Background: 2–3 sentences connecting the student's actual skills and experience to the lab's work
- Ask: one clear sentence requesting a 20-minute informational call or meeting
- Closing: one sentence with available days/times (make them up if not provided)
- Tone: professional but direct — like a capable student, not a supplicant
- No filler: ban "I would love to", "I am very excited about", "I came across your work", "as a student passionate about"
- Do not use bullet points — flowing prose only
- Subject line format: Subject: [concise subject, max 10 words]
- Sign off: "Best,\\n[Student Name]"`;

type StudentProfile = {
  name: string;
  major: string;
  year: string;
  skills: string;
  interests: string;
};

export async function POST(req: Request) {
  let body: { labId?: number; student?: StudentProfile };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { labId, student } = body;

  if (!labId || typeof labId !== "number") {
    return Response.json({ error: "labId is required" }, { status: 400 });
  }
  if (!student?.name?.trim() || !student?.major?.trim()) {
    return Response.json({ error: "name and major are required" }, { status: 400 });
  }

  // Fetch lab
  const lab = db.select().from(labs).where(eq(labs.id, labId)).get();
  if (!lab) {
    return Response.json({ error: "Lab not found" }, { status: 404 });
  }

  // Fetch recent publications (take the most recent as the reference)
  const pubs = db
    .select()
    .from(publications)
    .where(eq(publications.labId, labId))
    .orderBy(desc(publications.year))
    .limit(3)
    .all();

  const referencedPub = pubs[0] ?? null;

  // Build the user message
  const pubBlock = referencedPub
    ? `Recent publication to reference (use this specifically):
Title: "${referencedPub.title}"
Year: ${referencedPub.year}
Venue: ${referencedPub.venue}
${referencedPub.abstract ? `Key findings: ${referencedPub.abstract.slice(0, 350)}` : ""}`
    : `No publications available — reference the lab's research focus area instead.`;

  const userMessage = `Write a cold email with these details:

STUDENT
Name: ${student.name}
Major: ${student.major}
Year: ${student.year}
Technical skills: ${student.skills || "not specified"}
Research interests: ${student.interests || "not specified"}

PROFESSOR
Name: Prof. ${lab.piName}
Title: ${lab.piTitle}
Department: ${lab.department}
Lab: ${lab.labName}
Research focus: ${lab.researchSummary.slice(0, 500)}
Email: ${lab.email ?? "(not available)"}

${pubBlock}

Output only the email text, starting with "Subject:". No preamble, no explanation.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const draft =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    return Response.json({ draft, referencedPub });
  } catch (err) {
    console.error("[generate-email]", err);
    return Response.json(
      { error: "Failed to generate email. Check your ANTHROPIC_API_KEY." },
      { status: 500 }
    );
  }
}
