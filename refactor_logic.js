const fs = require('fs');
let content = fs.readFileSync('c:/Users/91817/roommate-app/app/page.tsx', 'utf8');

// 1. UserProfile Type
content = content.replace(
  /type UserProfile = {[\s\S]*?};/,
  `type UserProfile = {
  email: string;
  name: string | null;
  year: string | null;
  course: string | null;
  gender: string | null;
  room_number: string | null;
  is_open_to_switch: boolean | null;
  preferences: Record<string, string> | null;
};`
);

// 2. Weights and calculate functions
content = content.replace(
  /const PRIMARY_WEIGHT = 0\.6;\nconst PREFERENCES_WEIGHT = 0\.4;\n\nconst calculatePreferenceSimilarity = \([\s\S]*?\n\nconst buttonClass =/m,
  `const PRIMARY_WEIGHT = 0.8;
const PREFERENCES_WEIGHT = 0.2;

const calculatePreferenceSimilarity = (
  preferencesA: Record<string, string> | null,
  preferencesB: Record<string, string> | null,
) => {
  if (!preferencesA || !preferencesB) return 0;

  const keys = questions.map((question) => question.id);
  let score = 0;
  let maxScore = keys.length;

  for (const key of keys) {
    const valueA = preferencesA[key];
    const valueB = preferencesB[key];

    if (!valueA || !valueB) {
      maxScore -= 1;
      continue;
    }
    
    if (valueA === valueB) {
      score += 1;
    } else {
      const q = questions.find((q) => q.id === key);
      if (q) {
        const idxA = q.options.findIndex((o) => o.value === valueA);
        const idxB = q.options.findIndex((o) => o.value === valueB);
        if (idxA !== -1 && idxB !== -1 && Math.abs(idxA - idxB) === 1) {
          score += 0.5;
        }
      }
    }
  }

  if (maxScore === 0) return 0;
  return (score / maxScore) * 100;
};

const calculateMatch = (userA: UserProfile, userB: UserProfile) => {
  if (userA.gender !== userB.gender) return -1;

  let primaryScore = 0;

  if (userA.year && userB.year) {
    const yearDiff = Math.abs(Number(userA.year) - Number(userB.year));
    if (yearDiff === 0) primaryScore += 40;
    else if (yearDiff === 1) primaryScore += 20;
  }

  const courseA = userA.course ?? "";
  const courseB = userB.course ?? "";
  if (courseA && courseB) {
    if (courseA === courseB) {
      primaryScore += 30;
    } else if (courseGroup(courseA) === courseGroup(courseB)) {
      primaryScore += 20;
    } else {
      primaryScore += 10;
    }
  }

  const primaryNormalized = (primaryScore / 70) * 100;

  let finalScore = 0;
  const hasA = userA.preferences && Object.keys(userA.preferences).length > 0;
  const hasB = userB.preferences && Object.keys(userB.preferences).length > 0;

  if (!hasA || !hasB) {
    finalScore = primaryNormalized;
  } else {
    const preferencesScore = calculatePreferenceSimilarity(userA.preferences, userB.preferences);
    finalScore = primaryNormalized * PRIMARY_WEIGHT + preferencesScore * PREFERENCES_WEIGHT;
  }

  if (userA.is_open_to_switch === false && userB.is_open_to_switch === false) {
    finalScore = finalScore * 0.7;
  }

  return Math.round(finalScore);
};

const buttonClass =`
);

// 3. States & Fetch logic
content = content.replace(
  /const \[gender, setGender\] = useState\("male"\);/,
  `const [gender, setGender] = useState("male");\n  const [roomNumber, setRoomNumber] = useState("");\n  const [isOpenToSwitch, setIsOpenToSwitch] = useState<boolean>(false);\n  const [selectedMatch, setSelectedMatch] = useState<MatchUser | null>(null);`
);

content = content.replace(
  /\.select\("email, name, year, course, gender, preferences"\)/g,
  `.select("email, name, year, course, gender, preferences, room_number, is_open_to_switch")`
);

content = content.replace(
  /if \(data\?\.gender\) setGender\(data\.gender\);/,
  `if (data?.gender) setGender(data.gender);\n        if (data?.room_number) setRoomNumber(data.room_number);\n        if (data?.is_open_to_switch !== undefined && data?.is_open_to_switch !== null) setIsOpenToSwitch(data.is_open_to_switch);`
);

// 4. Upsert logic
content = content.replace(
  /year,\n\s*course,\n\s*gender,\n\s*};\n\n\s*const \{ data, error: upsertError \}/,
  `year,
        course,
        gender,
        room_number: roomNumber || null,
        is_open_to_switch: isOpenToSwitch,
      };

      const { data, error: upsertError }`
);

