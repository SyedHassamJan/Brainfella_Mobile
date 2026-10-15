import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { BreathingOrb } from '@/components/ui/feedback';
import { Text } from '@/components/ui/Text';

const PHASE_MS = 4000;

/**
 * A quiet invitation to slow down: a softly breathing circle that follows a
 * 4-second in / 4-second out rhythm. It never asks anything of the person.
 */
export function BreathePrompt() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [inhale, setInhale] = useState(true);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setInhale((v) => !v), PHASE_MS);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <Card tone="primary" onPress={() => router.push('/breathe')} accessibilityLabel="Open the breathing space">
      <View className="flex-row items-center gap-5">
        <BreathingOrb size={84} />
        <View className="flex-1 gap-1.5">
          <Text variant="label" className="text-primary-strong">
            TAKE A MOMENT
          </Text>
          <Text variant="heading">{reduce ? 'Breathe slowly' : inhale ? 'Breathe in…' : 'Breathe out…'}</Text>
          <Text variant="small">Let your shoulders drop. Tap to breathe together, whenever you’re ready.</Text>
        </View>
      </View>
    </Card>
  );
}
