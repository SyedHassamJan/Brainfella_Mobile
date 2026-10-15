import { Stack } from 'expo-router';

import { TourProvider } from '@/tour/TourProvider';

/**
 * The tabs sit at the bottom of the stack; everything else opens on top of them with a soft fade.
 * The guided tour wraps it all so its overlay can sit above any patient screen.
 */
export default function PatientLayout() {
  return (
    <TourProvider>
    <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', animationDuration: 260 }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      {/* The breathing space eases in slowly, like dimming the lights. */}
      <Stack.Screen name="breathe" options={{ animation: 'fade', animationDuration: 600 }} />
    </Stack>
    </TourProvider>
  );
}
