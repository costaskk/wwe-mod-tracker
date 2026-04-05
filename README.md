# WWE 2K25 Mod Database

A Vite + React + Supabase app for tracking wrestler mods, attire slots, DDS renders, preview screenshots, movesets, and merged hype/DC profile JSON.

## Features

- Supabase Auth login
- Private per-user database via Row Level Security
- Wrestler entries with source game, patch version, tags, missing-target tracking, and notes
- Attire-level creator and download link fields
- Preview image upload to Supabase Storage
- DDS render upload to Supabase Storage
- Moveset / animations JSON
- Merged hype / DC profile JSON
- Search and filters
- Vercel-ready frontend

## Local setup

```bash
npm install
npm run dev
```

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

## Supabase setup

1. Open your Supabase project.
2. Go to the SQL editor.
3. Run `supabase/schema.sql`.
4. Make sure Email auth is enabled if you want signup/signin.

## Deploy to Vercel

- Push the project to GitHub.
- Import the repo in Vercel.
- Add the same environment variables in Vercel project settings.
- Deploy.
