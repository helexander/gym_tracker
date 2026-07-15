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

React 18 + TypeScript + Vite. No backend — state persists to `localStorage`. A small service worker caches the app shell for offline use.

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
