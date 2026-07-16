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
  compatibilityScore: number;
  strengths: string[];
  potentialConflicts: string[];
  summary: string;
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
          content: "You are an expert roommate compatibility evaluator. Compare the lifestyle preferences of two students and determine how compatible they would be as roommates. Focus on practical day-to-day living compatibility. Be balanced and identify both strengths and potential conflicts.\n\nProvide your response in this exact paragraph format:\n\nCompatibility Score: [0-100]\n\nStrengths:\n- [strength 1]\n- [strength 2]\n\nPotential Conflicts:\n- [conflict 1]\n- [conflict 2]\n\nSummary: [brief summary]",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Analyze lifestyle compatibility between two potential roommates.",
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

  return parseParagraphResponse(content);
}

function parseParagraphResponse(content: string): LifestyleMatchResult {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let compatibilityScore = 50;
  const strengths: string[] = [];
  const potentialConflicts: string[] = [];
  let summary = "";
  
  let currentSection: 'score' | 'strengths' | 'conflicts' | 'summary' | null = null;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('compatibility score') || lowerLine.includes('score:')) {
      const match = line.match(/\d+/);
      if (match) {
        compatibilityScore = parseInt(match[0], 10);
      }
      currentSection = 'score';
    } else if (lowerLine.includes('strengths') || lowerLine.includes('strength:')) {
      currentSection = 'strengths';
    } else if (lowerLine.includes('potential conflicts') || lowerLine.includes('conflicts') || lowerLine.includes('conflict:')) {
      currentSection = 'conflicts';
    } else if (lowerLine.includes('summary') || lowerLine.includes('summary:')) {
      currentSection = 'summary';
      const summaryMatch = line.replace(/summary:?/i, '').trim();
      if (summaryMatch) {
        summary = summaryMatch;
      }
    } else {
      // Parse list items
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        const item = line.replace(/^[-•*]\s*/, '').trim();
        if (item) {
          if (currentSection === 'strengths') {
            strengths.push(item);
          } else if (currentSection === 'conflicts') {
            potentialConflicts.push(item);
          }
        }
      } else if (currentSection === 'summary' && !summary) {
        summary = line;
      }
    }
  }
  
  // Fallback: if no structured data found, try to extract from the whole text
  if (strengths.length === 0 && potentialConflicts.length === 0) {
    // Simple keyword-based extraction as fallback
    const positiveKeywords = ['compatible', 'similar', 'aligned', 'good match', 'well-suited'];
    const negativeKeywords = ['conflict', 'different', 'mismatch', 'concern', 'issue'];
    
    const sentences = content.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 10);
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (positiveKeywords.some(kw => lowerSentence.includes(kw))) {
        strengths.push(sentence);
      }
      if (negativeKeywords.some(kw => lowerSentence.includes(kw))) {
        potentialConflicts.push(sentence);
      }
    }
    
    if (!summary) {
      summary = content.substring(0, 200) + '...';
    }
  }
  
  return {
    compatibilityScore: Math.min(100, Math.max(0, compatibilityScore)),
    strengths: strengths.slice(0, 5), // Limit to 5 strengths
    potentialConflicts: potentialConflicts.slice(0, 5), // Limit to 5 conflicts
    summary: summary || content.substring(0, 200) + '...',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
