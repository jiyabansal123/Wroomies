const fs = require('fs');

const globalsCss = `@import "tailwindcss";

:root {
  --background: #0C0E14;
  --bg-sidebar: #10121A;
  --bg-card: #10121A;
  --bg-accent-subtle: #161D2E;

  --brand: #3B82F6;
  --brand-soft: #60A5FA;
  --brand-muted: #161D2E;
  --brand-border: #1E2D4A;

  --foreground: #E4E6F0;
  --text-secondary: #6B7280;
  --text-muted: #4B5563;
  --text-on-brand: #ffffff;

  --border: #1E2130;
  --border-hover: #2A3050;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0C0E14;
    --bg-sidebar: #10121A;
    --bg-card: #10121A;
    --bg-accent-subtle: #161D2E;

    --brand: #3B82F6;
    --brand-soft: #60A5FA;
    --brand-muted: #161D2E;
    --brand-border: #1E2D4A;

    --foreground: #E4E6F0;
    --text-secondary: #6B7280;
    --text-muted: #4B5563;
    --text-on-brand: #ffffff;

    --border: #1E2130;
    --border-hover: #2A3050;
  }
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), sans-serif;
}
`;

fs.writeFileSync('c:/Users/91817/roommate-app/app/globals.css', globalsCss);

const mapping = {
  '--background-secondary': '--bg-sidebar',
  '--background-card': '--bg-card',
  '--background-accent': '--bg-accent-subtle',
  '--brand-primary-hover': '--brand-soft',
  '--brand-primary': '--brand',
  '--border-subtle': '--border',
  '--border-default': '--border-hover'
};

const mapFile = (filepath) => {
  if (fs.existsSync(filepath)) {
    let code = fs.readFileSync(filepath, 'utf8');
    for (const [oldVar, newVar] of Object.entries(mapping)) {
      code = code.split('var(' + oldVar + ')').join('var(' + newVar + ')');
    }
    fs.writeFileSync(filepath, code);
  }
};

mapFile('c:/Users/91817/roommate-app/app/page.tsx');
mapFile('c:/Users/91817/roommate-app/app/match/[email]/page.tsx');

console.log("Theme applied");
