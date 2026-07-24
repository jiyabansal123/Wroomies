"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

import {
  AuthView,
  LoadingView,
  MatchCard,
  MatchDetailModal,
  SectionShell,
  primaryButtonClass,
  secondaryButtonClass,
} from "../home-ui";
import {
  MatchRequest,
  MatchStatus,
  MatchUser,
  UserProfile,
  calculateExploreMatch,
  isSameYear,
} from "../home-data";

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedMatchEmail, setSelectedMatchEmail] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, { score: number; summary: string; strengths: string[]; conflicts: string[]; recommendation: string }>>({});
  const [analyzingEmails, setAnalyzingEmails] = useState<Record<string, boolean>>({});

  const userEmail = session?.user?.email ?? "";

  const processedMatches = useMemo(() => {
    return matches.map((match) => {
      const relevantRequests = matchRequests.filter(
        (request) =>
          (request.sender_email === userEmail && request.receiver_email === match.email) ||
          (request.receiver_email === userEmail && request.sender_email === match.email),
      );

      const request = relevantRequests.find((item) => item.status === "accepted") || relevantRequests[0];

      let matchStatus: MatchStatus = "none";
      if (request) {
        if (request.status === "accepted") matchStatus = "accepted";
        else if (request.status === "rejected") matchStatus = "rejected";
        else if (request.sender_email === userEmail) matchStatus = "pending_sent";
        else matchStatus = "pending_received";
      }

      return {
        ...match,
        matchStatus,
        requestId: request?.id,
      };
    });
  }, [matches, matchRequests, userEmail]);

  const selectedMatch = useMemo(() => {
    if (!selectedMatchEmail) return null;
    return processedMatches.find((match) => match.email === selectedMatchEmail) || null;
  }, [processedMatches, selectedMatchEmail]);

  useEffect(() => {
    if (!userEmail) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoadingProfile(true);
      setError("");

      try {
        const { data, error: fetchError } = await supabase
          .from("users")
          .select("email, name, year, course, gender, preferences, room_number, is_open_to_switch")
          .eq("email", userEmail)
          .single();

        if (fetchError) {
          setError(`Could not load profile: ${fetchError.message}`);
          return;
        }

        setProfile(data);
      } catch {
        setError("Unexpected error while loading your profile.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;

    const fetchMatchRequests = async () => {
      const { data, error: requestError } = await supabase
        .from("match_requests")
        .select("*")
        .or(`sender_email.eq.${userEmail},receiver_email.eq.${userEmail}`);

      if (!requestError && data) {
        setMatchRequests(data);
      }
    };

    fetchMatchRequests();
  }, [userEmail]);

  const findExploreMatches = async () => {
    if (!profile) return;

    setLoadingMatches(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("users")
        .select("email, name, year, course, gender, preferences, room_number, is_open_to_switch");

      if (fetchError) {
        setError(`Could not fetch matches: ${fetchError.message}`);
        return;
      }

      const scored = (data ?? [])
        .filter((candidate) => candidate.gender === profile.gender && candidate.email !== profile.email)
        .filter((candidate) => !isSameYear(profile, candidate))
        .map((candidate) => {
          const result = calculateExploreMatch(profile, candidate);
          return {
            ...candidate,
            primaryScore: result.primaryScore,
            preferenceScore: result.preferenceScore,
            totalScore: result.totalScore,
            score: result.score,
            reasons: result.reasons,
          };
        })
        .filter((candidate) => candidate.totalScore > 0)
        .sort((a, b) => b.totalScore - a.totalScore);

      setMatches(scored);
    } catch {
      setError("Unexpected error while finding explore matches.");
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (profile?.year && profile?.gender && profile?.preferences) {
      findExploreMatches();
    }
  }, [profile]);

  const handleAnalyzeLifestyle = async (email: string) => {
    setAnalyzingEmails((prev) => ({ ...prev, [email]: true }));
    setError("");
    try {
      // Get current user and candidate user IDs
      const currentUser = await supabase.from("users").select("id").eq("email", userEmail).single();
      const candidateUser = await supabase.from("users").select("id").eq("email", email).single();

      if (!currentUser.data?.id || !candidateUser.data?.id) {
        throw new Error("Could not find user IDs for lifestyle analysis.");
      }

      const response = await fetch("/api/lifestyle-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserId: currentUser.data.id,
          candidateUserId: candidateUser.data.id,
        }),
      });

      if (!response.ok) {
        const errDetails = await response.json().catch(() => null);
        throw new Error(errDetails?.error || "Failed to analyze lifestyle compatibility.");
      }

      const data = await response.json();
      setAiResults((prev) => ({
        ...prev,
        [email]: {
          score: data.score || 50,
          summary: data.summary || "Compatibility analysis complete.",
          strengths: data.strengths || [],
          conflicts: data.conflicts || [],
          recommendation: data.recommendation || "Moderate Match",
        },
      }));
    } catch (err: any) {
      console.error("AI Lifestyle Match Analysis error:", err);
      setError(err?.message || "An unexpected error occurred during AI analysis.");
      setAiResults((prev) => ({
        ...prev,
        [email]: {
          score: 50,
          summary: "Compatibility analysis is temporarily unavailable.",
          strengths: ["Unable to analyze"],
          conflicts: ["Try again later"],
          recommendation: "Moderate Match",
        },
      }));
    } finally {
      setAnalyzingEmails((prev) => ({ ...prev, [email]: false }));
    }
  };

  const handleSendRequest = async (receiverEmail: string) => {
    const { error: requestError } = await supabase.from("match_requests").insert({
      sender_email: userEmail,
      receiver_email: receiverEmail,
      status: "pending",
    });

    if (requestError) {
      setError(requestError.message);
    } else {
      setSuccess("Match request sent successfully!");
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  const handleAcceptRequest = async (id: string) => {
    const { error: requestError } = await supabase
      .from("match_requests")
      .update({ status: "accepted" })
      .eq("id", id);

    if (requestError) {
      setError(requestError.message);
    } else {
      setSuccess("Match accepted!");
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  const handleRejectRequest = async (id: string) => {
    const { error: requestError } = await supabase
      .from("match_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    if (requestError) {
      setError(requestError.message);
    } else {
      setSuccess("Match request rejected.");
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  if (status === "loading" || loadingProfile) {
    return <LoadingView message="Loading explore matches..." />;
  }

  if (status === "unauthenticated") {
    return <AuthView onDemoLogin={() => {}} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--brand)] hover:underline">
          ← Back to matches
        </Link>

        <SectionShell
          eyebrow="Explore"
          title="Students from other years"
          description={`These roommates are not in Year ${profile?.year ?? "?"}, but lifestyle compatibility may still make them a good fit.`}
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel-muted)] p-5">
            <p className="text-sm text-[var(--text-secondary)]">
              {processedMatches.length > 0
                ? `${processedMatches.length} cross-year candidate${processedMatches.length === 1 ? "" : "s"} found`
                : "No cross-year matches found yet"}
            </p>
            <button className={primaryButtonClass} onClick={findExploreMatches} disabled={loadingMatches}>
              {loadingMatches ? "Refreshing..." : "Refresh list"}
            </button>
          </div>

          {processedMatches.length > 0 ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {processedMatches.map((match) => (
                <MatchCard
                  key={match.email}
                  match={match}
                  currentUser={profile}
                  onClick={() => setSelectedMatchEmail(match.email)}
                  onSendRequest={handleSendRequest}
                  onAcceptRequest={handleAcceptRequest}
                  onRejectRequest={handleRejectRequest}
                  onAnalyzeLifestyle={handleAnalyzeLifestyle}
                  onMessage={(m) => {
                    window.location.href = `/?chat=${m.email}`;
                  }}
                  aiScore={aiResults[match.email]?.score}
                  aiMatchLevel={aiResults[match.email]?.recommendation}
                  aiSummary={aiResults[match.email]?.summary}
                  aiStrengths={aiResults[match.email]?.strengths}
                  aiConflicts={aiResults[match.email]?.conflicts}
                  isAnalyzing={analyzingEmails[match.email]}
                  isAcademicMatch={false}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-[var(--border-strong)] bg-[var(--panel-muted)] p-8 text-center">
              <p className="text-lg font-medium text-[var(--foreground)]">No cross-year matches right now.</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Try generating your main shortlist first, or check back when more students join.
              </p>
              <Link href="/" className={`mt-5 inline-flex ${secondaryButtonClass}`}>
                Back to same-year matches
              </Link>
            </div>
          )}
        </SectionShell>

        {selectedMatch && (
          <MatchDetailModal
            match={selectedMatch}
            onClose={() => setSelectedMatchEmail(null)}
            onSendRequest={handleSendRequest}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onMessage={(m) => {
              window.location.href = `/?chat=${m.email}`;
            }}
          />
        )}

        <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-3">
          {error ? (
            <div className="min-w-[300px] rounded-[24px] border border-[rgba(255,125,125,0.28)] bg-[rgba(120,25,25,0.85)] px-6 py-4 text-center text-sm font-medium text-[rgb(255,215,215)] shadow-2xl backdrop-blur-md">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="min-w-[300px] rounded-[24px] border border-[rgba(125,255,255,0.28)] bg-[rgba(25,120,25,0.85)] px-6 py-4 text-center text-sm font-medium text-[rgb(215,255,215)] shadow-2xl backdrop-blur-md">
              {success}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
