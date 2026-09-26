import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { REQUEST_TIMEOUT_MS } from '@/lib/config';

export interface AuthDeps {
  baseURL: string;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  /** Called with the rotated token pair after a successful refresh. */
  onTokens: (accessToken: string, refreshToken: string) => void;
  /** Called only when the server rejects the refresh token: the session is truly over. */
  onSessionExpired: () => void;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Requests that must never trigger a refresh (a 401 there is a real answer, e.g. wrong password).
const AUTH_PATHS = ['/auth/signin', '/auth/signup', '/auth/refresh'];
const isAuthPath = (url?: string) => !!url && AUTH_PATHS.some((p) => url.startsWith(p));

/**
 * Axios instance with:
 *  - bearer-token injection
 *  - silent token refresh on 401, with ONE refresh in flight however many
 *    requests fail at once (the others wait for it, then retry with the new token)
 *  - refresh-token rotation (the backend issues a new pair on every refresh)
 *
 * Differences from the web client, on purpose:
 *  - the refresh token is sent as the JSON body field `refresh`, which is what
 *    the backend's refresh strategy actually reads
 *  - a failed sign-in (401) is just an error to show, not a reason to wipe state
 *  - being offline during a refresh does NOT sign the user out; only a
 *    server-side rejection (401/403) does
 */
export function createApiClient(deps: AuthDeps): AxiosInstance {
  const api = axios.create({
    baseURL: deps.baseURL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Content-Type': 'application/json' },
  });

  api.interceptors.request.use((config) => {
    const token = deps.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  let refreshing: Promise<string> | null = null;

  const refreshTokens = (): Promise<string> => {
    if (!refreshing) {
      refreshing = (async () => {
        const refresh = deps.getRefreshToken();
        if (!refresh) throw new SessionEnded();
        try {
          // Bare axios: this call must not go through the interceptors above.
          const res = await axios.post<{ accessToken: string; refreshToken: string }>(
            `${deps.baseURL}/auth/refresh`,
            { refresh },
            { timeout: REQUEST_TIMEOUT_MS },
          );
          deps.onTokens(res.data.accessToken, res.data.refreshToken);
          return res.data.accessToken;
        } catch (error) {
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;
          if (status === 401 || status === 403) throw new SessionEnded();
          throw error; // offline / server error: keep the session, just fail this request
        }
      })().finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  };

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config as RetriableConfig | undefined;
      if (error.response?.status !== 401 || !original || original._retry || isAuthPath(original.url)) {
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        const token = await refreshTokens();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        if (refreshError instanceof SessionEnded) deps.onSessionExpired();
        return Promise.reject(error);
      }
    },
  );

  return api;
}

class SessionEnded extends Error {
  constructor() {
    super('session ended');
  }
}
