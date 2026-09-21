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
- Firestore documents are limited to 1 MB, so very old history will eventually need archiving.

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
  }
}
```

Setup: Firebase console → Authentication → enable Email/Password → add your user → copy its UID into the rule above. Never leave the rules as `allow read, write: if true`.

The Firebase web config in `firebase.js` is public by design; access is controlled by the rules.

## Deploy
The repo is connected to Vercel: pushing to `main` deploys to production, and other branches get preview deployments. **Previews use the same production database.**

## Add to iPhone home screen
Open the site in Safari → Share → Add to Home Screen.
