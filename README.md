# WWE 2K25 Mod Database

Public community database for WWE 2K25 mods, built with React, Vite, and Supabase.

## Features
- public wrestler pages
- multiple attire mods per wrestler
- wrestler headshot upload or automatic public image match
- moveset/animations JSON upload
- hype/DC profile JSON upload
- multiple screenshots per attire
- DDS render upload per attire
- creator dropdown backed by a shared creators table
- per-user install tracking
- request missing or dead download links
- filters for installed mods and missing download links

## Setup
1. Create `.env.local`:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start locally:
   ```bash
   npm run dev
   ```

## Important
The current schema is a reset schema. It drops and recreates the app tables so the structure matches this version.
