const fs = require('fs');

let pageContent = fs.readFileSync('c:/Users/91817/roommate-app/app/page.tsx', 'utf8');

// Best Match replace
pageContent = pageContent.replace(
  /<div className="rounded-xl border border-\[var\(--border-subtle\)\] bg-\[var\(--background-card\)\] p-5 shadow-sm transition duration-200 hover:border-\[var\(--brand-primary\)\] sm:p-6">\s*<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">\s*<div className="space-y-1">\s*<p className="text-sm text-\[var\(--foreground\)\]\/70">Top Match<\/p>\s*<p className="text-lg font-semibold">\s*\{bestMatch\.name \?\? "Unknown"\}\s*<\/p>\s*<p className="text-sm text-\[var\(--foreground\)\]\/70">\{bestMatch\.email\}<\/p>\s*<\/div>\s*<button[\s\S]*?<\/button>\s*<\/div>\s*<div className="mt-4 space-y-2">\s*<div className="flex items-center justify-between">\s*<p className="text-sm text-\[var\(--foreground\)\]\/70">Match Score<\/p>\s*<p className="text-sm font-semibold">\{bestMatch\.score\}<\/p>\s*<\/div>\s*<div className="h-3 w-full overflow-hidden rounded-full bg-\[var\(--background-secondary\)\]">\s*<div\s*className="h-full rounded-full bg-\[var\(--brand-primary\)\] transition-all duration-300"\s*style=\{\{ width: \`\$\{bestMatch\.score\}%\` \}\}\s*\/>\s*<\/div>\s*<\/div>\s*<\/div>/,
  `<Link href={\`/match/\${bestMatch.email}\`} className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-5 shadow-sm transition duration-200 hover:border-[var(--brand-primary)] sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm text-[var(--foreground)]/70">Top Match</p>
        <p className="text-lg font-semibold">
          {bestMatch.name ?? "Unknown"}
        </p>
        <p className="text-sm text-[var(--foreground)]/70">{bestMatch.email}</p>
      </div>
    </div>
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[var(--foreground)]/60 uppercase tracking-wider">Match Score</p>
        <p className="text-xs font-bold text-[var(--foreground)]/70">{bestMatch.score}%</p>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--background-secondary)]">
        <div
          className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300"
          style={{ width: \`\${bestMatch.score}%\` }}
        />
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
      <div className="w-full text-center rounded-lg bg-[var(--background-secondary)] px-4 py-2 text-xs font-medium text-[var(--foreground)] transition duration-200">
          View Details & Compare
      </div>
    </div>
  </Link>`
);

// Green Pill
pageContent = pageContent.replace(
  /<p className="rounded-lg border border-\[var\(--border-subtle\)\] bg-\[var\(--brand-primary\)\] bg-opacity-10 px-2\.5 py-1 text-sm font-medium text-\[var\(--brand-primary\)\]">\s*\{match\.score\}% Matched\s*<\/p>/g,
  `` // Just erase it fully
);

fs.writeFileSync('c:/Users/91817/roommate-app/app/page.tsx', pageContent);
console.log("Cleanup script done");
