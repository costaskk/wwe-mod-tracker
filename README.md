# WWE 2K25 Mod Tracker with Supabase

A Vite + React + Supabase web app for tracking your WWE 2K25 character mods as a real online database instead of browser-only local storage.

## What this version includes

- Supabase Auth with email/password sign-in
- Supabase database storage
- No demo/example data
- Add, edit, and delete mod entries
- Add multiple attires per wrestler
- Store creator name, source game, game patch version, and mod type
- Store image URLs and download links
- Store JSON for moveset/animations, hype profile, and DC profile
- Filter by creator, type, source game, search text, and missing/incomplete entries
- Track missing targets and target attire counts to find gaps
- Private Row Level Security so each user only sees their own data

## Tech stack

- React 18
- Vite
- Supabase JS v2

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root using `.env.example` as a base:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

3. Start the dev server:

```bash
npm run dev
```

## Supabase setup

### 1) Create a project

Create a Supabase project in the dashboard.

### 2) Add the database schema

Open the SQL Editor in Supabase and run the SQL from:

```text
supabase/schema.sql
```

This creates:
- `mods`
- `attires`
- update triggers
- RLS policies

### 3) Get your project URL and key

Copy your project URL and publishable key from your project’s Connect or API Keys area and place them in `.env.local`.

## GitHub setup

### Option A: Git CLI

```bash
git init
git add .
git commit -m "Initial Supabase mod tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Option B: GitHub website

Create a new empty repo, then upload the extracted project files.

## Vercel deployment

1. Push the project to GitHub.
2. In Vercel, click **Add New Project**.
3. Import your GitHub repo.
4. Use these settings if Vercel does not auto-detect them:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. In Vercel project settings, add these environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Deploy.

## Important notes

- Do not commit your `.env.local` file.
- This app uses client-side Supabase auth and database access.
- Never put a Supabase service role key in the browser.
- Never put a service role key in the browser.

## File structure

```text
wwe-2k25-mod-tracker-supabase/
├── .env.example
├── .gitignore
├── README.md
├── index.html
├── package.json
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── components/
│   │   ├── AuthPanel.jsx
│   │   ├── DetailPanel.jsx
│   │   ├── Filters.jsx
│   │   ├── Header.jsx
│   │   ├── ModEditor.jsx
│   │   ├── ModList.jsx
│   │   └── StatsGrid.jsx
│   └── lib/
│       ├── supabase.js
│       └── utils.js
└── supabase/
    └── schema.sql
```

## If you want me to patch your current repo later

Upload either:
- your whole project ZIP, or
- the specific files you changed

The most useful files would be:
- `package.json`
- `src/App.jsx`
- any existing component files
- your current SQL schema if you already created tables
