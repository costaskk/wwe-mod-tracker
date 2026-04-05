# WWE 2K25 Public Mod Database

A Vite + React + Supabase app for tracking WWE 2K25 wrestler mods publicly.

## Features

- Public wrestler database
- Browse wrestler pages and their attire mods
- Add a new wrestler
- Add new attire mods to an existing wrestler
- Upload preview images and DDS renders to Supabase Storage
- Mark an attire as installed in your own game
- Request a missing link or report a dead link
- Public browsing, authenticated contributions

## Local setup

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase URL and publishable key
3. Run the SQL in `supabase/schema.sql` (this version starts with a clean reset and drops the old tables first)
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

- Push the project to GitHub
- Import the repo in Vercel
- Add:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Deploy

## Notes

- The `mod-assets` storage bucket is public in this version so previews and DDS files can be viewed/downloaded by everyone.
- Never use a Supabase secret key in this frontend app.
