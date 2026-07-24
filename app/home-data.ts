export type UserProfile = {
  email: string;
  name: string | null;
  year: string | null;
  course: string | null;
  gender: string | null;
  room_number: string | null;
  is_open_to_switch: boolean | null;
  preferences: Record<string, string> | null;
};

export type MatchStatus = "none" | "pending_sent" | "pending_received" | "accepted" | "rejected";

export type MatchRequest = {
  id: string;
  sender_email: string;
  receiver_email: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export type MatchUser = UserProfile & {
  primaryScore: number;
  preferenceScore: number;
  totalScore: number;
  score: number;
  reasons?: string[];
  matchStatus?: MatchStatus;
  requestId?: string;
};

export type TabKey = "matches" | "profile" | "preferences" | "chat";

export const YEAR_OPTIONS = ["1", "2", "3", "4", "5"];
export const COURSE_OPTIONS = ["btech", "bca", "mba", "mtech", "bba", "law", "liberal arts", "other"];
export const GENDER_OPTIONS = ["male", "female"];

export const QUESTIONS = [
  {
    id: "birthday",
    question: "Do you enjoy celebrating your own or others' birthdays?",
    options: [
      { label: "I love planning and celebrating, it matters to me.", value: "love" },
      { label: "I enjoy it with close friends, but not too big.", value: "friends" },
      { label: "I am happy to join, but I rarely initiate.", value: "passive" },
      { label: "I am not really into celebrations.", value: "no" },
    ],
  },
  {
    id: "calls",
    question: "How do you feel about your roommate taking calls in the room?",
    options: [
      { label: "Totally fine, it does not bother me.", value: "yes" },
      { label: "Fine if they are not loud or too frequent.", value: "low_noise" },
      { label: "I would prefer calls to be limited inside the room.", value: "limited" },
      { label: "I am not comfortable with calls in the room.", value: "no" },
    ],
  },
  {
    id: "sharing",
    question: "What is your approach to sharing personal or daily-use items?",
    options: [
      { label: "I am very open to sharing most things.", value: "free" },
      { label: "I share, but I expect mutual respect and balance.", value: "conditional" },
      { label: "I only share basic or common items.", value: "limited" },
      { label: "I prefer keeping my things personal.", value: "no" },
    ],
  },
  {
    id: "study",
    question: "Where and how do you usually study?",
    options: [
      { label: "Mostly outside in study spaces or the library.", value: "outside" },
      { label: "In the room during the day.", value: "day" },
      { label: "In the room, often late at night.", value: "night" },
      { label: "My study routine is pretty unpredictable.", value: "random" },
    ],
  },
  {
    id: "sleep",
    question: "What does your typical sleep routine look like?",
    options: [
      { label: "I sleep early and wake up early.", value: "early" },
      { label: "I follow a fairly balanced schedule.", value: "moderate" },
      { label: "I tend to stay up late.", value: "late" },
      { label: "My sleep schedule is very irregular.", value: "random" },
    ],
  },
  {
    id: "cleanliness",
    question: "How important is cleanliness and organization to you?",
    options: [
      { label: "Very important, I like things neat and organized.", value: "high" },
      { label: "I keep things reasonably clean.", value: "medium" },
      { label: "I am okay with a little mess.", value: "low" },
      { label: "Cleanliness is not a big concern for me.", value: "messy" },
    ],
  },
  {
    id: "friends",
    question: "How often do you have friends over in your room?",
    options: [
      { label: "Very frequently, I enjoy having people over.", value: "daily" },
      { label: "A few times a week.", value: "weekly" },
      { label: "Occasionally, not too often.", value: "rare" },
      { label: "Rarely or almost never.", value: "never" },
    ],
  },
  {
    id: "studyTogether",
    question: "Do you prefer studying alone or with someone?",
    options: [
      { label: "I strongly prefer studying alone.", value: "alone" },
      { label: "Mostly alone, but together sometimes is fine.", value: "mostly_alone" },
      { label: "I like a mix of both.", value: "mixed" },
      { label: "I prefer studying with someone.", value: "together" },
    ],
  },
  {
    id: "noise",
    question: "What kind of environment do you prefer in your room?",
    options: [
      { label: "I enjoy music or background noise.", value: "music" },
      { label: "Music occasionally is fine.", value: "occasional" },
      { label: "I prefer a quiet environment.", value: "quiet" },
      { label: "I need complete silence to focus.", value: "silent" },
    ],
  },
  {
    id: "personality",
    question: "How would you describe your personality?",
    options: [
      { label: "More introverted, I enjoy my personal space.", value: "introvert" },
      { label: "A mix of both depending on the situation.", value: "ambivert" },
      { label: "More extroverted, I like social interaction.", value: "extrovert" },
      { label: "It really depends on the environment.", value: "mixed" },
    ],
  },
  {
    id: "responsibility",
    question: "How do you usually handle shared responsibilities?",
    options: [
      { label: "I take initiative and handle things proactively.", value: "proactive" },
      { label: "I do my part when needed.", value: "normal" },
      { label: "I usually help when reminded.", value: "passive" },
      { label: "I prefer minimal involvement.", value: "low" },
    ],
  },
  {
    id: "decor",
    question: "How do you feel about decorating or setting up your room?",
    options: [
      { label: "I love decorating and personalizing my space.", value: "high" },
      { label: "I like keeping things simple but nice.", value: "medium" },
      { label: "It is not very important to me.", value: "low" },
      { label: "I prefer a minimal or no-decor setup.", value: "minimal" },
    ],
  },
  {
    id: "guests",
    question: "How comfortable are you with guests staying in the room?",
    options: [
      { label: "Completely fine, no issues.", value: "yes" },
      { label: "Fine occasionally.", value: "sometimes" },
      { label: "Only if I am informed beforehand.", value: "notice" },
      { label: "I am not comfortable with it.", value: "no" },
    ],
  },
  {
    id: "conflict",
    question: "How do you usually deal with conflicts or disagreements?",
    options: [
      { label: "I prefer addressing things directly and early.", value: "direct" },
      { label: "I stay calm and talk it out later.", value: "calm" },
      { label: "I tend to avoid confrontation.", value: "avoid" },
      { label: "I usually ignore it unless it becomes serious.", value: "ignore" },
    ],
  },
] as const;

const PRIMARY_WEIGHT = 0.6;
const PREFERENCES_WEIGHT = 0.4;
const PRIMARY_ONLY_LIMIT = 10;

export function courseGroup(course: string) {
  return course === "btech" || course === "bca" ? "tech" : "other";
}

export function formatCourse(course: string | null) {
  return course ? course.toUpperCase() : "Not set";
}

export function getProgressValue(current: number, total: number) {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

const QUESTION_WEIGHTS: Record<string, number> = {
  cleanliness: 2.0,
  noise: 2.0,
  sleep: 2.0,
  guests: 2.0,
  calls: 1.0,
  sharing: 1.0,
  study: 1.0,
  friends: 1.0,
  conflict: 1.0,
  responsibility: 1.0,
  birthday: 0.5,
  personality: 0.5,
  studyTogether: 0.5,
  decor: 0.5,
};

const CONFLICT_MAP: Record<string, [string, string][]> = {
  cleanliness: [["high", "messy"], ["high", "low"]],
  noise: [["music", "silent"], ["music", "quiet"]],
  sleep: [["early", "late"], ["early", "random"]],
  guests: [["yes", "no"]],
  sharing: [["free", "no"]],
  responsibility: [["proactive", "low"]],
};

const SIMILAR_MAP: Record<string, Record<string, string[]>> = {
  birthday: {
    love: ["friends"],
    friends: ["love", "passive"],
    passive: ["friends", "no"],
    no: ["passive"],
  },
  calls: {
    yes: ["low_noise"],
    low_noise: ["yes", "limited"],
    limited: ["low_noise", "no"],
    no: ["limited"],
  },
  sharing: {
    free: ["conditional"],
    conditional: ["free", "limited"],
    limited: ["conditional", "no"],
    no: ["limited"],
  },
  study: {
    outside: ["day", "random"],
    day: ["outside", "random"],
    night: ["random"],
    random: ["outside", "day", "night"],
  },
  sleep: {
    early: ["moderate"],
    moderate: ["early", "late"],
    late: ["moderate"],
  },
  cleanliness: {
    high: ["medium"],
    medium: ["high", "low"],
    low: ["medium", "messy"],
    messy: ["low"],
  },
  friends: {
    daily: ["weekly"],
    weekly: ["daily", "rare"],
    rare: ["weekly", "never"],
    never: ["rare"],
  },
  studyTogether: {
    alone: ["mostly_alone"],
    mostly_alone: ["alone", "mixed"],
    mixed: ["mostly_alone", "together"],
    together: ["mixed"],
  },
  noise: {
    music: ["occasional"],
    occasional: ["music", "quiet"],
    quiet: ["occasional", "silent"],
    silent: ["quiet"],
  },
  personality: {
    introvert: ["ambivert"],
    ambivert: ["introvert", "extrovert"],
    extrovert: ["ambivert"],
    mixed: ["introvert", "ambivert", "extrovert"],
  },
  responsibility: {
    proactive: ["normal"],
    normal: ["proactive", "passive"],
    passive: ["normal", "low"],
    low: ["passive"],
  },
  decor: {
    high: ["medium"],
    medium: ["high", "low"],
    low: ["medium", "minimal"],
    minimal: ["low"],
  },
  guests: {
    yes: ["sometimes"],
    sometimes: ["yes", "notice"],
    notice: ["sometimes", "no"],
    no: ["notice"],
  },
  conflict: {
    direct: ["calm"],
    calm: ["direct", "avoid"],
    avoid: ["calm", "ignore"],
    ignore: ["avoid"],
  },
};

function getAcademicYearScore(yearA: string | null, yearB: string | null) {
  if (!yearA || !yearB) return 0;
  const yA = parseInt(yearA);
  const yB = parseInt(yearB);
  if (isNaN(yA) || isNaN(yB)) return 0;

  return yA === yB ? 100 : 0;
}

function getAcademicCourseScore(courseA: string | null, courseB: string | null) {
  if (!courseA || !courseB) return 80;
  if (courseA.toLowerCase().trim() === courseB.toLowerCase().trim()) return 100;
  return 80;
}

export function calculatePreferenceSimilarity(
  preferencesA: Record<string, string> | null,
  preferencesB: Record<string, string> | null,
) {
  if (!preferencesA || !preferencesB) return 0;

  let totalPossibleWeight = 0;
  let weightedPoints = 0;

  for (const question of QUESTIONS) {
    const valueA = preferencesA[question.id];
    const valueB = preferencesB[question.id];

    if (!valueA || !valueB) continue;

    const weight = QUESTION_WEIGHTS[question.id] ?? 1.0;
    totalPossibleWeight += weight;

    // 1. Check for Exact Match (100% of weight)
    if (valueA === valueB) {
      weightedPoints += weight;
      continue;
    }

    // 2. Check for Conflicts (-50% of weight penalty)
    const conflicts = CONFLICT_MAP[question.id] || [];
    const isConflict = conflicts.some(
      ([c1, c2]) => (valueA === c1 && valueB === c2) || (valueA === c2 && valueB === c1),
    );

    if (isConflict) {
      weightedPoints -= weight * 0.5;
      continue;
    }

    // 3. Check for Similarity (60% of weight)
    const similarToA = SIMILAR_MAP[question.id]?.[valueA] || [];
    const similarToB = SIMILAR_MAP[question.id]?.[valueB] || [];

    if (similarToA.includes(valueB) || similarToB.includes(valueA)) {
      weightedPoints += weight * 0.6;
    }
    // Else: 0 points for this question
  }

  if (totalPossibleWeight === 0) return 0;
  
  // Clamp to 0-100 range
  const score = (weightedPoints / totalPossibleWeight) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function hasComparablePreferences(
  preferencesA: Record<string, string> | null,
  preferencesB: Record<string, string> | null,
) {
  if (!preferencesA || !preferencesB) return false;

  return QUESTIONS.some((question) => Boolean(preferencesA[question.id] && preferencesB[question.id]));
}

export function sortPrimaryShortlist(matches: MatchUser[]) {
  return [...matches]
    .sort((a, b) => {
      if (b.primaryScore !== a.primaryScore) return b.primaryScore - a.primaryScore;
      if (b.preferenceScore !== a.preferenceScore) return b.preferenceScore - a.preferenceScore;
      return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    })
    .slice(0, PRIMARY_ONLY_LIMIT);
}

export function isSameYear(userA: UserProfile, userB: UserProfile) {
  if (!userA.year || !userB.year) return false;
  return String(userA.year) === String(userB.year);
}

function getExploreYearProximityScore(yearA: string | null, yearB: string | null) {
  if (!yearA || !yearB) return 0;
  const yA = parseInt(yearA);
  const yB = parseInt(yearB);
  if (isNaN(yA) || isNaN(yB)) return 0;

  const diff = Math.abs(yA - yB);
  if (diff === 1) return 70;
  if (diff === 2) return 50;
  return 30;
}

function collectLifestyleReasons(
  userA: UserProfile,
  userB: UserProfile,
  reasons: string[],
) {
  if (!userA.preferences || !userB.preferences) return;

  if (userA.preferences.cleanliness === userB.preferences.cleanliness) {
    reasons.push("Similar cleanliness standards");
  }
  if (userA.preferences.sleep === userB.preferences.sleep) {
    reasons.push("Compatible sleep schedules");
  }
  if (userA.preferences.noise === userB.preferences.noise) {
    reasons.push("Same noise level preference");
  }
  if (userA.preferences.guests === userB.preferences.guests) {
    reasons.push("Aligned on guest expectations");
  }
}

export function calculateExploreMatch(userA: UserProfile, userB: UserProfile) {
  if (userA.gender !== userB.gender) {
    return { primaryScore: 0, preferenceScore: 0, totalScore: 0, score: 0, reasons: [] };
  }

  if (isSameYear(userA, userB)) {
    return { primaryScore: 0, preferenceScore: 0, totalScore: 0, score: 0, reasons: [] };
  }

  const yrA = parseInt(userA.year || "0");
  const yrB = parseInt(userB.year || "0");
  const yearDiff = Math.abs(yrA - yrB);
  const reasons: string[] = [];

  if (yearDiff === 1) reasons.push("One year apart");
  else reasons.push(`${yearDiff} years apart`);

  const yearProximityScore = getExploreYearProximityScore(userA.year, userB.year);
  const courseScore = getAcademicCourseScore(userA.course, userB.course);
  if (courseScore === 100) reasons.push(`Both in ${userA.course?.toUpperCase()}`);

  const shouldUsePreferences = hasComparablePreferences(userA.preferences, userB.preferences);
  const preferenceScore = shouldUsePreferences
    ? Math.round(calculatePreferenceSimilarity(
        userA.preferences,
        userB.preferences,
      ))
    : 0;

  collectLifestyleReasons(userA, userB, reasons);

  const primaryScore = Math.round(yearProximityScore * 0.7 + courseScore * 0.3);
  const totalScore = Math.round(primaryScore * 0.3 + preferenceScore * 0.7);

  return {
    primaryScore,
    preferenceScore,
    totalScore,
    score: totalScore,
    reasons: reasons.slice(0, 3),
  };
}

export function calculateMatch(userA: UserProfile, userB: UserProfile) {
  // 0. Gender Match (Mandatory fallback)
  if (userA.gender !== userB.gender) return { primaryScore: 0, preferenceScore: 0, totalScore: 0, score: 0, reasons: [] };

  // 0b. Academic Primary Filters (Mandatory)
  const yrA = parseInt(userA.year || "0");
  const yrB = parseInt(userB.year || "0");
  const yearDiff = Math.abs(yrA - yrB);
  const courseA = userA.course?.toLowerCase() || "";
  const courseB = userB.course?.toLowerCase() || "";
  const sameCourse = courseA === courseB;
  
  // Only same-year students are eligible for matching
  // Exception: if different year AND different course, exclude completely
  if (yearDiff !== 0 && !sameCourse) {
    return { primaryScore: 0, preferenceScore: 0, totalScore: 0, score: 0, reasons: ["Different academic year and course"] };
  }
  
  if (yearDiff !== 0) {
    return { primaryScore: 0, preferenceScore: 0, totalScore: 0, score: 0, reasons: ["Different academic year"] };
  }

  const reasons: string[] = [];

  // Primary Score logic
  const yearScore = getAcademicYearScore(userA.year, userB.year);
  if (yearScore === 100) reasons.push("Same year of study");

  const courseScore = getAcademicCourseScore(userA.course, userB.course);
  if (courseScore === 100) reasons.push(`Both in ${userA.course?.toUpperCase()}`);

  const shouldUsePreferences = hasComparablePreferences(userA.preferences, userB.preferences);
  const preferenceScore = shouldUsePreferences
    ? Math.round(calculatePreferenceSimilarity(
        userA.preferences,
        userB.preferences,
      ))
    : 0;

  // Lifestyle reasons
  collectLifestyleReasons(userA, userB, reasons);

  const primaryScore = Math.round(yearScore * 0.7 + courseScore * 0.3);
  const totalScore = shouldUsePreferences
    ? Math.round(primaryScore * PRIMARY_WEIGHT + preferenceScore * PREFERENCES_WEIGHT)
    : primaryScore;

  return {
    primaryScore,
    preferenceScore,
    totalScore,
    score: totalScore,
    reasons: reasons.slice(0, 3) // Show top 3 reasons
  };
}
