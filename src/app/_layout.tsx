import '@/global.css';

import { Fraunces_400Regular, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuth } from '@/hooks/auth';
import { queryClient, wireQueryEnvironment } from '@/lib/queryClient';
import { ThemeProvider, useAppTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * The auth gate. Each group is only reachable in its own state, so a signed-out
 * person can never see app screens and a signed-in person never sees sign-in.
 * The app is patient-only: the auth store never holds a non-patient session.
 * When the state changes (sign in, sign out, expired session) the router moves
 * to the right place by itself.
 */
function Routes() {
  const { isAuthenticated } = useAuth();
  const { scheme } = useAppTheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(patient)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const { hasHydrated } = useAuth();
  const ready = fontsLoaded && hasHydrated;

  useEffect(() => wireQueryEnvironment(), []);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Hold the splash until fonts are in and the saved session has been read:
  // no flash of the wrong screen, no fallback fonts.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Routes />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
