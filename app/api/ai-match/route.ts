import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { supabase } from "@/lib/supabase";

type PreferenceMap = Record<string, string>;

type UserProfile = {
  email: string;
  name: string | null;
  year: string | null;
  course: string | null;
  gender: string | null;
  room_number: string | null;
  is_open_to_switch: boolean | null;
  preferences: PreferenceMap | null;
};

type AiMatchResult = {
  candidateId: string;
  score: number;
  summary: string;
  strengths: string[];
  conflicts: string[];
  recommendation: string;
};

type GrokChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

const USER_SELECT = "email, name, year, course, gender, preferences, room_number, is_open_to_switch";
const GROK_CHAT_COMPLETIONS_URL = "https://api.x.ai/v1/chat/completions";
const GROK_MODEL = process.env.XAI_MODEL ?? "grok-4.5";

export async function POST(request: NextRequest) {
  try {
    const currentUserEmail = await getCurrentUserEmail(request);

    if (!currentUserEmail) {
      return Response.json({ error: "Unauthorized. Please sign in before requesting AI matches." }, { status: 401 });
    }

    const currentUser = await fetchCurrentUser(currentUserEmail);

    if (!currentUser) {
      return Response.json({ error: "Current user profile was not found." }, { status: 404 });
    }

    if (!currentUser.gender || !currentUser.year) {
      return Response.json(
        { error: "Complete gender and year in your profile before requesting AI matches." },
        { status: 400 },
      );
    }

    // Try parsing candidateEmails from request body (optional single/specific candidate analysis)
    const body = await request.json().catch(() => ({}));
    const candidateEmails = body.candidateEmails;

    let candidates: UserProfile[] = [];
    if (Array.isArray(candidateEmails) && candidateEmails.length > 0) {
      const { data, error: fetchErr } = await supabase
        .from("users")
        .select(USER_SELECT)
        .in("email", candidateEmails);

      if (fetchErr) {
        throw new Error(`Could not fetch specified candidates: ${fetchErr.message}`);
      }
      candidates = (data ?? []) as UserProfile[];
    } else {
      candidates = await fetchCandidates(currentUser);
    }

    if (candidates.length === 0) {
      return Response.json([]);
    }

    const matches = await rankCandidatesWithGrok(currentUser, candidates);
    return Response.json(matches);
  } catch (error) {
    console.error("AI match route failed:", error);

    const message = error instanceof Error ? error.message : "Unexpected error while ranking matches.";
    const status = message.includes("API request failed") ? 502 : 500;

    return Response.json({ error: message }, { status });
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}

async function getCurrentUserEmail(request: NextRequest) {
  const cookies = Object.fromEntries(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value]));
  const authorization = request.headers.get("authorization") ?? undefined;

  const token = await getToken({
    req: {
      cookies,
      headers: authorization ? { authorization } : {},
    } as never,
    secret: process.env.NEXTAUTH_SECRET,
  });

  return typeof token?.email === "string" ? token.email : null;
}

async function fetchCurrentUser(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("email", email)
    .single();

  if (error) {
    throw new Error(`Could not fetch current user: ${error.message}`);
  }

  return data as UserProfile | null;
}

async function fetchCandidates(currentUser: UserProfile) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("gender", currentUser.gender)
    .eq("year", currentUser.year)
    .neq("email", currentUser.email);

  if (error) {
    throw new Error(`Could not fetch candidates: ${error.message}`);
  }

  const candidates = (data ?? []) as UserProfile[];

  return candidates
    .sort((a, b) => {
      const aSameCourse = normalize(a.course) === normalize(currentUser.course) ? 1 : 0;
      const bSameCourse = normalize(b.course) === normalize(currentUser.course) ? 1 : 0;

      if (bSameCourse !== aSameCourse) return bSameCourse - aSameCourse;
      return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    })
    .slice(0, 10);
}

