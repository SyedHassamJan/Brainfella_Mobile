# BrainHealth Mobile — AI coding context

React Native (Expo SDK 57) app for the NestJS API in `../backend`. Read `../SYSTEM_DOCUMENTATION.md` for the API, RBAC and data model, and `README.md` here for run instructions and structure.

## Hard rules

- **Patient-only.** Do not build therapist, guardian or admin screens or login paths here (decision by the user). Non-patients are declined at sign-in (`requirePatient` in `src/hooks/auth.ts`); the auth store refuses to hold a non-patient session. Therapist alerts live in the web app.
- **Design intent is calm.** Users may be anxious or distressed: soft colors, generous whitespace, gentle motion, nothing busy or alarming. No red on support/crisis surfaces; crisis help is warm ("You're not alone" + a call button). Every animation must respect `useReducedMotion`. Ask the user to review the look on their phone after each phase; you cannot see the screen.
- **Never present screening or AI output as a diagnosis** (screening features come later; the rule is the same across the project).
- **Nothing that matters may fail silently**, especially journal saves and chat messages that may contain a crisis signal: show the error, keep the user's text, offer retry.
- Styling is **NativeWind v5 RC** (Tailwind 4). Versions are pinned exactly; do not upgrade `nativewind`, `react-native-css`, `tailwindcss` independently. Tokens live in `src/global.css` (`@theme` + `:root`) AND `src/theme/tokens.ts`; keep them in sync. Text color is not inherited in RN, so every `Text` carries its own color class (the `Text` component does this).
- Do not put `className` on Reanimated `Animated.*` components; use `style` there and put className-styled Views inside.
- Custom fonts are one family per weight (see `fonts` in tokens). Do not rely on `fontWeight`.

## API facts that differ from what you might assume

- `/auth/refresh` reads the refresh token from the JSON body field `refresh` (not a Bearer header).
- Signup has no `role` field (everyone becomes a PATIENT); it returns no tokens, so sign in right after.
- Journal: `content` has no minimum length (just non-empty); `title` is at most 100 characters (enforced in `JournalForm`).
- `PATCH /user/profile` returns only base user fields; refetch `/user/profile` for the sub-profile. `patientProfile.dateOfBirth` may be a bare date or a full ISO timestamp; a nonsense value is a 400.
- Booking uses the therapist's **user** id (`therapist.user.id`); reviews use the **profile** id (`therapist.id`).
- Notification and journal payloads can contain an alarm emoji (crisis); the UI softens it.
- When a patient triggers a crisis flag, their linked therapists (CONFIRMED/COMPLETED appointment) are also alerted with a `CRISIS_ALERT` notification (name + kind of input, never the content). The sign-up consent line tells patients this; keep the wording in sync if the behaviour changes.

## Testing

`npm test` (offline unit tests), `npm run typecheck`, `npx expo-doctor`, `npx expo export --platform android` (proves the whole app bundles). The live contract test (`test/live`) needs a running backend; clean up with `node test/live/cleanup.js`. Nothing here can verify how the app looks or feels on a device.

## Workflow

Build in phases and stop for the user's review after each. Ask before committing/pushing; commit identity for this project is `SyedHassamJan <papagator0012@gmail.com>` (set locally per repo, not globally).
