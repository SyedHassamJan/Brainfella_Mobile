# BrainHealth Mobile

React Native (Expo SDK 57, Expo Router) client for the same NestJS API as the web app. **Patient-only for now:** patients get the full app; therapist, guardian and admin accounts are politely declined at sign-in and pointed to the website (see *Roles* below).

## Run it on your phone (Expo Go, same Wi-Fi as the PC)

1. Start the backend (`backend/`, port 8001).
2. Put the PC's LAN address in `.env` (copy `.env.example`): `EXPO_PUBLIC_API_URL=http://<PC-IPv4>:8001`. `localhost` on the phone means the phone itself. Find the address with `ipconfig`.
3. Windows Firewall must allow inbound TCP 8001 (API) and 8081 (Metro). In an **administrator** PowerShell:
   `New-NetFirewallRule -DisplayName "BrainHealth dev" -Direction Inbound -Protocol TCP -LocalPort 8001,8081 -Action Allow -Profile Private`
4. `npm install` (first time), then `npx expo start`, and scan the QR code with **Expo Go** (install/update it from the Play Store: it must support SDK 57).
5. Sign up in the app (new accounts are patients).

After changing `.env` or dependencies, restart with `npx expo start --clear`.

## Stack

Expo SDK 57 · React Native 0.86 · Expo Router · **NativeWind v5 release candidate** (`nativewind@5.0.0-rc.0` + `react-native-css@3.1.0-rc.0` + Tailwind 4, versions pinned exactly because the RC pair must not drift) · Zustand · TanStack Query · Axios · React Hook Form + Zod · `expo-secure-store` · Reanimated · lucide icons.

## Structure

```
src/app/            Expo Router screens
  (auth)/           sign-in, sign-up
  (patient)/        tabs (home, journal, chat, care, profile) + detail screens
src/api/            Axios client with silent token refresh (client.ts) and the app instance (index.ts)
src/store/          authStore (Zustand, persisted: tokens in SecureStore, profile in AsyncStorage)
src/hooks/          React Query hooks per resource (query-key factories, as in the web app)
src/components/ui/  design system: Text, Button, Card, TextField, feedback (support banner, breathing loader) ...
src/theme/          design tokens (light + dark) and the ThemeProvider
src/global.css      the same tokens for NativeWind (keep in sync with theme/tokens.ts)
test/live/          live contract test against a running backend
```

## Design intent

The app is for people who may be anxious or distressed, so it aims to be calming on sight: soft sage/mist/lavender/peach palette, deep blue-grey text instead of black, generous whitespace and rounding, a serif (Fraunces) for greetings and a rounded sans (Nunito) for everything else, slow gentle motion (all skipped when the phone's "reduce motion" is on), and **no red on support surfaces**: crisis help is offered warmly ("You're not alone", a call button for the Umang helpline), never as an alarm. Light and dark themes follow the phone.

## Auth

- Sign-in/sign-up use `/auth/signin` and `/auth/signup` (signup returns no tokens, so the app signs in right after).
- The two JWTs live in `expo-secure-store` as separate keys; the non-secret profile lives in AsyncStorage.
- On a 401 the client refreshes silently with `POST /auth/refresh {"refresh": <token>}` (the refresh token goes in the JSON **body** field `refresh`), stores the rotated pair, and retries. Concurrent 401s share one refresh. A refresh the server rejects ends the session; being offline during a refresh does not.
- The route groups are guarded by `Stack.Protected`, so the right screens appear as auth state changes.

## Roles

The app is **patient-only** for now. Sign-up creates patients only (the API's signup DTO has no `role` field). If a therapist, guardian or admin signs in, the app never keeps their session: it revokes the tokens the server just issued (`POST /auth/signout`) and shows "This app is for patients at the moment. Please sign in on the BrainHealth website instead." A saved non-patient session from any earlier build is discarded on launch. There are no therapist or guardian screens in the app.

Guardian linking is unchanged and optional: a patient may add a guardian's email under Profile, and the app works normally without one. The guardian receives a weekly summary by email; there is no shared login. A guardian *viewing* screen is deferred, and it would need email verification first (signup does not verify emails today, so anyone could register with a patient's guardian address and read their reports).

Therapists see patient crisis alerts on the **web app's** Notifications page (`/notifications`), not in this app.

## Tests

```
npm test                                   # unit tests: API client refresh logic, auth store, helpers
npm run typecheck
npx expo-doctor
LIVE_API_URL=http://localhost:8001 npx jest test/live   # contract test against a real backend
node test/live/cleanup.js                  # remove the throwaway users the live test creates
```

## Known limits

- Never run on a native device by the build tooling: the JS bundles and passes tests, but on-device look and behavior (keyboard handling on Android edge-to-edge, animation feel, fonts) are for a human to check.
- Google sign-in and push notifications are not built yet (next phases).
- App icon and splash image are still the Expo template's.
