import { API_URL } from '@/lib/config';
import { useAuthStore } from '@/store/authStore';

import { createApiClient } from './client';

/** The app-wide API client, wired to the auth store. */
const api = createApiClient({
  baseURL: API_URL,
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokens: (accessToken, refreshToken) => useAuthStore.getState().setTokens(accessToken, refreshToken),
  onSessionExpired: () => useAuthStore.getState().logout('expired'),
});

export default api;
