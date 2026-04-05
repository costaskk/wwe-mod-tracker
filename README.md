# WWE 2K25 Mod Tracker

A React + Vite web app for tracking WWE 2K25 character mods, attire slots, creators, download links, images, and uploaded JSON data such as movesets, hype profiles, and DC profiles.

## Features

- Add wrestler mods with creator, game version, source game, and mod type
- Track whether something is an original mod, port, remake, or update
- Add multiple attire entries per wrestler
- Store image URLs and download links
- Upload JSON files for:
  - Moveset / animations
  - Hype profile
  - DC profile
- Search and filter by creator, type, source game, and missing status
- Set target attire counts to quickly spot missing ports or gaps
- Export and import the full database as JSON
- Saves locally in the browser with `localStorage`

## Tech stack

- React 18
- Vite
- Plain CSS
- lucide-react icons

## Local setup

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Production build

```bash
npm run build
```

## Deploy to Vercel

This project works out of the box on Vercel as a standard Vite app.

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

## Notes

This version stores data in the browser only. That means each browser or device has its own separate saved database unless you export and import the JSON manually.

If you want synced online data later, the best next step is adding a backend such as Supabase.
