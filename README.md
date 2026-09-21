# Grind — Personal Workout Tracker

A single-user PWA for tracking a Push/Pull/Legs routine, meals and calories. Static site (no build step) hosted on Vercel, with data stored in Firebase (Firestore + Auth).

## Files
- `index.html` — app shell, styles and modals
- `app.js` — all app logic (ES module)
- `data.js` — default PPL workout plan and meal plan
- `firebase.js` — Firebase initialisation (`db`, `auth`)
- `manifest.json` — PWA config
- `vercel.json` — Vercel config (SPA rewrite, no-cache headers)

## Features
- Today's workout loaded by day of week; log weight and reps per set
- Weight/reps pre-filled from your last logged session (full history, falling back to your best)
- Rest timer after each set (60 s) that keeps counting while the app is in the background
- Workout timer with start/pause/finish that survives closing the app
- PR detection per exercise
- Meal logging with quantities, custom meals, protein and calorie totals, calories burned
- Weekly summary and per-exercise weight progress chart
- Edit or add exercises for any day

## How data is stored
- One Firestore document: `users/default` (logs, nutrition, bests, daily snapshots, workout plan, body weight).
- Writes only touch today's entries (`updateDoc` with field paths), so an old tab or device can't overwrite past history.
- Set inputs are saved after a short debounce and also on app background / page hide. A local copy of today's log is kept in `localStorage` as a safety net.
- Firestore documents are limited to 1 MB, so old days can be moved to `users/default/archive/YYYY-MM` (see below).

## Archiving old data
Days older than 75 days can be moved out of the main document. It only runs when asked, via the URL:
1. Add the archive rule above in Firestore (needed once).
2. Open the app at `/?archive=copy` — copies old months to the archive and verifies each one by reading it back. Nothing is removed.
3. Once that reports success, open `/?archive=move` — repeats the verified copy, then asks to confirm before removing those days from the main document. If any check fails, nothing is removed.
Run it every few months. The app itself only reads recent days plus your saved bests, so archived data doesn't affect the screens.

## Sign-in and security
The app requires Firebase email/password sign-in. Firestore rules must only allow your own account:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/default {
      allow read, write: if request.auth != null
                         && request.auth.uid == 'YOUR_UID';
    }
    match /users/default/archive/{month} {
      allow read, write: if request.auth != null
                         && request.auth.uid == 'YOUR_UID';
    }
  }
}
```

Setup: Firebase console → Authentication → enable Email/Password → add your user → copy its UID into the rule above. Never leave the rules as `allow read, write: if true`.

The Firebase web config in `firebase.js` is public by design; access is controlled by the rules.

## Deploy
The repo is connected to Vercel: pushing to `main` deploys to production, and other branches get preview deployments. **Previews use the same production database.**

## Add to iPhone home screen
Open the site in Safari → Share → Add to Home Screen.
