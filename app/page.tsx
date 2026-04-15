"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  email: string;
  name: string | null;
  year: string | null;
  course: string | null;
  gender: string | null;
  preferences: Record<string, string> | null;
};

type MatchUser = UserProfile & {
  score: number;
};

const YEAR_OPTIONS = ["1", "2", "3", "4", "5"];
const COURSE_OPTIONS = ["btech", "bca", "mba", "mtech", "bba", "law", "other"];
const GENDER_OPTIONS = ["male", "female"];
const questions = [
  {
    id: "birthday",
    question: "Do you enjoy celebrating your own or others' birthdays?",
    options: [
      { label: "I love planning and celebrating, it's a big deal for me 🎉", value: "love" },
      { label: "I enjoy it when it's with close friends, not too big", value: "friends" },
      { label: "I'll happily join but don't usually take initiative", value: "passive" },
      { label: "I'm not really into celebrations", value: "no" },
    ],
  },
  {
    id: "calls",
    question: "How do you feel about your roommate taking calls in the room?",
    options: [
      { label: "Totally fine, it doesn't bother me at all", value: "yes" },
      { label: "Fine as long as it's not loud or too frequent", value: "low_noise" },
      { label: "I'd prefer calls to be limited inside the room", value: "limited" },
      { label: "I'm not comfortable with calls in the room", value: "no" },
    ],
  },
  {
    id: "sharing",
    question: "What's your approach to sharing personal or daily-use items?",
    options: [
      { label: "I'm very open to sharing most things", value: "free" },
      { label: "I share, but I expect mutual respect and balance", value: "conditional" },
      { label: "I only share basic/common items", value: "limited" },
      { label: "I prefer keeping my things personal", value: "no" },
    ],
  },
  {
    id: "study",
    question: "Where and how do you usually study?",
    options: [
      { label: "Mostly outside (library, study areas, etc.)", value: "outside" },
      { label: "In the room during the day", value: "day" },
      { label: "In the room, often late at night", value: "night" },
      { label: "My study routine is pretty unpredictable", value: "random" },
    ],
  },
  {
    id: "sleep",
    question: "What does your typical sleep routine look like?",
    options: [
      { label: "I sleep early and wake up early", value: "early" },
      { label: "I follow a fairly balanced schedule", value: "moderate" },
      { label: "I tend to stay up late (night owl)", value: "late" },
      { label: "My sleep schedule is very irregular", value: "random" },
    ],
  },
  {
    id: "cleanliness",
    question: "How important is cleanliness and organization to you?",
    options: [
      { label: "Very important, I like things neat and organized", value: "high" },
      { label: "I keep things reasonably clean", value: "medium" },
      { label: "I'm okay with a little mess", value: "low" },
      { label: "Cleanliness isn't a big concern for me", value: "messy" },
    ],
  },
  {
    id: "friends",
    question: "How often do you have friends over in your room?",
    options: [
      { label: "Very frequently, I enjoy having people over", value: "daily" },
      { label: "A few times a week", value: "weekly" },
      { label: "Occasionally, not too often", value: "rare" },
      { label: "Rarely or almost never", value: "never" },
    ],
  },
  {
    id: "studyTogether",
    question: "Do you prefer studying alone or with someone?",
    options: [
      { label: "I strongly prefer studying alone", value: "alone" },
      { label: "Mostly alone, but okay occasionally together", value: "mostly_alone" },
      { label: "I like a mix of both", value: "mixed" },
      { label: "I prefer studying with someone", value: "together" },
    ],
  },
  {
    id: "noise",
    question: "What kind of environment do you prefer in your room?",
    options: [
      { label: "I enjoy having music or background noise", value: "music" },
      { label: "Music occasionally is fine", value: "occasional" },
      { label: "I prefer a quiet environment", value: "quiet" },
      { label: "I need complete silence to focus", value: "silent" },
    ],
  },
  {
    id: "personality",
    question: "How would you describe your personality?",
    options: [
      { label: "More introverted, I enjoy my personal space", value: "introvert" },
      { label: "A mix of both depending on the situation", value: "ambivert" },
      { label: "More extroverted, I like social interaction", value: "extrovert" },
      { label: "It really depends on the environment", value: "mixed" },
    ],
  },
  {
    id: "responsibility",
    question: "How do you usually handle shared responsibilities?",
    options: [
      { label: "I take initiative and handle things proactively", value: "proactive" },
      { label: "I do my part when needed", value: "normal" },
      { label: "I usually help when reminded", value: "passive" },
      { label: "I prefer minimal involvement", value: "low" },
    ],
  },
  {
    id: "decor",
    question: "How do you feel about decorating or setting up your room?",
    options: [
      { label: "I love decorating and personalizing my space", value: "high" },
      { label: "I like keeping things simple but nice", value: "medium" },
      { label: "It's not very important to me", value: "low" },
      { label: "I prefer a minimal/no-decor setup", value: "minimal" },
    ],
  },
  {
    id: "guests",
    question: "How comfortable are you with guests staying in the room?",
    options: [
      { label: "Completely fine, no issues", value: "yes" },
      { label: "Fine occasionally", value: "sometimes" },
      { label: "Only if I'm informed beforehand", value: "notice" },
      { label: "Not comfortable with it", value: "no" },
    ],
  },
  {
    id: "conflict",
    question: "How do you usually deal with conflicts or disagreements?",
    options: [
      { label: "I prefer addressing things directly and early", value: "direct" },
      { label: "I stay calm and talk it out later", value: "calm" },
      { label: "I tend to avoid confrontation", value: "avoid" },
      { label: "I usually ignore unless it becomes serious", value: "ignore" },
    ],
  },
] as const;