// 5. findMatches filtering
content = content.replace(
  /const ranked = \(data \?\? \[\]\)\n\s*\.map\(\(candidate\) => \(\{\n\s*\.\.\.candidate,\n\s*score: calculateMatch\(profile, candidate\),\n\s*\}\)\)\n\s*\.sort\(\(a, b\) => b\.score - a\.score\)\n\s*\.slice\(0, 10\);/,
  `const ranked = (data ?? [])
        .map((candidate) => ({
          ...candidate,
          score: calculateMatch(profile, candidate),
        }))
        .filter((c) => c.score > 0 && c.gender === profile.gender)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);`
);

// 6. Profile Summary
content = content.replace(
  /<div className="grid gap-3 rounded-xl border border-\[var\(--border-subtle\)\] bg-\[var\(--background-card\)\] p-4 text-sm sm:grid-cols-3">/,
  `<div className="grid gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">`
);

content = content.replace(
  /<div>\s*<p className="text-\[var\(--text-muted\)\]">Gender<\/p>\s*<p className="font-medium capitalize">\{profile\?\.gender\}<\/p>\s*<\/div>\s*<\/div>/,
  `<div>
                        <p className="text-[var(--text-muted)]">Gender</p>
                        <p className="font-medium capitalize">{profile?.gender}</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-muted)]">Room</p>
                        <p className="font-medium">{profile?.room_number || "Not specified"}</p>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-4 mt-2 border-t border-[var(--border-subtle)] pt-3">
                        <p className="text-[var(--text-muted)] inline mr-2">Open to switch rooms:</p>
                        <span className="font-medium">{profile?.is_open_to_switch ? "Yes" : "No"}</span>
                      </div>
                    </div>`
);

// 7. Profile Form adding inputs
const profileFormInputs = `<div className="space-y-1.5">
                      <label className="text-sm text-[var(--foreground)]/85" htmlFor="room_number">
                        Room Number
                      </label>
                      <input
                        id="room_number"
                        type="text"
                        placeholder="e.g. C-101"
                        className={selectClass}
                        value={roomNumber}
                        onChange={(event) => setRoomNumber(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 text-sm pt-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOpenToSwitch}
                          onChange={(event) => setIsOpenToSwitch(event.target.checked)}
                          className="w-5 h-5 rounded border border-[var(--border-subtle)] bg-[var(--background-secondary)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] accent-[var(--brand-primary)] cursor-pointer"
                        />
                        <span className="text-[var(--foreground)]/85">Are you open to switching rooms?</span>
                      </label>
                    </div>`;

content = content.replace(
  /<\/select>\s*<\/div>\s*<button\s*className={`w-full \$\{buttonClass\}`}\s*type="submit"/g,
  `</select>
                    </div>
                    ${profileFormInputs}
                    <button
                      className={\`w-full \${buttonClass}\`}
                      type="submit"`
);

// 8. View Button update
content = content.replace(
  /onClick=\{\(\) => \{\}\}\n\s*>\n\s*View\n\s*<\/button>/g,
  `onClick={() => setSelectedMatch(bestMatch)}
                        >
                          View
                        </button>`
);

