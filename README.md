# Scribe

**Type the Word** — an elegant Bible typing experience.

Pick a translation and reference, type a verse / passage / chapter, follow daily plans, and track stats. Guests keep progress on-device; accounts sync to Supabase.

## Translations

Public-domain texts bundled from [midvash/bible-data](https://github.com/midvash/bible-data):

- **WEB** — World English Bible (default)
- **KJV** — King James Version
- **ASV** — American Standard Version

NIV / NKJV are copyrighted and are not included.

## Develop

```bash
cp .env.example .env.local   # fill Supabase URL + anon key
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, next-themes, Framer Motion, Zustand + localStorage, Supabase Auth + Postgres.

## Deploy

Hosted on Vercel. Env vars required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