const courseGroup = (course: string) => {
  if (course === "btech" || course === "bca") return "tech";
  return "other";
};

const PRIMARY_WEIGHT = 0.6;
const PREFERENCES_WEIGHT = 0.4;

const calculatePreferenceSimilarity = (
  preferencesA: Record<string, string> | null,
  preferencesB: Record<string, string> | null,
) => {
  if (!preferencesA || !preferencesB) return 0;

  const keys = questions.map((question) => question.id);
  let matched = 0;
  let compared = 0;

  for (const key of keys) {
    const valueA = preferencesA[key];
    const valueB = preferencesB[key];

    if (!valueA || !valueB) continue;
    compared += 1;
    if (valueA === valueB) matched += 1;
  }

  if (compared === 0) return 0;
  return (matched / compared) * 100;
};

const calculateMatch = (userA: UserProfile, userB: UserProfile) => {
  let primaryScore = 0;

  if (userA.gender !== userB.gender) return 0;

  if (userA.year === userB.year) primaryScore += 50;

  if (courseGroup(userA.course ?? "") === courseGroup(userB.course ?? "")) {
    primaryScore += 30;
  }

  const primaryNormalized = (primaryScore / 80) * 100;
  const preferencesScore = calculatePreferenceSimilarity(
    userA.preferences,
    userB.preferences,
  );

  const weightedScore =
    primaryNormalized * PRIMARY_WEIGHT + preferencesScore * PREFERENCES_WEIGHT;

  return Math.round(weightedScore);
};

const buttonClass =
  "rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition duration-300 hover:scale-[1.02] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-purple-300/70 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100";

const selectClass =
  "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-sm transition duration-200 focus:border-purple-300/80 focus:ring-2 focus:ring-purple-300/40";

