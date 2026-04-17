const fs = require('fs');

const updateFile = (filepath) => {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // Fix buttonClass
  content = content.replace(
    /const buttonClass =[\s\S]*?";/,
    `const buttonClass =
  "rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-brand)] shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] hover:bg-[var(--brand-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:-translate-y-0 disabled:hover:shadow-none";`
  );

  // Fix selectClass
  content = content.replace(
    /const selectClass =[\s\S]*?";/,
    `const selectClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-accent-subtle)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none backdrop-blur-sm transition duration-200 hover:border-[var(--border-hover)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30";`
  );

  // Fix Orbs in page.tsx
  content = content.replace(
    /className="absolute -top-24 left-\[-80px\] h-72 w-72 rounded-full bg-purple-500\/25 blur-3xl"/g,
    `className="absolute -top-24 left-[-80px] h-72 w-72 rounded-full bg-[var(--brand)]/20 blur-[100px]"`
  );
  content = content.replace(
    /className="absolute top-40 right-\[-120px\] h-80 w-80 rounded-full bg-blue-500\/20 blur-3xl"/g,
    `className="absolute top-40 right-[-120px] h-80 w-80 rounded-full bg-[var(--brand-soft)]/20 blur-[100px]"`
  );
  content = content.replace(
    /className="absolute bottom-\[-140px\] left-1\/3 h-72 w-72 rounded-full bg-fuchsia-400\/15 blur-3xl"/g,
    `className="absolute bottom-[-140px] left-1/3 h-72 w-72 rounded-full bg-[var(--brand-muted)]/40 blur-[100px]"`
  );

  // Fix TS error in match page
  content = content.replace(
    /\.eq\("email", session\.user\.email\)/g,
    `.eq("email", session?.user?.email ?? "")`
  );
  
  // Make the background class uniform
  content = content.replace(
    /bg-white\/10/g,
    `bg-[var(--bg-accent-subtle)]`
  );

  fs.writeFileSync(filepath, content);
};

updateFile('c:/Users/91817/roommate-app/app/page.tsx');
updateFile('c:/Users/91817/roommate-app/app/match/[email]/page.tsx');

console.log("UI Polished");
