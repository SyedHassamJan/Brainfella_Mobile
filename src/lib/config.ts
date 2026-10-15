import Constants from 'expo-constants';

const API_PORT = 8001;

/**
 * Where the BrainHealth API lives.
 *
 * In development the phone loads the app from Metro on the PC, so the address
 * it used for that (e.g. 192.168.100.20:8081, or 192.168.137.1:8081 on the PC's
 * hotspot) is the PC's current address: the API is on the same machine, port 8001.
 * Using it means Wi-Fi changes, hotspots and new IPs never need a `.env` edit.
 *
 * EXPO_PUBLIC_API_URL is still used for production builds, for a tunnel
 * (*.exp.direct cannot reach the PC's port 8001), or when the host is unknown.
 */
export function resolveApiUrl({ dev, hostUri, envUrl }: { dev: boolean; hostUri?: string | null; envUrl?: string }): string {
  const host = hostUri?.split(':')[0];
  if (dev && host && !host.endsWith('.exp.direct')) return `http://${host}:${API_PORT}`;
  return (envUrl ?? `http://localhost:${API_PORT}`).replace(/\/+$/, '');
}

export const API_URL = resolveApiUrl({
  dev: __DEV__,
  hostUri: Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost,
  envUrl: process.env.EXPO_PUBLIC_API_URL,
});

/** Kept in one place so every crisis surface shows the same, correct number. */
export const HELPLINE = { name: 'Umang', number: '0317-4288665' } as const;

export const REQUEST_TIMEOUT_MS = 15_000;
