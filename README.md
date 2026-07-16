# Scribe

**Type the Word** — an elegant Bible typing experience.

Frontend-only for now: pick a translation and reference, type a verse / passage / chapter, follow daily plans, and track stats locally in your browser.

## Translations

Public-domain texts bundled from [midvash/bible-data](https://github.com/midvash/bible-data):

- **WEB** — World English Bible (default)
- **KJV** — King James Version
- **ASV** — American Standard Version

NIV / NKJV are copyrighted and are not included.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, next-themes, Framer Motion, Zustand + localStorage.
