const fs = require('fs');

const fixFile = (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');

  // Hardcode neon wipes
  content = content.split('bg-gradient-to-r from-purple-600 to-fuchsia-500').join('bg-[var(--brand)]');
  content = content.split('shadow-lg shadow-purple-900/30').join('shadow-[0_0_20px_rgba(59,130,246,0.15)]');
  content = content.split('focus:border-purple-300/80').join('focus:border-[var(--brand)]');
  content = content.split('focus:ring-purple-300/40').join('focus:ring-[var(--brand)]/30');
  content = content.split('focus:ring-purple-300/70').join('focus:ring-[var(--brand)]/50');
  
  // Wipe orbs
  content = content.split('bg-purple-500/25').join('bg-[var(--brand)]/20');
  content = content.split('bg-blue-500/20').join('bg-[var(--brand-soft)]/20');
  content = content.split('bg-fuchsia-400/15').join('bg-[var(--brand-muted)]/40');
  
  // Sign out button
  content = content.split('bg-gradient-to-r from-purple-500 to-fuchsia-500').join('bg-[var(--brand)]');

  fs.writeFileSync(filepath, content);
};

fixFile('c:/Users/91817/roommate-app/app/page.tsx');
fixFile('c:/Users/91817/roommate-app/app/match/[email]/page.tsx');
console.log('Fixed styles.');
