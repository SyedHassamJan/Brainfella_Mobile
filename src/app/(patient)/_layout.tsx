import { Stack } from 'expo-router';

/** The tabs sit at the bottom of the stack; everything else opens on top of them with a soft fade. */
export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', animationDuration: 260 }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}