async function rankCandidatesWithGrok(currentUser: UserProfile, candidates: UserProfile[]) {
  const apiKey = process.env.XAI_API_KEY ?? process.env.GROK_API_KEY ?? process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("API key is missing. Please configure XAI_API_KEY, GROK_API_KEY, or GROQ_API_KEY.");
  }

  const isGroq = apiKey.startsWith("gsk_") || !process.env.XAI_API_KEY;
  const completionsUrl = isGroq
    ? "https://api.groq.com/openai/v1/chat/completions"
    : GROK_CHAT_COMPLETIONS_URL;
  const model = isGroq
    ? (process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile")
    : GROK_MODEL;

  const response = await fetch(completionsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are an expert roommate compatibility evaluator. Your goal is to HONESTLY evaluate whether two people can successfully share a room.\n\n" +
            "IMPORTANT RULES:\n" +
            "1. Identify conflicts BEFORE strengths.\n" +
            "2. Major conflicts should HEAVILY reduce the score:\n" +
            "   - Cleanliness standards\n" +
            "   - Sleep schedule differences\n" +
            "   - Guest frequency preferences\n" +
            "   - Shared responsibilities\n" +
            "   - Study environment needs\n\n" +
            "3. Minor differences should have VERY LITTLE impact:\n" +
            "   - Birthdays\n" +
            "   - Decorations\n" +
            "   - Hobbies\n\n" +
            "4. NEVER inflate scores. Be brutally honest.\n\n" +
            "SCORING GUIDE:\n" +
            "90-100: Nearly ideal roommate pair\n" +
            "75-89: Strong compatibility with minor differences\n" +
            "60-74: Reasonable compatibility but several compromises needed\n" +
            "40-59: Significant lifestyle differences. Roommate relationship may require effort\n" +
            "0-39: Poor compatibility. Frequent conflicts likely\n\n" +
            "REQUIREMENTS:\n" +
            "- Always provide 2-4 strengths\n" +
            "- Always provide 2-4 conflicts/weaknesses\n" +
            "- If major conflicts exist, they MUST appear in the conflicts section\n" +
            "- Summary should be 2-4 sentences, honest and direct\n\n" +
            "Return ONLY valid JSON in this exact format:\n" +
            "[\n" +
            "  {\n" +
            "    \"candidateId\": \"email@example.com\",\n" +
            "    \"score\": 75,\n" +
            "    \"summary\": \"...\",\n" +
            "    \"strengths\": [\"...\", \"...\"],\n" +
            "    \"conflicts\": [\"...\", \"...\"],\n" +
            "    \"recommendation\": \"Good Match\"\n" +
            "  }\n" +
            "]",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Evaluate roommate compatibility for the current user with each candidate.",
            currentUser: toAiProfile(currentUser),
            candidates: candidates.map(toAiProfile),
          }),
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as GrokChatResponse | null;

  if (!response.ok) {
    throw new Error(`AI API request failed: ${payload?.error?.message ?? response.statusText}`);
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI API returned an empty ranking response.");
  }

  return validateRankings(JSON.parse(content), candidates);
}

function validateRankings(value: unknown, candidates: UserProfile[]) {
  if (!Array.isArray(value)) {
    throw new Error("Grok API returned invalid JSON: expected an array.");
  }

  const candidateIds = new Set(candidates.map((candidate) => candidate.email));
  const seen = new Set<string>();

  return value
    .map((item) => {
      if (!isRecord(item)) {
        throw new Error("Grok API returned invalid ranking item.");
      }

      const candidateId = item.candidateId;
      const score = item.score;
      const summary = item.summary;
      const strengths = item.strengths;
      const conflicts = item.conflicts;
      const recommendation = item.recommendation;

      if (typeof candidateId !== "string" || !candidateIds.has(candidateId) || seen.has(candidateId)) {
        throw new Error("Grok API returned an unknown or duplicate candidateId.");
      }

      if (typeof score !== "number" || score < 0 || score > 100) {
        throw new Error("Grok API returned an invalid score.");
      }

      if (typeof summary !== "string" || summary.trim().length === 0) {
        throw new Error("Grok API returned an invalid summary.");
      }

      if (!Array.isArray(strengths) || strengths.length === 0) {
        throw new Error("Grok API returned invalid strengths.");
      }

      if (!Array.isArray(conflicts) || conflicts.length === 0) {
        throw new Error("Grok API returned invalid conflicts.");
      }

      let finalRecommendation = recommendation as string;
      if (typeof recommendation !== "string" || !["Excellent Match", "Good Match", "Moderate Match", "Challenging Match"].includes(recommendation)) {
        // Fallback to a default recommendation if invalid
        finalRecommendation = "Moderate Match";
      }

      seen.add(candidateId);

      return {
        candidateId,
        score: Math.round(score),
        summary: summary.trim(),
        strengths: strengths.slice(0, 4).map((s: string) => s.trim()),
        conflicts: conflicts.slice(0, 4).map((c: string) => c.trim()),
        recommendation: finalRecommendation,
      } satisfies AiMatchResult;
    })
    .sort((a, b) => b.score - a.score);
}

function toAiProfile(profile: UserProfile) {
  return {
    candidateId: profile.email,
    name: profile.name,
    year: profile.year,
    course: profile.course,
    gender: profile.gender,
    preferences: profile.preferences ?? {},
  };
}

function normalize(value: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
