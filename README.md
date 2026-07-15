# Reps — Gym Tracker

A Hevy-style workout tracker that fixes the two things Hevy gates:

- **Custom exercises** — create your own, free.
- **Full history** — every workout, every chart, stored on your device, no subscription.

Built as an installable **Progressive Web App (PWA)**: it runs fullscreen on iPhone, works offline, and keeps all data in on-device storage. No account, no server, no cost.

## Features

- **Home** — weekly stats (workouts / volume / sets), start an empty workout or one of your routines.
- **Active workout** — Hevy-style set table (previous · kg · reps · ✓), auto-starting rest timer with −15/+15/skip, add exercises mid-workout, elapsed clock. An in-progress workout survives the app being closed.
- **Custom exercises** — name, equipment, primary muscle, notes. Creatable from the library or mid-workout from the exercise picker.
- **History** — monthly calendar of workout days (browse any month), past workout cards with duration, volume and PR count.
- **Exercise detail** — best weight, estimated 1RM (Epley), best session volume, heaviest-weight chart over your last 8 sessions, full session history, notes.
- **PR detection** — beat your historical best weight on any exercise and the session earns a 🏆 badge.

## Tech stack

React 18 + TypeScript + Vite. State persists to `localStorage` (the app is fully usable offline); a small service worker caches the app shell. Optional cloud backup via Supabase (below).

## Backup & sync (Supabase)

The phone stays the source of truth — sync is an offline-first backup: every finished workout and custom exercise is queued locally and pushed when online (on app start, on reconnect, and right after each workout). Remote data is also pulled and merged, so a second device sees the same history.

One-time setup:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project's **SQL Editor**, run the contents of [`supabase/schema.sql`](supabase/schema.sql) (creates `exercises` + `sessions` tables with row-level security).
3. In **Authentication → Sign In / Up → Email**, turn **off** "Confirm email" (or keep it on and click the confirmation link once).
4. In the app, tap the **cloud button** on the Home screen, paste the **Project URL** and **anon key** (from Settings → API), then create an account with an email + password.

The anon key is a publishable key; data access is protected per-account by RLS policies. Alternatively, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as GitHub Actions repository **variables** to bake the server into the deployed build so the app skips step 4's URL/key entry.

## Develop

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

The app is served at `https://<user>.github.io/gym_tracker/` (the Vite `base` is set to `/gym_tracker/`; override with `VITE_BASE=/` for other hosts).

## Install on iPhone

1. Open the deployed URL in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Launch "Reps" from your home screen — it runs fullscreen like a native app, offline included.

> Data lives in that installed app's local storage. Deleting the icon deletes your data — an export/backup feature is a good next step.
