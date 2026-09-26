import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { softShadow } from '@/theme/tokens';

type Tone = 'surface' | 'primary' | 'lavender' | 'peach' | 'support';

const tones: Record<Tone, string> = {
  surface: 'bg-surface border-line',
  primary: 'bg-primary-soft border-transparent',
  lavender: 'bg-lavender-soft border-transparent',
  peach: 'bg-peach-soft border-transparent',
  support: 'bg-support border-support-line',
};

interface Props {
  children: ReactNode;
  tone?: Tone;
  onPress?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** A soft, generously rounded surface. Tappable cards ease down slightly on press. */
export function Card({ children, tone = 'surface', onPress, className, style, accessibilityLabel }: Props) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const body = (
    <View
      className={cn('rounded-[26px] border p-5', tones[tone], className)}
      style={[tone === 'surface' ? softShadow : undefined, style]}>
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Animated.View style={animated}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={() => {
          if (!reduce) scale.value = withTiming(0.985, { duration: 150 });
        }}
        onPressOut={() => {
          if (!reduce) scale.value = withTiming(1, { duration: 220 });
        }}>
        {body}
      </Pressable>
    </Animated.View>
  );
}
