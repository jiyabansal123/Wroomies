const fs = require('fs');

let content = fs.readFileSync('c:/Users/91817/roommate-app/app/page.tsx', 'utf8');

// Background and Text 
content = content.replace(
  /bg-gradient-to-br from-\[#1a0033\] via-\[#10001f\] to-black p-4 text-white/g,
  'bg-[var(--background)] p-4 text-[var(--foreground)] min-h-screen flex items-center justify-center'
);
content = content.replace(
  /bg-gradient-to-br from-\[#1a0033\] via-\[#10001f\] to-black text-white/g,
  'bg-[var(--background)] text-[var(--foreground)]'
);

// Delete orbs
content = content.replace(
  /      <div\n        className="pointer-events-none absolute inset-0 opacity-70"\n        aria-hidden="true"\n      >\n        <div className="absolute -top-24 left-\[-80px\] h-72 w-72 rounded-full bg-purple-500\/25 blur-3xl" \/>\n        <div className="absolute top-40 right-\[-120px\] h-80 w-80 rounded-full bg-blue-500\/20 blur-3xl" \/>\n        <div className="absolute bottom-\[-140px\] left-1\/3 h-72 w-72 rounded-full bg-fuchsia-400\/15 blur-3xl" \/>\n      <\/div>\n/g,
  ''
);

// Replace speciun devfic elements
const dict = [
  [
    `const buttonClass =\n  "rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition duration-300 hover:scale-[1.02] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-purple-300/70 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100";`,
    `const buttonClass =\n  "rounded-lg bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-medium text-[var(--text-on-brand)] shadow-sm hover:bg-[var(--brand-primary-hover)] transition disabled:cursor-not-allowed disabled:opacity-60";`
  ],
  [
    `const selectClass =\n  "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none backdrop-blur-sm transition duration-200 focus:border-purple-300/80 focus:ring-2 focus:ring-purple-300/40";`,
    `const selectClass =\n  "w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--background-secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition duration-200 focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]";`
  ],
  ['w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300', 'w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-8 text-center shadow-sm animate-in fade-in zoom-in-95 duration-300'],
  ['w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8 animate-in fade-in zoom-in-95 duration-300', 'w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-6 shadow-sm sm:p-8 animate-in fade-in zoom-in-95 duration-300'],
  ['hidden w-[240px] flex-shrink-0 flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl md:flex', 'hidden w-[240px] flex-shrink-0 flex-col bg-[var(--background-secondary)] border-r border-[var(--border-subtle)] md:flex'],
  [/"bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow"/g, '"bg-[var(--brand-primary)] text-[var(--text-on-brand)] shadow-sm"'],
  [/"bg-white\/5 text-white\/70 hover:bg-white\/10"/g, '"text-[var(--text-secondary)] hover:bg-[var(--background-accent)]"'],
  ['sticky top-0 z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl', 'sticky top-0 z-10 bg-[var(--background-secondary)] border-b border-[var(--border-subtle)]'],
  ['flex gap-2 rounded-2xl bg-white/5 p-1 text-sm', 'flex gap-2 rounded-lg bg-[var(--background-secondary)] p-1 text-sm'],
  [/"flex-1 rounded-xl px-3 py-1\.5 transition \$\{/g, '"flex-1 rounded-md px-3 py-1.5 transition ${'],
  [/"bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"/g, '"bg-[var(--brand-primary)] text-[var(--text-on-brand)]"'],
  [/"text-white\/70 hover:bg-white\/10"/g, '"text-[var(--text-secondary)] hover:bg-[var(--background-accent)]"'],
  ['w-full rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl', 'w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-4 shadow-sm'],
  ['grid gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm sm:grid-cols-3', 'grid gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-4 text-sm sm:grid-cols-3'],
  ['bg-[#140024] text-white', 'bg-[var(--background)] text-[var(--foreground)]'],
  ['h-2 w-full rounded-full bg-white/15', 'h-2 w-full rounded-full bg-[var(--background-secondary)]'],
  ['h-2 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all duration-300', 'h-2 rounded-full bg-[var(--brand-primary)] transition-all duration-300'],
  ['space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4 transition duration-300', 'space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-4 shadow-sm'],
  ['"border-purple-300/80 bg-purple-500/25 text-white"', '"border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--text-on-brand)]"'],
  ['"border-white/20 bg-white/10 text-white/85 hover:bg-white/15"', '"border-[var(--border-subtle)] bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-accent)]"'],
  ['rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-sm text-white transition duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50', 'rounded-lg border border-[var(--border-default)] bg-[var(--background-secondary)] px-4 py-2 text-sm text-[var(--foreground)] transition duration-200 hover:bg-[var(--background-accent)] disabled:cursor-not-allowed disabled:opacity-50'],
  ['max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-white/15 bg-white/5 p-3 text-sm', 'max-h-64 space-y-3 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-3 text-sm'],
  ['space-y-1 rounded-lg bg-white/5 p-2', 'space-y-1 rounded-lg bg-[var(--background-secondary)] p-2'],
  [/"rounded-2xl border border-white\/15 bg-white\/5 p-4 backdrop-blur-xl transition duration-200 hover:bg-white\/10"/g, '"rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-4 shadow-sm transition duration-200 hover:bg-[var(--background-accent)]"'],
  ['rounded-2xl border border-white/20 bg-gradient-to-br from-purple-500/15 to-fuchsia-500/10 p-5 backdrop-blur-xl shadow-xl transition duration-200 hover:shadow-purple-500/20 sm:p-6', 'rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-5 shadow-sm transition duration-200 hover:border-[var(--brand-primary)] sm:p-6'],
  ['rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-white/15', 'rounded-lg bg-[var(--background-secondary)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-accent)] transition duration-200'],
  ['h-3 w-full overflow-hidden rounded-full bg-white/10', 'h-3 w-full overflow-hidden rounded-full bg-[var(--background-secondary)]'],
  [/"h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-300"/g, '"h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300"'],
  ['rounded-2xl border border-white/20 bg-white/10 p-4 shadow-md backdrop-blur-sm transition duration-200 hover:bg-white/15 hover:scale-[1.02] hover:shadow-purple-500/30', 'rounded-xl border border-[var(--border-subtle)] bg-[var(--background-card)] p-4 shadow-sm transition duration-200 hover:border-[var(--brand-primary)] hover:scale-[1.02]'],
  ['rounded-lg border border-purple-300/40 bg-purple-500/20 px-2.5 py-1 text-sm font-semibold text-purple-100', 'rounded-lg border border-[var(--border-subtle)] bg-[var(--background-secondary)] px-2.5 py-1 text-sm font-medium text-[var(--foreground)]'],
  ['mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10', 'mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--background-secondary)]'],
  ['flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/25 bg-white/5 p-10 text-center', 'flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--background-secondary)] p-10 text-center'],
  [/"text-white\/85"/g, '"text-[var(--text-secondary)]"'],
  [/"text-white\/80"/g, '"text-[var(--text-secondary)]"'],
  [/"text-white\/70"/g, '"text-[var(--text-secondary)]"'],
  [/"text-white\/60"/g, '"text-[var(--text-muted)]"'],
  [/"text-white\/50"/g, '"text-[var(--text-muted)]"']
];

dict.forEach(([find, rep]) => {
  if (typeof find === 'string') {
    content = content.split(find).join(rep);
  } else {
    content = content.replace(find, rep);
  }
});

// Final text-white replacements carefully
content = content.replace(/\btext-white\b/g, 'text-[var(--foreground)]');

fs.writeFileSync('c:/Users/91817/roommate-app/app/page.tsx', content);
console.log("Refactoring complete");
