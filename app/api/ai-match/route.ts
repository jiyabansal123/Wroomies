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
  compatibilityScore: number;
  reason: string;
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
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You rank roommate candidates. Use preferences as nuanced compatibility signals, not hard rules. Return only JSON that matches the schema.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Rank these candidates by roommate compatibility for the current user.",
            scoring:
              "Score 0-100. Prefer compatible daily routines, sleep, cleanliness, noise, guests, conflict style, sharing, and social expectations. Explain in one concise sentence.",
            currentUser: toAiProfile(currentUser),
            candidates: candidates.map(toAiProfile),
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "roommate_compatibility_rankings",
          strict: true,
          schema: {
            type: "array",
            minItems: 0,
            maxItems: 10,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["candidateId", "compatibilityScore", "reason"],
              properties: {
                candidateId: {
                  type: "string",
                  description: "The candidate email from the provided candidate profile.",
                },
                compatibilityScore: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },
                reason: {
                  type: "string",
                  minLength: 1,
                  maxLength: 240,
                },
              },
            },
          },
        },
      },
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
      const compatibilityScore = item.compatibilityScore;
      const reason = item.reason;

      if (typeof candidateId !== "string" || !candidateIds.has(candidateId) || seen.has(candidateId)) {
        throw new Error("Grok API returned an unknown or duplicate candidateId.");
      }

      if (typeof compatibilityScore !== "number" || compatibilityScore < 0 || compatibilityScore > 100) {
        throw new Error("Grok API returned an invalid compatibilityScore.");
      }

      if (typeof reason !== "string" || reason.trim().length === 0) {
        throw new Error("Grok API returned an invalid reason.");
      }

      seen.add(candidateId);

      return {
        candidateId,
        compatibilityScore: Math.round(compatibilityScore),
        reason: reason.trim(),
      } satisfies AiMatchResult;
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
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
