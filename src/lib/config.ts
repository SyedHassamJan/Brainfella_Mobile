/**
 * Base URL of the BrainHealth API. Set EXPO_PUBLIC_API_URL in `.env` to the LAN
 * address of the PC running the backend (e.g. http://192.168.100.20:8001) when
 * testing on a physical phone: `localhost` there means the phone itself.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8001').replace(/\/+$/, '');

/** Kept in one place so every crisis surface shows the same, correct number. */
export const HELPLINE = { name: 'Umang', number: '0317-4288665' } as const;

export const REQUEST_TIMEOUT_MS = 15_000;