export default function Home() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [year, setYear] = useState("1");
  const [course, setCourse] = useState("btech");
  const [gender, setGender] = useState("male");
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState("");

  const userEmail = session?.user?.email ?? "";

  const hasCompleteProfile = useMemo(() => {
    if (!profile) return false;
    return Boolean(profile.year && profile.course && profile.gender);
  }, [profile]);
  const hasCompleteQuestionnaire = useMemo(() => {
    if (!profile?.preferences) return false;
    return questions.every((question) => Boolean(profile.preferences?.[question.id]));
  }, [profile]);
  const currentQuestion = questions[currentQuestionIndex];
  const selectedValue = answers[currentQuestion?.id];
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

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
          .select("email, name, year, course, gender, preferences")
          .eq("email", userEmail)
          .single();

        if (fetchError) {
          setError(`Could not load profile: ${fetchError.message}`);
          return;
        }

        setProfile(data);
        if (data?.year) setYear(String(data.year));
        if (data?.course) setCourse(data.course);
        if (data?.gender) setGender(data.gender);
        setAnswers((data?.preferences as Record<string, string>) ?? {});
      } catch (err) {
        setError("Unexpected error while loading profile.");
        console.error("Profile load failed:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchCurrentUser();
  }, [userEmail]);

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
      };

      const { data, error: upsertError } = await supabase
        .from("users")
        .upsert(payload)
        .select("email, name, year, course, gender, preferences")
        .single();

      if (upsertError) {
        setError(`Could not save profile: ${upsertError.message}`);
        return;
      }

      setProfile(data);
    } catch (err) {
      setError("Unexpected error while saving profile.");
      console.error("Profile save failed:", err);
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
        .select("email, name, year, course, gender, preferences")
        .neq("email", profile.email);

      if (fetchError) {
        setError(`Could not fetch matches: ${fetchError.message}`);
        return;
      }

      const ranked = (data ?? [])
        .map((candidate) => ({
          ...candidate,
          score: calculateMatch(profile, candidate),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      setMatches(ranked);
    } catch (err) {
      setError("Unexpected error while finding matches.");
      console.error("Match fetch failed:", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const selectAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
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

      setProfile((prev) => (prev ? { ...prev, preferences: answers } : prev));
    } catch (err) {
      setError("Unexpected error while saving questionnaire.");
      console.error("Questionnaire save failed:", err);
    } finally {
      setSavingAnswers(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#10001f] to-black p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
          <p className="text-lg font-medium">Checking session...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#10001f] to-black p-4 text-white">
        <section className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 animate-in fade-in zoom-in-95 duration-300">
          <h1 className="text-2xl font-semibold tracking-tight">Wroomies</h1>
          <p className="mt-2 text-sm text-white/70">
            Sign in with your Bennett email to complete your profile and find
            matching roommates.
          </p>
          <button className={`mt-6 w-full ${buttonClass}`} onClick={() => signIn("azure-ad")}>
            Login with Bennett Email
          </button>
        </section>
      </main>
    );
  }

  if (loadingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#10001f] to-black p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
          <p className="text-lg font-medium">Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0033] via-[#10001f] to-black p-4 text-white sm:p-6">
      <section className="w-full max-w-2xl rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-6 flex flex-col gap-3 border-b border-white/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Wroomies</h1>
            <p className="mt-1 text-sm text-white/70">
              Signed in as {session?.user?.email ?? "Unknown user"}
            </p>
          </div>
          <button className={buttonClass} onClick={() => signOut()}>
            Sign out
          </button>
        </div>

        {!hasCompleteProfile ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Complete Your Profile</h2>
              <p className="mt-1 text-sm text-white/70">
                Fill these details to generate better roommate matches.
              </p>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-white/85" htmlFor="year">
                  Year
                </label>
                <select
                  id="year"
                  className={selectClass}
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                >
                  {YEAR_OPTIONS.map((option) => (
                    <option key={option} value={option} className="bg-[#140024] text-white">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-white/85" htmlFor="course">
                  Course
                </label>
                <select
                  id="course"
                  className={selectClass}
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                >
                  {COURSE_OPTIONS.map((option) => (
                    <option key={option} value={option} className="bg-[#140024] text-white">
                      {option.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-white/85" htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  className={selectClass}
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option} value={option} className="bg-[#140024] text-white">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <button className={`w-full ${buttonClass}`} type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>
        ) : !hasCompleteQuestionnaire ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Roommate Preferences</h2>
              <p className="mt-1 text-sm text-white/70">
                Answer all questions to improve your match quality.
              </p>
            </div>

            <div className="h-2 w-full rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-white/60">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>

            <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4 transition duration-300">
              <h3 className="text-base font-medium">{currentQuestion.question}</h3>
              <div className="space-y-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedValue === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectAnswer(currentQuestion.id, option.value)}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition duration-200 ${
                        isSelected
                          ? "border-purple-300/80 bg-purple-500/25 text-white"
                          : "border-white/20 bg-white/10 text-white/85 hover:bg-white/15"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-white transition duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentQuestionIndex === 0 || savingAnswers}
              >
                Back
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className={buttonClass}
                  disabled={!selectedValue || savingAnswers}
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min(prev + 1, questions.length - 1),
                    )
                  }
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className={buttonClass}
                  disabled={!selectedValue || savingAnswers}
                  onClick={saveQuestionnaire}
                >
                  {savingAnswers ? "Saving..." : "Finish"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Welcome, {profile?.name ?? "Student"}!</h2>
              <p className="text-sm text-white/70">
                Profile ready. Find your best roommate matches now.
              </p>
            </div>
            <button className={buttonClass} onClick={findMatches} disabled={loadingMatches}>
              {loadingMatches ? "Finding..." : "Find Matches"}
            </button>

            {matches.length > 0 ? (
              <div className="grid gap-3 pt-1">
                {matches.map((match) => (
                  <article
                    key={match.email}
                    className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-md backdrop-blur-sm transition duration-200 hover:bg-white/15"
                  >
                    <p className="text-base font-semibold">{match.name ?? "Unknown"}</p>
                    <p className="text-sm text-white/70">{match.email}</p>
                    <p className="mt-2 inline-block rounded-lg border border-purple-300/40 bg-purple-500/20 px-2.5 py-1 text-sm font-medium text-purple-100">
                      Match Score: {match.score}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/25 bg-white/5 p-4 text-sm text-white/70">
                No matches yet. Click "Find Matches" to generate your top results.
              </div>
            )}
          </div>
        )}

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}