"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  MatchRequest,
  MatchStatus,
  calculateExploreMatch,
  isSameYear,
  sortPrimaryShortlist,
} from "./home-data";
import { MatchDetailModal, ChatWindow } from "./home-ui";

export default function Home() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const chatEmail = searchParams.get("chat");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [year, setYear] = useState("1");
  const [course, setCourse] = useState("btech");
  const [gender, setGender] = useState("male");
  const [roomNumber, setRoomNumber] = useState("");
  const [isOpenToSwitch, setIsOpenToSwitch] = useState(false);
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [exploreMatches, setExploreMatches] = useState<MatchUser[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAnswers, setSavingAnswers] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("matches");
  const [selectedMatchEmail, setSelectedMatchEmail] = useState<string | null>(null);
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<MatchUser | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [success, setSuccess] = useState("");
  const [chatUsers, setChatUsers] = useState<MatchUser[]>([]);
  const [isRetaking, setIsRetaking] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [aiResults, setAiResults] = useState<Record<string, { compatibilityScore: number; reason: string; strengths?: string[]; potentialConflicts?: string[]; summary?: string }>>({});
  const [analyzingEmails, setAnalyzingEmails] = useState<Record<string, boolean>>({});

  const userEmail = isDemoMode ? "demo@wroomies.com" : (session?.user?.email ?? "");
  const demoUser = { email: "demo@wroomies.com", name: "Demo Student" };
  const effectiveSession = isDemoMode ? { user: demoUser } : session;
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
    return matches.map(m => {
      // Find match status. Prioritize 'accepted' if multiple exist.
      const relevantRequests = matchRequests.filter(
        r => (r.sender_email === userEmail && r.receiver_email === m.email) ||
          (r.receiver_email === userEmail && r.sender_email === m.email)
      );

      const request = relevantRequests.find(r => r.status === "accepted") || relevantRequests[0];

      let matchStatus: MatchStatus = "none";
      if (request) {
        if (request.status === "accepted") matchStatus = "accepted";
        else if (request.status === "rejected") matchStatus = "rejected";
        else if (request.sender_email === userEmail) matchStatus = "pending_sent";
        else matchStatus = "pending_received";
      }

      return {
        ...m,
        totalScore: m.totalScore,
        score: m.totalScore,
        matchStatus,
        requestId: request?.id
      };
    }).sort((a, b) => b.totalScore - a.totalScore || b.primaryScore - a.primaryScore);
  }, [matches, matchRequests, userEmail]);

  const totalMatchesFound = processedMatches.length;
  const bestMatch = useMemo(() => {
    if (processedMatches.length === 0) return null;
    return [...processedMatches].sort((a, b) => b.totalScore - a.totalScore)[0];
  }, [processedMatches]);

  const selectedMatch = useMemo(() => {
    if (!selectedMatchEmail) return null;
    return processedMatches.find(m => m.email === selectedMatchEmail) || null;
  }, [selectedMatchEmail, processedMatches]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!userEmail) {
        setProfile(null);
        return;
      }

      setLoadingProfile(true);
      setError("");

      if (isDemoMode) {
        setProfile({
          email: "demo@wroomies.com",
          name: "Demo Student",
          year: "2",
          course: "btech",
          gender: "male",
          room_number: "C-402",
          is_open_to_switch: true,
          preferences: { cleanliness: "high", noise: "quiet" }
        });
        setYear("2");
        setCourse("btech");
        setGender("male");
        setRoomNumber("C-402");
        setIsOpenToSwitch(true);
        setAnswers({ cleanliness: "high", noise: "quiet" });
        setLoadingProfile(false);
        return;
      }

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
    if (!userEmail) return;

    const fetchMatchRequests = async () => {
      if (isDemoMode) {
        const mockRequests: MatchRequest[] = [
          { id: "demo-req-1", sender_email: "jb@demo.com", receiver_email: userEmail, status: "accepted", created_at: new Date().toISOString() }
        ];
        setMatchRequests(mockRequests);

        // Fetch mock profiles
        const mockJB = {
          email: "jb@demo.com",
          name: "JB - Designer (Demo)",
          year: "3",
          course: "btech",
          gender: "male",
          room_number: "A-101",
          is_open_to_switch: false,
          preferences: { cleanliness: "high", noise: "quiet", sleep: "late" }
        };

        setChatUsers([{
          ...mockJB,
          matchStatus: 'accepted' as MatchStatus,
          requestId: "demo-req-1",
          primaryScore: 100,
          preferenceScore: 90,
          totalScore: 97,
          score: 97
        }]);
        return;
      }

      const { data, error } = await supabase
        .from("match_requests")
        .select("*")
        .or(`sender_email.eq.${userEmail},receiver_email.eq.${userEmail}`);

      if (!error && data) {
        setMatchRequests(data);

        // Fetch profiles for accepted matches
        const acceptedEmails = data
          .filter(r => r.status === 'accepted')
          .map(r => r.sender_email === userEmail ? r.receiver_email : r.sender_email);

        if (acceptedEmails.length > 0) {
          const { data: userData } = await supabase
            .from("users")
            .select("email, name, year, course, gender, preferences, room_number, is_open_to_switch")
            .in("email", acceptedEmails);

          if (userData) {
            const mapped = userData.map(u => {
              const req = data.find(r =>
                (r.sender_email === userEmail && r.receiver_email === u.email) ||
                (r.receiver_email === userEmail && r.sender_email === u.email)
              );
              return {
                ...u,
                matchStatus: 'accepted' as MatchStatus,
                requestId: req?.id
              } as MatchUser;
            });
            setChatUsers(mapped);
          }
        } else {
          setChatUsers([]);
        }
      }
    };

    fetchMatchRequests();

    // Subscribe to match_requests
    const channel = supabase
      .channel("match_requests_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_requests" },
        (payload) => {
          const newRequest = payload.new as MatchRequest;
          if (newRequest.sender_email === userEmail || newRequest.receiver_email === userEmail) {
            setMatchRequests((prev) => [...prev.filter(r => r.id !== newRequest.id), newRequest]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "match_requests" },
        (payload) => {
          const updatedRequest = payload.new as MatchRequest;
          if (updatedRequest.sender_email === userEmail || updatedRequest.receiver_email === userEmail) {
            setMatchRequests((prev) => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "match_requests" },
        (payload) => {
          const deletedRequest = payload.old;
          setMatchRequests((prev) => prev.filter(r => r.id !== deletedRequest.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail]);

  useEffect(() => {
    if (chatEmail && chatUsers.length > 0) {
      const chatUser = chatUsers.find(u => u.email === chatEmail);
      if (chatUser) {
        setSelectedChatUser(chatUser);
        setActiveTab("chat");
      }
    }
  }, [chatEmail, chatUsers]);

  useEffect(() => {
    if (!selectedChatUser || !userEmail) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      if (isDemoMode) {
        setMessages([
          { id: "m1", sender_email: "jb@demo.com", receiver_email: userEmail, content: "Hey! Welcome to the Demo. This is exactly how the real chat looks.", created_at: new Date().toISOString() },
          { id: "m2", sender_email: userEmail, receiver_email: "jb@demo.com", content: "That looks great. Can I take the questionnaire too?", created_at: new Date().toISOString() },
          { id: "m3", sender_email: "jb@demo.com", receiver_email: userEmail, content: "Absolutely! Go to the Preferences tab and answer some questions to see your score update.", created_at: new Date().toISOString() }
        ]);
        setLoadingChat(false);
        return;
      }

      setLoadingChat(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_email.eq.${userEmail},receiver_email.eq.${selectedChatUser.email}),and(sender_email.eq.${selectedChatUser.email},receiver_email.eq.${userEmail})`)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoadingChat(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_${selectedChatUser.email}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
          const isRelevant =
            (newMessage.sender_email === userEmail && newMessage.receiver_email === selectedChatUser.email) ||
            (newMessage.sender_email === selectedChatUser.email && newMessage.receiver_email === userEmail);

          if (isRelevant) {
            setMessages((prev) => {
              // Check if message already exists (to avoid duplicates from optimistic updates)
              if (prev.some(m => m.id === newMessage.id)) return prev;

              // Remove the optimistic placeholder which has a matching content and sender
              const filtered = prev.filter(m =>
                !(m.id.startsWith('temp-') && m.sender_email === newMessage.sender_email && m.content === newMessage.content)
              );

              return [...filtered, newMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatUser, userEmail]);

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
        name: isDemoMode ? "Demo Student" : (session?.user?.name ?? profile?.name ?? ""),
        year,
        course,
        gender,
        room_number: roomNumber,
        is_open_to_switch: isOpenToSwitch,
      };

      if (isDemoMode) {
        setProfile({ ...payload, preferences: answers });
        setSuccess("Demo profile updated locally!");
        setTimeout(() => setSuccess(""), 4000);
        setActiveTab(hasCompleteQuestionnaire ? "matches" : "preferences");
        setSavingProfile(false);
        return;
      }

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
      let allUsers: UserProfile[] = [];

      if (isDemoMode) {
        allUsers = [
          { email: "alex@demo.com", name: "Alex - Demo User", year: "2", course: "btech", gender: "male", room_number: "C-101", is_open_to_switch: true, preferences: { cleanliness: "high", sleep: "early" } },
          { email: "sam@demo.com", name: "Sam - (No Sleep)", year: "2", course: "btech", gender: "male", room_number: "C-102", is_open_to_switch: false, preferences: { cleanliness: "low", sleep: "late" } },
          { email: "jb@demo.com", name: "JB - Designer (Demo)", year: "3", course: "btech", gender: "male", room_number: "A-101", is_open_to_switch: false, preferences: { cleanliness: "high", noise: "quiet" } }
        ];
      } else {
        const { data, error: fetchError } = await supabase
          .from("users")
          .select("email, name, year, course, gender, preferences, room_number, is_open_to_switch");

        if (fetchError) {
          setError(`Could not fetch matches: ${fetchError.message}`);
          return;
        }
        allUsers = data ?? [];
      }

      const sameGender = allUsers.filter(
        (u) => u.gender === profile.gender && u.email !== profile.email,
      );

      const primaryScored: MatchUser[] = [];
      const exploreScored: MatchUser[] = [];

      for (const candidate of sameGender) {
        if (isSameYear(profile, candidate)) {
          const result = calculateMatch(profile, candidate);
          if (result.primaryScore > 0) {
            primaryScored.push({
              ...candidate,
              primaryScore: result.primaryScore,
              preferenceScore: result.preferenceScore,
              totalScore: result.totalScore,
              score: result.score,
              reasons: result.reasons,
            });
          }
        } else {
          const result = calculateExploreMatch(profile, candidate);
          if (result.totalScore > 0) {
            exploreScored.push({
              ...candidate,
              primaryScore: result.primaryScore,
              preferenceScore: result.preferenceScore,
              totalScore: result.totalScore,
              score: result.score,
              reasons: result.reasons,
            });
          }
        }
      }

      setMatches(sortPrimaryShortlist(primaryScored));
      setExploreMatches(exploreScored);
    } catch (matchFailure) {
      console.error("Match fetch failed:", matchFailure);
      setError("Unexpected error while finding matches.");
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleAnalyzeLifestyle = async (email: string) => {
    setAnalyzingEmails((prev) => ({ ...prev, [email]: true }));
    setError("");
    try {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setAiResults((prev) => ({
          ...prev,
          [email]: {
            compatibilityScore: 94,
            reason: "Both prefer quiet evening study sessions and keep their personal areas clean.",
            strengths: ["Similar sleep schedules", "Shared cleanliness standards", "Compatible study habits"],
            potentialConflicts: ["Different guest preferences may need discussion"],
            summary: "Strong lifestyle compatibility with minor areas to discuss before moving in together."
          },
        }));
        return;
      }

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
          compatibilityScore: data.compatibilityScore,
          reason: data.summary,
          strengths: data.strengths,
          potentialConflicts: data.potentialConflicts,
          summary: data.summary,
        },
      }));
    } catch (err: any) {
      console.error("AI Lifestyle Match Analysis error:", err);
      setError(err?.message || "An unexpected error occurred during AI analysis.");
    } finally {
      setAnalyzingEmails((prev) => ({ ...prev, [email]: false }));
    }
  };

  const handleSendRequest = async (receiverEmail: string) => {
    if (isDemoMode) {
      setSuccess("Match request sent (Demo Mode)!");
      setTimeout(() => setSuccess(""), 4000);
      return;
    }
    const { error } = await supabase
      .from("match_requests")
      .insert({
        sender_email: userEmail,
        receiver_email: receiverEmail,
        status: "pending"
      });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Match request sent successfully!");
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  const handleAcceptRequest = async (id: string) => {
    const { error } = await supabase
      .from("match_requests")
      .update({ status: "accepted" })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Match accepted! You can now chat with them.");
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  const handleRejectRequest = async (id: string) => {
    const { error } = await supabase
      .from("match_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Match request rejected.");
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedChatUser) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender_email: userEmail,
      receiver_email: selectedChatUser.email,
      content,
      created_at: new Date().toISOString()
    };

    // Optimistic Update: Show message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    if (isDemoMode) return;

    const { error } = await supabase
      .from("messages")
      .insert({
        sender_email: userEmail,
        receiver_email: selectedChatUser.email,
        content
      });

    if (error) {
      setError("Failed to send message: " + error.message);
      // Rollback on error: remove the optimistic message
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  const saveQuestionnaire = async () => {
    if (!userEmail) return;

    setSavingAnswers(true);
    setError("");

    try {
      if (isDemoMode) {
        setProfile((previous) => (previous ? { ...previous, preferences: answers } : previous));
        setSuccess("Questionnaire saved locally!");
        setTimeout(() => setSuccess(""), 4000);
        setActiveTab("matches");
        setSavingAnswers(false);
        setIsRetaking(false);
        return;
      }

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
      setIsRetaking(false);
    }
  };

  if (status === "loading") return <LoadingView message="Checking session..." />;
  if (status === "unauthenticated" && !isDemoMode) return <AuthView onDemoLogin={() => setIsDemoMode(true)} />;
  if (loadingProfile) return <LoadingView message="Loading your profile..." />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 opacity-95" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_top,rgba(240,96,79,0.26),transparent_60%)]" />
        <div className="absolute left-[-140px] top-24 h-80 w-80 rounded-full bg-[rgba(240,96,79,0.18)] blur-[130px]" />
        <div className="absolute bottom-[-160px] right-[-120px] h-96 w-96 rounded-full bg-[rgba(250,177,72,0.14)] blur-[140px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[280px] flex-shrink-0 flex-col rounded-[32px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--card-shadow)] lg:flex">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1 scrollbar-hide">
            {/* Header */}
            <div className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(240,96,79,0.16),rgba(255,255,255,0.03))] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--brand-soft)]">Wroomies</p>
              <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.04em] text-[var(--foreground)]">
                Roommate search with more clarity.
              </h1>
            </div>

            {/* Nav */}
            <div className="space-y-1.5">
              <TabButton active={activeTab === "matches"} label="Find Matches" onClick={() => setActiveTab("matches")} />
              <TabButton active={activeTab === "profile"} label="Profile" onClick={() => setActiveTab("profile")} />
              <TabButton active={activeTab === "preferences"} label="Preferences" onClick={() => setActiveTab("preferences")} />
              {matchRequests.some(r => r.status === 'accepted') && (
                <TabButton active={activeTab === "chat"} label="Your Matches" onClick={() => setActiveTab("chat")} />
              )}
            </div>

            {/* Readiness Card */}
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel-muted)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Ready to match</p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">{readinessPercent}%</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--brand-soft))]" style={{ width: `${readinessPercent}%` }} />
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="mt-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel-muted)] p-5">
            <div className="flex flex-col gap-1">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{effectiveSession?.user?.name ?? "Student"}</p>
              <p className="truncate text-[11px] text-[var(--text-secondary)] opacity-70">{userEmail}</p>
            </div>
            <button className={`mt-4 w-full ${secondaryButtonClass} py-2.5 text-xs`} onClick={() => isDemoMode ? setIsDemoMode(false) : signOut()}>
              {isDemoMode ? "Exit Demo" : "Sign out"}
            </button>
            <div className="mt-5 pt-4 border-t border-[var(--border)] opacity-30 transition hover:opacity-100">
              <p className="text-center text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-muted)] cursor-default">
                made by JB
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(19,22,31,0.92))] p-5 shadow-[var(--card-shadow)] sm:p-6">
            {activeTab === "matches" && (
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
            )}

            <div className={`${activeTab === "matches" ? "mt-6" : "mt-0"} flex flex-wrap gap-3 lg:hidden`}>
              <TabButton active={activeTab === "matches"} label="Find Matches" onClick={() => setActiveTab("matches")} />
              <TabButton active={activeTab === "profile"} label="Profile" onClick={() => setActiveTab("profile")} />
              <TabButton active={activeTab === "preferences"} label="Preferences" onClick={() => setActiveTab("preferences")} />
              {matchRequests.some(r => r.status === 'accepted') && (
                <TabButton active={activeTab === "chat"} label="Your Matches" onClick={() => setActiveTab("chat")} />
              )}
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
              {(!hasCompleteQuestionnaire || isRetaking) && currentQuestion ? (
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">You've completed the questionnaire. Re-taking it will change your current preferences.</p>
                    <button
                      className={primaryButtonClass}
                      onClick={() => {
                        setIsRetaking(true);
                        setCurrentQuestionIndex(0);
                      }}
                    >
                      Retake Questionnaire
                    </button>
                  </div>
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
                </div>
              )}
            </SectionShell>
          ) : null}

          {activeTab === "matches" ? (
            <SectionShell
              eyebrow="Matchmaking"
              title={!hasCompleteProfile ? "Finish your profile before matching" : "Find Your Perfect Roommate"}
              description={!hasCompleteProfile ? "Your basics are the first signal in the scoring model. Add them before generating recommendations." : !hasCompleteQuestionnaire ? "Generate a top 10 shortlist from same-gender, same-year students first. Preferences can refine it whenever you want." : "Generate a ranked list of compatible roommates and open any card to compare details."}
            >
              {!hasCompleteProfile ? (
                <EmptyState title="Profile setup is still incomplete." description="Add your year, course, gender, and room details so the dashboard can generate better roommate candidates." actionLabel="Complete profile" onClick={() => setActiveTab("profile")} />
              ) : (
                <div className="space-y-12">
                  <div className="flex items-center gap-6">
                    {!hasCompleteQuestionnaire ? (
                      <button type="button" className={secondaryButtonClass} onClick={() => setActiveTab("preferences")}>
                        Add questionnaire
                      </button>
                    ) : null}
                    <button className={primaryButtonClass} onClick={findMatches} disabled={loadingMatches}>
                      {loadingMatches ? "Finding matches..." : "Search"}
                    </button>
                  </div>

                  {processedMatches.length > 0 ? (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold tracking-tight">Top 10 Matches</h3>
                        <div className="h-px flex-1 bg-[var(--border)]" />
                      </div>
                      <div className="grid gap-3 xl:grid-cols-2">
                        {processedMatches.map((match, index) => (
                          <MatchCard
                            key={match.email}
                            match={match}
                            featured={index === 0}
                            currentUser={profile}
                            onClick={() => setSelectedMatchEmail(match.email)}
                            onSendRequest={handleSendRequest}
                            onAcceptRequest={handleAcceptRequest}
                            onRejectRequest={handleRejectRequest}
                            onAnalyzeLifestyle={handleAnalyzeLifestyle}
                            aiScore={aiResults[match.email]?.compatibilityScore}
                            aiReason={aiResults[match.email]?.reason}
                            aiStrengths={aiResults[match.email]?.strengths}
                            aiPotentialConflicts={aiResults[match.email]?.potentialConflicts}
                            isAnalyzing={analyzingEmails[match.email]}
                            onMessage={(m) => {
                              setSelectedChatUser(m);
                              setActiveTab("chat");
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState title="No shortlist yet." description="Generate your first ranked results to see the best roommate candidates here." />
                  )}

                  <div className="flex flex-col items-center gap-4 rounded-[32px] border border-dashed border-[var(--border-strong)] bg-[var(--panel-muted)] p-8 text-center">
                    <div>
                      <p className="text-lg font-semibold text-[var(--foreground)]">
                        Looking beyond your year?
                      </p>
                      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                        {exploreMatches.length > 0
                          ? `${exploreMatches.length} student${exploreMatches.length === 1 ? "" : "s"} from other years share compatible lifestyles with you.`
                          : "Browse students from other academic years who may still be a lifestyle fit."}
                      </p>
                    </div>
                    <Link href="/explore" className={secondaryButtonClass}>
                      Explore more...
                    </Link>
                  </div>
                </div>
              )}
            </SectionShell>
          ) : null}

          {activeTab === "chat" ? (
            <SectionShell eyebrow="Conversations" title="Your Matches & Chat" description="Manage your accepted matches and coordinate your room setup.">
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Accepted Matches</p>
                  {chatUsers.map(m => (
                    <button
                      key={m.email}
                      onClick={() => setSelectedChatUser(m)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition ${selectedChatUser?.email === m.email
                          ? "border-[var(--brand)] bg-[rgba(240,96,79,0.08)]"
                          : "border-[var(--border)] bg-[var(--panel-muted)] hover:border-[var(--border-strong)]"
                        }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-[var(--brand)] flex items-center justify-center text-[var(--text-on-brand)] font-bold">
                        {m.name?.[0] || "?"}
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="font-medium text-sm truncate">{m.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Year {m.year} • {m.course}</p>
                      </div>
                    </button>
                  ))}
                  {chatUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-[var(--border)] rounded-3xl bg-[var(--panel-muted)]">
                      <p className="text-sm text-[var(--text-muted)]">No matches accepted yet.</p>
                      <button
                        className={`mt-4 ${secondaryButtonClass} text-xs`}
                        onClick={() => setActiveTab("matches")}
                      >
                        Explore Matches
                      </button>
                    </div>
                  )}
                </div>
                <div className="lg:col-span-8">
                  {selectedChatUser ? (
                    <ChatWindow
                      match={selectedChatUser}
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      currentUserEmail={userEmail}
                    />
                  ) : (
                    <div className="flex h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--panel-muted)] text-center p-6">
                      <div className="mb-4 h-12 w-12 rounded-full border border-[var(--border)] bg-[var(--panel)] flex items-center justify-center text-xl">💬</div>
                      <p className="text-sm font-medium text-[var(--foreground)]">Select a match to start chatting</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">Only mutual matches can message each other.</p>
                    </div>
                  )}
                </div>
              </div>
            </SectionShell>
          ) : null}

          {selectedMatch && (
            <MatchDetailModal
              match={selectedMatch}
              onClose={() => setSelectedMatchEmail(null)}
              onSendRequest={handleSendRequest}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequest={handleRejectRequest}
              onMessage={(m) => {
                setSelectedChatUser(m);
                setActiveTab("chat");
              }}
            />
          )}

          <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-3">
            {error ? (
              <div className="min-w-[300px] rounded-[24px] border border-[rgba(255,125,125,0.28)] bg-[rgba(120,25,25,0.85)] px-6 py-4 text-center text-sm font-medium text-[rgb(255,215,215)] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="min-w-[300px] rounded-[24px] border border-[rgba(125,255,255,0.28)] bg-[rgba(25,120,25,0.85)] px-6 py-4 text-center text-sm font-medium text-[rgb(215,255,215)] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
                {success}
              </div>
            ) : null}
          </div>
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
