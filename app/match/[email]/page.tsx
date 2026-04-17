"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

import { 
  UserProfile, 
  MatchUser, 
  QUESTIONS, 
  calculateMatch, 
  calculatePreferenceSimilarity,
  formatCourse
} from "@/app/home-data";
] as const;

// logic removed, using centralized calculation

export default function MatchPage() {
  const { email } = useParams() as { email: string };
  const decodedEmail = decodeURIComponent(email);
  const { data: session, status } = useSession();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [match, setMatch] = useState<MatchUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;
    
    const loadInit = async () => {
      setLoading(true);
      
      const myEmail = session?.user?.email;
      if (!myEmail) return;
      
      // Load current user
      const { data: myData } = await supabase
        .from("users")
        .select("email, name, year, course, gender, preferences, room_number, is_open_to_switch")
        .eq("email", myEmail)
        .single();
        
      if (myData) setProfile(myData);
      
      // Load target user
      const { data: targetData } = await supabase
        .from("users")
        .select("email, name, year, course, gender, preferences, room_number, is_open_to_switch")
        .eq("email", decodedEmail)
        .single();
        
        if (myData && targetData) {
          const result = calculateMatch(myData, targetData);
          setMatch({ ...targetData, score: result.totalScore, reasons: result.reasons });
        }
      
      setLoading(false);
    };

    loadInit();
  }, [decodedEmail, session, status]);

  if (status === "loading" || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4 text-[var(--foreground)]">
        <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <p className="text-lg font-medium">Loading match data...</p>
        </div>
      </main>
    );
  }

  if (!profile || !match) {
    return (
       <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4 text-[var(--foreground)]">
        <h1 className="text-2xl font-semibold mb-4">Match not found</h1>
        <Link href="/" className="rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-medium text-[var(--text-on-brand)] outline-none hover:bg-[var(--brand-soft)] transition">Back to Dashboard</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/" className="text-sm text-[var(--brand)] hover:underline flex items-center gap-2 mb-6">
          ← Back to Dashboard
        </Link>
        <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm flex flex-col pt-2">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
              <div>
                <h2 className="text-2xl font-semibold">{match.name || "Unknown"}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{match.email}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-2 gap-4 text-sm bg-[var(--bg-sidebar)] rounded-xl p-5 border border-[var(--border)]">
                <div>
                  <p className="text-[var(--text-muted)] mb-1 text-xs uppercase tracking-wider font-semibold">Match score</p>
                  <p className="text-3xl font-bold text-[var(--brand)]">{match.score}%</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1 text-xs uppercase tracking-wider font-semibold">Current Setup</p>
                  <p className="font-medium truncate">Room: {match.room_number || "Not specified"}</p>
                  <p className="font-medium text-[var(--brand)] mt-1 flex items-center gap-1.5">
                    {match.is_open_to_switch ? <><span className="text-green-500">✓</span> Open to switch</> : <><span className="text-rose-500">✗</span> Not switching</>}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1 text-xs uppercase tracking-wider font-semibold">Student</p>
                  <p className="font-medium capitalize text-lg">{match.gender}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1 text-xs uppercase tracking-wider font-semibold">Academics</p>
                  <p className="font-medium text-lg">Year {match.year}</p>
                  <p className="font-medium uppercase text-lg">{match.course}</p>
                </div>
              </div>

              {match.reasons && match.reasons.length > 0 && (
                <div className="bg-[var(--bg-sidebar)] rounded-xl p-6 border border-[var(--border)]">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Why this match?</h4>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {match.reasons.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="text-[var(--brand)] text-lg">•</span> 
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="mb-5 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-3">
                  <span>Preferences Comparison</span>
                  <span className="h-px flex-1 bg-[var(--border)]"></span>
                </h3>
                <div className="space-y-4">
                  {QUESTIONS.map(q => {
                    const myAnswer = profile.preferences?.[q.id];
                    const theirAnswer = match.preferences?.[q.id];
                    if (!myAnswer && !theirAnswer) return null;
                    
                    const myOpt = q.options.find(o => o.value === myAnswer);
                    const theirOpt = q.options.find(o => o.value === theirAnswer);
                    
                    const isExactMatch = myAnswer === theirAnswer;
                    
                    return (
                      <div key={q.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm overflow-hidden shadow-sm">
                        <p className="mb-4 font-medium text-[var(--foreground)] text-base">{q.question}</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-[var(--bg-sidebar)] p-3 rounded-lg border border-[var(--border)]">
                            <span className="text-[var(--text-muted)] border-b border-[var(--border)] pb-2 mb-3 block font-semibold uppercase tracking-wider">You</span>
                            <p className="text-[var(--foreground)] text-sm">{myOpt?.label || "Not answered"}</p>
                          </div>
                          <div className={isExactMatch ? "bg-[var(--brand)]/10 p-3 rounded-lg border border-[var(--brand)]/30" : "bg-[var(--bg-sidebar)] p-3 rounded-lg border border-[var(--border)]"}>
                            <span className="text-[var(--text-muted)] border-b border-[var(--border)] pb-2 mb-3 block font-semibold uppercase tracking-wider">Them</span>
                            <p className={isExactMatch ? "text-[var(--brand)] font-semibold text-sm" : "text-[var(--foreground)] text-sm"}>
                              {theirOpt?.label || "Not answered"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!match.preferences || Object.keys(match.preferences).length === 0) && (
                     <div className="text-sm text-[var(--text-muted)] text-center py-6 border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-sidebar)]">They have not filled out their preferences yet.</div>
                  )}
                </div>
              </div>
            </div>
        </div>
      </div>
    </main>
  );
}
