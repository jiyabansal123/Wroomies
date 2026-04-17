"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

import {
  AuthView,
  LoadingView,
  MatchCard,
  ProgressPill,
  SectionShell,
  StatCard,
  TabButton,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./home-ui";
import {
  COURSE_OPTIONS,
  GENDER_OPTIONS,
  QUESTIONS,
  TabKey,
  YEAR_OPTIONS,
  UserProfile,
  MatchUser,
  calculateMatch,
  getProgressValue,
} from "./home-data";
import { MatchDetailModal } from "./home-ui";

export default function Home() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [year, setYear] = useState("1");
  const [course, setCourse] = useState("btech");
  const [gender, setGender] = useState("male");
  const [roomNumber, setRoomNumber] = useState("");
  const [isOpenToSwitch, setIsOpenToSwitch] = useState(false);
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("matches");
  const [usePreferences, setUsePreferences] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchUser | null>(null);

  const userEmail = session?.user?.email ?? "";
  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const selectedValue = currentQuestion ? answers[currentQuestion.id] : undefined;

  const hasCompleteProfile = useMemo(() => {
    return Boolean(profile?.year && profile?.course && profile?.gender);
  }, [profile]);

  const hasCompleteQuestionnaire = useMemo(() => {
    if (!profile?.preferences) return false;
    return QUESTIONS.every((question) => Boolean(profile.preferences?.[question.id]));
  }, [profile]);

  const profileCompletionPercent = useMemo(() => {
    const completed = [profile?.year, profile?.course, profile?.gender, profile?.room_number]
      .filter(Boolean)
      .length;
    return getProgressValue(completed, 4);
  }, [profile]);

  const preferencesCompletionPercent = useMemo(() => {
    const answered = QUESTIONS.filter((question) => profile?.preferences?.[question.id]).length;
    return getProgressValue(answered, QUESTIONS.length);
  }, [profile]);

  const readinessPercent = useMemo(() => {
    return Math.round(profileCompletionPercent * 0.4 + preferencesCompletionPercent * 0.6);
  }, [profileCompletionPercent, preferencesCompletionPercent]);

  const processedMatches = useMemo(() => {
    return matches.map(m => ({
      ...m,
      totalScore: usePreferences ? m.totalScore : m.primaryScore
    }));
  }, [matches, usePreferences]);

  const totalMatchesFound = processedMatches.length;
  const bestMatch = useMemo(() => {
    if (processedMatches.length === 0) return null;
    return [...processedMatches].sort((a, b) => b.totalScore - a.totalScore)[0];
  }, [processedMatches]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!userEmail) {
        setProfile(null);
        return;
      }

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
        setYear(data?.year ? String(data.year) : "1");
        setCourse(data?.course ?? "btech");
        setGender(data?.gender ?? "male");
        setRoomNumber(data?.room_number ?? "");
        setIsOpenToSwitch(Boolean(data?.is_open_to_switch));
        setAnswers((data?.preferences as Record<string, string>) ?? {});
      } catch (fetchFailure) {
        console.error("Profile load failed:", fetchFailure);
        setError("Unexpected error while loading your profile.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchCurrentUser();
  }, [userEmail]);

  useEffect(() => {
    if (!profile?.preferences) {
      setCurrentQuestionIndex(0);
      return;
    }

    const firstIncompleteIndex = QUESTIONS.findIndex(
      (question) => !profile.preferences?.[question.id],
    );

    if (firstIncompleteIndex >= 0) {
      setCurrentQuestionIndex(firstIncompleteIndex);
    }
  }, [profile]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userEmail) return;

    setSavingProfile(true);
    setError("");

    try {
      const payload = {
        email: userEmail,
        name: session?.user?.name ?? profile?.name ?? "",
        year,
        course,
        gender,
        room_number: roomNumber,
        is_open_to_switch: isOpenToSwitch,
      };

      const { data, error: upsertError } = await supabase
        .from("users")
        .upsert(payload, { onConflict: "email" })
        .select("email, name, year, course, gender, preferences, room_number, is_open_to_switch")
        .single();

      if (upsertError) {
        setError(`Could not save profile: ${upsertError.message}`);
        return;
      }

      setProfile(data);
      setActiveTab(hasCompleteQuestionnaire ? "matches" : "preferences");
    } catch (saveFailure) {
      console.error("Profile save failed:", saveFailure);
      setError("Unexpected error while saving your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const findMatches = async () => {
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

      const sameGender = (data ?? []).filter(
        (u) => u.gender === profile.gender && u.email !== profile.email,
      );

      const scored = sameGender.map((candidate) => {
        const result = calculateMatch(profile, candidate);
        return {
          ...candidate,
          primaryScore: result.primaryScore,
          preferenceScore: result.preferenceScore,
          totalScore: result.totalScore,
          score: result.score,
        };
      });

      setMatches(scored);
    } catch (matchFailure) {
      console.error("Match fetch failed:", matchFailure);
      setError("Unexpected error while finding matches.");
    } finally {
      setLoadingMatches(false);
    }
  };

  const saveQuestionnaire = async () => {
    if (!userEmail) return;

    setSavingAnswers(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({ preferences: answers })
        .eq("email", userEmail);

      if (updateError) {
        setError(`Could not save questionnaire: ${updateError.message}`);
        return;
      }

      setProfile((previous) => (previous ? { ...previous, preferences: answers } : previous));
      setActiveTab("matches");
    } catch (saveFailure) {
      console.error("Questionnaire save failed:", saveFailure);
      setError("Unexpected error while saving your questionnaire.");
    } finally {
      setSavingAnswers(false);
    }
  };

  if (status === "loading") return <LoadingView message="Checking session..." />;
  if (status === "unauthenticated") return <AuthView />;
  if (loadingProfile) return <LoadingView message="Loading your profile..." />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 opacity-95" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_top,rgba(240,96,79,0.26),transparent_60%)]" />
        <div className="absolute left-[-140px] top-24 h-80 w-80 rounded-full bg-[rgba(240,96,79,0.18)] blur-[130px]" />
        <div className="absolute bottom-[-160px] right-[-120px] h-96 w-96 rounded-full bg-[rgba(250,177,72,0.14)] blur-[140px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-[280px] flex-shrink-0 flex-col rounded-[32px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--card-shadow)] lg:flex">
          <div className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(240,96,79,0.16),rgba(255,255,255,0.03))] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Wroomies</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
              Roommate search with more clarity.
            </h1>
          </div>

          <div className="mt-6 space-y-2">
            <TabButton active={activeTab === "matches"} label="Matches" onClick={() => setActiveTab("matches")} />
            <TabButton active={activeTab === "profile"} label="Profile" onClick={() => setActiveTab("profile")} />
            <TabButton active={activeTab === "preferences"} label="Preferences" onClick={() => setActiveTab("preferences")} />
          </div>

          <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--panel-muted)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Ready to match</p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">{readinessPercent}%</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-soft))]" style={{ width: `${readinessPercent}%` }} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <ProgressPill label="Profile" value={profileCompletionPercent} />
              <ProgressPill label="Preferences" value={preferencesCompletionPercent} />
            </div>
          </div>

          <div className="mt-auto rounded-[28px] border border-[var(--border)] bg-[var(--panel-muted)] p-5">
            <p className="text-sm font-medium text-[var(--foreground)]">{session?.user?.name ?? "Student"}</p>
            <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">{userEmail}</p>
            <button className={`mt-5 w-full ${secondaryButtonClass}`} onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(19,22,31,0.92))] p-5 shadow-[var(--card-shadow)] sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Dashboard</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
                  {hasCompleteProfile && hasCompleteQuestionnaire
                    ? "Your shortlist is ready."
                    : "Complete your setup for better matches."}
                </h2>
                <p className="mt-3 max-w-2xl text-xs leading-6 text-[var(--text-secondary)]">
                  Review compatibility based on academic structure and daily lifestyle routines.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                <StatCard label="Readiness" value={`${readinessPercent}%`} hint={readinessPercent === 100 ? "Everything needed for matching is in place." : "A little more setup improves recommendation quality."} />
                <StatCard label="Best score" value={bestMatch ? `${bestMatch.totalScore}%` : "--"} hint={bestMatch ? `${bestMatch.name ?? "Your top match"} is leading right now.` : "Run matching once your setup is ready."} />
                <StatCard label="Candidates" value={String(totalMatchesFound)} hint={totalMatchesFound > 0 ? "Current ranked shortlist." : "No shortlist generated yet."} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 lg:hidden">
              <TabButton active={activeTab === "matches"} label="Matches" onClick={() => setActiveTab("matches")} />
              <TabButton active={activeTab === "profile"} label="Profile" onClick={() => setActiveTab("profile")} />
              <TabButton active={activeTab === "preferences"} label="Preferences" onClick={() => setActiveTab("preferences")} />
            </div>
          </header>

          {activeTab === "profile" ? (
            <SectionShell eyebrow="Profile" title="Room context and basics" description="These details power the first layer of roommate scoring and make match pages more useful.">
              <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Year</span>
                  <select className={fieldClass} value={year} onChange={(event) => setYear(event.target.value)}>
                    {YEAR_OPTIONS.map((option) => <option key={option} value={option}>{`Year ${option}`}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Course</span>
                  <select className={fieldClass} value={course} onChange={(event) => setCourse(event.target.value)}>
                    {COURSE_OPTIONS.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Gender</span>
                  <select className={fieldClass} value={gender} onChange={(event) => setGender(event.target.value)}>
                    {GENDER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Room number</span>
                  <input className={fieldClass} type="text" value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} placeholder="For example C-101" />
                </label>
                <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-3">
                  <input type="checkbox" checked={isOpenToSwitch} onChange={(event) => setIsOpenToSwitch(event.target.checked)} className="mt-1 h-4 w-4 rounded border border-[var(--border)] accent-[var(--brand)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Ready to switch rooms?</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Check this if you are comfortable moving rooms for a better match fit.</p>
                  </div>
                </label>
                <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                  <button className={primaryButtonClass} type="submit" disabled={savingProfile}>{savingProfile ? "Saving profile..." : "Save profile"}</button>
                  <button className={secondaryButtonClass} type="button" onClick={() => setActiveTab("preferences")}>Continue to preferences</button>
                </div>
              </form>
            </SectionShell>
          ) : null}

          {activeTab === "preferences" ? (
            <SectionShell
              eyebrow="Preferences"
              title={hasCompleteQuestionnaire ? "Review your lifestyle answers" : "Build a stronger roommate profile"}
              description={hasCompleteQuestionnaire ? "You can revisit any answer at any time. Saving again will update future recommendations." : "Answer the prompts below so matching reflects daily routines, noise tolerance, cleanliness, and shared-space expectations."}
            >
              {!hasCompleteQuestionnaire && currentQuestion ? (
                <div className="space-y-6">
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                    <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      <span>{`Question ${currentQuestionIndex + 1} of ${QUESTIONS.length}`}</span>
                      <span>{getProgressValue(currentQuestionIndex + 1, QUESTIONS.length)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-soft))]" style={{ width: `${getProgressValue(currentQuestionIndex + 1, QUESTIONS.length)}%` }} />
                    </div>
                  </div>
                  <div className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(240,96,79,0.08),rgba(255,255,255,0.02))] p-5 sm:p-6">
                    <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{currentQuestion.question}</h3>
                    <div className="mt-6 grid gap-3">
                      {currentQuestion.options.map((option) => {
                        const isSelected = selectedValue === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setAnswers((previous) => ({ ...previous, [currentQuestion.id]: option.value }))}
                            className={`rounded-[22px] border px-4 py-4 text-left text-sm leading-6 transition ${isSelected ? "border-[var(--brand)] bg-[rgba(240,96,79,0.16)] text-[var(--foreground)] shadow-[0_18px_50px_rgba(240,96,79,0.14)]" : "border-[var(--border)] bg-[var(--panel-muted)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]"}`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button type="button" className={secondaryButtonClass} onClick={() => setCurrentQuestionIndex((previous) => Math.max(previous - 1, 0))} disabled={currentQuestionIndex === 0 || savingAnswers}>Back</button>
                    {currentQuestionIndex < QUESTIONS.length - 1 ? (
                      <button type="button" className={primaryButtonClass} disabled={!selectedValue || savingAnswers} onClick={() => setCurrentQuestionIndex((previous) => Math.min(previous + 1, QUESTIONS.length - 1))}>Next question</button>
                    ) : (
                      <button type="button" className={primaryButtonClass} disabled={!selectedValue || savingAnswers} onClick={saveQuestionnaire}>{savingAnswers ? "Saving answers..." : "Finish questionnaire"}</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {QUESTIONS.map((question) => {
                    const answerKey = profile?.preferences?.[question.id];
                    const answer = question.options.find((option) => option.value === answerKey);
                    return (
                      <div key={question.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-muted)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Preference</p>
                        <p className="mt-3 text-base font-medium leading-7 text-[var(--foreground)]">{question.question}</p>
                        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{answer?.label ?? "Not answered"}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionShell>
          ) : null}

          {activeTab === "matches" ? (
            <SectionShell
              eyebrow="Matches"
              title={!hasCompleteProfile ? "Finish your profile before matching" : !hasCompleteQuestionnaire ? "Answer your preferences to improve match quality" : "Start exploring your roommate shortlist"}
              description={!hasCompleteProfile ? "Your basics are the first signal in the scoring model. Add them before generating recommendations." : !hasCompleteQuestionnaire ? "The questionnaire adds the lifestyle layer that makes the shortlist much more useful." : "Generate a ranked list of compatible roommates and open any card to compare details."}
            >
              {!hasCompleteProfile ? (
                <EmptyState title="Profile setup is still incomplete." description="Add your year, course, gender, and room details so the dashboard can generate better roommate candidates." actionLabel="Complete profile" onClick={() => setActiveTab("profile")} />
              ) : !hasCompleteQuestionnaire ? (
                <EmptyState title="Preferences are the missing layer." description={`Answer all ${QUESTIONS.length} preference prompts to get stronger compatibility scoring.`} actionLabel="Continue questionnaire" onClick={() => setActiveTab("preferences")} />
              ) : (
                <div className="space-y-12">
                  <div className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] border border-[var(--border)] bg-[var(--panel-muted)] p-6">
                    <div className="flex flex-wrap gap-3">
                      <ProgressPill label="Profile" value={profileCompletionPercent} />
                      <ProgressPill label="Preferences" value={preferencesCompletionPercent} />
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex cursor-pointer items-center gap-3">
                        <div className="relative h-6 w-11 rounded-full bg-[rgba(255,255,255,0.1)] transition duration-200">
                          <input type="checkbox" checked={usePreferences} onChange={(e) => setUsePreferences(e.target.checked)} className="peer sr-only" />
                          <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition duration-200 peer-checked:translate-x-5 peer-checked:bg-[var(--brand)]" />
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">Preferences Mode</span>
                      </label>
                      <button className={primaryButtonClass} onClick={findMatches} disabled={loadingMatches}>
                        {loadingMatches ? "Finding matches..." : "Generate shortlist"}
                      </button>
                    </div>
                  </div>

                  {processedMatches.length > 0 ? (
                    <>
                      {bestMatch && (
                        <div className="mb-8 space-y-5">
                          <div className="flex items-center gap-3">
                            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                              <span className="text-xl">🏆</span> Overall Best Fit
                            </h3>
                            <div className="h-px flex-1 bg-[var(--border)]" />
                          </div>
                          <div className="max-w-2xl mx-auto">
                            <MatchCard 
                              match={bestMatch} 
                              featured={true} 
                              onClick={() => setSelectedMatch(bestMatch)} 
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                            <span className="text-xl">🎯</span> Best Structural Matches
                          </h3>
                          <div className="h-px flex-1 bg-[var(--border)]" />
                        </div>
                        <div className="grid gap-3 xl:grid-cols-2">
                          {[...processedMatches]
                            .sort((a, b) => b.primaryScore - a.primaryScore)
                            .slice(0, 4)
                            .map((match) => (
                              <MatchCard key={match.email} match={match} onClick={() => setSelectedMatch(match)} />
                            ))}
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                            <span className="text-xl">🧠</span> Best Lifestyle Matches
                          </h3>
                          <div className="h-px flex-1 bg-[var(--border)]" />
                        </div>
                        <div className="grid gap-3 xl:grid-cols-2">
                          {[...processedMatches]
                            .sort((a, b) => b.preferenceScore - a.preferenceScore)
                            .slice(0, 4)
                            .map((match) => (
                              <MatchCard key={match.email} match={match} onClick={() => setSelectedMatch(match)} />
                            ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyState title="No shortlist yet." description="Generate your first ranked results to see the best roommate candidates here." />
                  )}
                </div>
              )}
            </SectionShell>
          ) : null}

          {selectedMatch && <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />}

          {error ? (
            <div className="rounded-[24px] border border-[rgba(255,125,125,0.28)] bg-[rgba(120,25,25,0.38)] px-4 py-3 text-sm text-[rgb(255,215,215)]">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onClick,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onClick?: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-[var(--border-strong)] bg-[var(--panel-muted)] p-8 text-center">
      <p className="text-lg font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      {actionLabel && onClick ? (
        <button type="button" className={`mt-5 ${primaryButtonClass}`} onClick={onClick}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
