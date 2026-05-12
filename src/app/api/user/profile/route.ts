import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(null, { status: 401 });
  }

  const { data } = await supabase
    .from("user_profiles")
    .select("major, year, skills, interests")
    .eq("id", user.id)
    .single();

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { major?: string; year?: string; skills?: string; interests?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({
      id: user.id,
      major: body.major ?? null,
      year: body.year ?? null,
      skills: body.skills ?? null,
      interests: body.interests ?? null,
      updated_at: new Date().toISOString(),
    })
    .select("major, year, skills, interests")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
