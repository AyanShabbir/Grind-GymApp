# CLAUDE.md

Grind is a single-user workout/meal tracker PWA. Plain static files, no build step, no package.json. Deployed on Vercel from GitHub (`main` = production). **The database is production data with no backups — be careful.**

## Layout
- `index.html` — markup, CSS and modals (inline `onclick` handlers call functions on `window`)
- `app.js` — all logic, loaded as an ES module. Anything called from HTML must be assigned to `window.*`
- `data.js` — `WORKOUT_PLAN` and `MEAL_PLAN` defaults
- `firebase.js` — exports `db` and `auth` (Firebase 10.12.0 loaded from the gstatic CDN)

## Data model (Firestore `users/default`, one document)
- `logs[YYYY-MM-DD]` → `{ workoutDone, duration, sets, prs[], cardioMinutes, exercises: { [exId]: [ {weight, reps, done} ] } }`
- `nutrition[date]` → `{ protein, calories, burned, meals[], customMeals[], mealQuantities{} }` (`mealQuantities` is keyed by index into `MEAL_PLAN` — don't reorder `MEAL_PLAN`)
- `bests[exId]`, `dailySnapshots[date]`, `userWeight` (kg), `workoutPlan`
- `workoutPlan` is stored in the DB and only seeded from `data.js` when missing. **Editing `data.js` does not change existing users' plan.**
- Firestore turns sparse arrays into `null` holes; always read sets with `s?.done`.

## Rules to follow
- Never write the whole state with `setDoc`. `save()` uses `updateDoc` with field paths for today's date only. If you add new top-level state, add it to the patch in `doSave()`; if you edit `workoutPlan`, set `planDirty = true`.
- Use `scheduleSave()` for high-frequency input; `save()` for discrete actions.
- Escape user-entered text with `escapeHtml()` before putting it in `innerHTML`.
- Dates are local-time `YYYY-MM-DD` via `today()` / `dateKey()`. Don't use `toISOString()` (UTC shifts the day).
- Timers use absolute timestamps (`restEndAt`, `workoutStart`) plus `localStorage` so they survive backgrounding and app kills.
- Firestore security rules must restrict `users/default` to the owner's UID. Don't weaken them.
- Don't test against production data without saying so: previews and local runs use the same database.

## Known limitations / ideas
- Whole history is in one doc (1 MB cap). Planned fix: archive old months to `users/default/archive/{YYYY-MM}` (needs a rules update; only delete from the main doc after verifying the archive).
- No service worker / offline support (intentional).
- Weights are labelled lb; body weight is kg.

## Checking changes
There are no tests. At minimum run `node --input-type=module --check < app.js`. For refactors that shouldn't change behaviour, compare `npx esbuild --minify` output before and after.
