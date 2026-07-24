import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { supabase } from "@/lib/supabase";

type PreferenceMap = Record<string, string>;

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  year: string | null;
  course: string | null;
  gender: string | null;
  room_number: string | null;
  is_open_to_switch: boolean | null;
  preferences: PreferenceMap | null;
};

type LifestyleMatchResult = {
  score: number;
  summary: string;
  strengths: string[];
  conflicts: string[];
  recommendation: string;
};

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

const USER_SELECT = "id, email, name, year, course, gender, preferences, room_number, is_open_to_switch";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export async function POST(request: NextRequest) {
  try {
    const currentUserEmail = await getCurrentUserEmail(request);

    if (!currentUserEmail) {
      return Response.json({ error: "Unauthorized. Please sign in before requesting lifestyle analysis." }, { status: 401 });
    }

    const body = await request.json();
    const { currentUserId, candidateUserId } = body;

    if (!currentUserId || !candidateUserId) {
      return Response.json({ error: "currentUserId and candidateUserId are required." }, { status: 400 });
    }

    const currentUser = await fetchUserById(currentUserId);
    const candidateUser = await fetchUserById(candidateUserId);

    if (!currentUser) {
      return Response.json({ error: "Current user profile was not found." }, { status: 404 });
    }

    if (!candidateUser) {
      return Response.json({ error: "Candidate user profile was not found." }, { status: 404 });
    }

    const result = await analyzeLifestyleCompatibility(currentUser, candidateUser);
    return Response.json(result);
  } catch (error) {
    console.error("Lifestyle match route failed:", error);

    const message = error instanceof Error ? error.message : "Unexpected error while analyzing lifestyle compatibility.";
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

async function fetchUserById(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Could not fetch user: ${error.message}`);
  }

  return data as UserProfile | null;
}

async function analyzeLifestyleCompatibility(currentUser: UserProfile, candidateUser: UserProfile) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing. Please configure the environment variable.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
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
            "{\n" +
            "  \"score\": 75,\n" +
            "  \"summary\": \"...\",\n" +
            "  \"strengths\": [\"...\", \"...\"],\n" +
            "  \"conflicts\": [\"...\", \"...\"],\n" +
            "  \"recommendation\": \"Good Match\"\n" +
            "}",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Evaluate roommate compatibility between two potential roommates.",
            currentUserPreferences: currentUser.preferences ?? {},
            candidateUserPreferences: candidateUser.preferences ?? {},
          }),
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as GroqChatResponse | null;

  if (!response.ok) {
    throw new Error(`AI API request failed: ${payload?.error?.message ?? response.statusText}`);
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI API returned an empty response.");
  }

  return validateJsonResponse(JSON.parse(content));
}

function validateJsonResponse(value: unknown): LifestyleMatchResult {
  if (!isRecord(value)) {
    throw new Error("AI API returned invalid JSON: expected an object.");
  }

  const score = value.score;
  const summary = value.summary;
  const strengths = value.strengths;
  const conflicts = value.conflicts;
  const recommendation = value.recommendation;

  if (typeof score !== "number" || score < 0 || score > 100) {
    throw new Error("AI API returned an invalid score.");
  }

  if (typeof summary !== "string" || summary.trim().length === 0) {
    throw new Error("AI API returned an invalid summary.");
  }

  if (!Array.isArray(strengths) || strengths.length === 0) {
    throw new Error("AI API returned invalid strengths.");
  }

  if (!Array.isArray(conflicts) || conflicts.length === 0) {
    throw new Error("AI API returned invalid conflicts.");
  }

  let finalRecommendation = recommendation as string;
  if (typeof recommendation !== "string" || !["Excellent Match", "Good Match", "Moderate Match", "Challenging Match"].includes(recommendation)) {
    // Fallback to a default recommendation if invalid
    finalRecommendation = "Moderate Match";
  }

  return {
    score: Math.round(score),
    summary: summary.trim(),
    strengths: strengths.slice(0, 4).map((s: string) => s.trim()),
    conflicts: conflicts.slice(0, 4).map((c: string) => c.trim()),
    recommendation: finalRecommendation,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