content = content.replace(
  /className="mt-3">\n\s*<div className="flex items-center justify-between"/g,
  `className="mt-3">
                            <button className="mb-3 w-full rounded-lg bg-[var(--background-secondary)] px-4 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--background-accent)] transition duration-200" onClick={() => setSelectedMatch(match)}>View Details</button>
                            <div className="flex items-center justify-between"`
);

// 9. Add modal before the final closing specific div/main
const modalCode = `
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5">
              <div>
                <h2 className="text-xl font-semibold">{selectedMatch.name || "Unknown"}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{selectedMatch.email}</p>
              </div>
              <button 
                onClick={() => setSelectedMatch(null)}
                className="rounded-full w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto p-5 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-[var(--background-secondary)] rounded-xl p-4">
                <div>
                  <p className="text-[var(--text-muted)] mb-1 text-xs uppercase tracking-wider font-semibold">Match score</p>
                  <p className="text-2xl font-bold text-[var(--brand-primary)]">{selectedMatch.score}%</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1 text-xs uppercase tracking-wider font-semibold">Current Setup</p>
                  <p className="font-medium truncate">Room: {selectedMatch.room_number || "Not specified"}</p>
                  <p className="font-medium text-[var(--brand-primary)] mt-1">
                    {selectedMatch.is_open_to_switch ? "✓ Open to switch" : "✗ Not switching"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1 text-xs uppercase tracking-wider font-semibold">Student</p>
                  <p className="font-medium capitalize">{selectedMatch.gender}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1 text-xs uppercase tracking-wider font-semibold">Academics</p>
                  <p className="font-medium">Year {selectedMatch.year}</p>
                  <p className="font-medium uppercase">{selectedMatch.course}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                  <span>Preferences Comparison</span>
                  <span className="h-px flex-1 bg-[var(--border-subtle)]"></span>
                </h3>
                <div className="space-y-3">
                  {questions.map(q => {
                    const myAnswer = profile?.preferences?.[q.id];
                    const theirAnswer = selectedMatch.preferences?.[q.id];
                    if (!myAnswer && !theirAnswer) return null;
                    
                    const myOpt = q.options.find(o => o.value === myAnswer);
                    const theirOpt = q.options.find(o => o.value === theirAnswer);
                    
                    const isExactMatch = myAnswer === theirAnswer;
                    
                    return (
                      <div key={q.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--background-card)] p-3 text-sm">
                        <p className="mb-3 font-medium text-[var(--foreground)]">{q.question}</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-[var(--background-secondary)] p-2 rounded-md">
                            <span className="text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1 mb-2 block font-semibold uppercase tracking-wider">You</span>
                            <p className="text-[var(--foreground)]">{myOpt?.label || "Not answered"}</p>
                          </div>
                          <div className={isExactMatch ? "bg-[var(--brand-primary)]/10 p-2 rounded-md border border-[var(--brand-primary)]/20" : "bg-[var(--background-secondary)] p-2 rounded-md"}>
                            <span className="text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-1 mb-2 block font-semibold uppercase tracking-wider">Them</span>
                            <p className={isExactMatch ? "text-[var(--brand-primary)] font-medium" : "text-[var(--foreground)]"}>
                              {theirOpt?.label || "Not answered"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!selectedMatch.preferences || Object.keys(selectedMatch.preferences).length === 0) && (
                     <p className="text-sm text-[var(--text-muted)] text-center py-4 border border-dashed border-[var(--border-subtle)] rounded-lg">They haven't filled out their preferences yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(
  /<\/main>\n\s*\);\n\s*}\s*$/,
  `${modalCode}
    </main>
  );
}
`
);

fs.writeFileSync('c:/Users/91817/roommate-app/app/page.tsx', content);
console.log("Refactoring logic complete");
