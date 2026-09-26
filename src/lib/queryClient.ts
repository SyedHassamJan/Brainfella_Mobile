import NetInfo from '@react-native-community/netinfo';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { AppState, Platform } from 'react-native';

/** React Query knows nothing about phones: tell it when the app is foregrounded and when the network is up. */
export function wireQueryEnvironment() {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false)),
  );
  const sub = AppState.addEventListener('change', (status) => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
  });
  return () => sub.remove();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry only what can plausibly succeed later: no answer (offline/timeout) or a 5xx. Never a 4xx.
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        if (!isAxiosError(error)) return false;
        return !error.response || error.response.status >= 500;
      },
      refetchOnReconnect: true,
    },
    mutations: { retry: false },
  },
});
