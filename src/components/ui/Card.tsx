import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { useAppTheme } from '@/theme/ThemeProvider';
import { softShadow } from '@/theme/tokens';

type Tone = 'surface' | 'primary' | 'lavender' | 'peach' | 'support';

const tones: Record<Tone, string> = {
  surface: 'border-line',
  primary: 'border-transparent',
  lavender: 'border-transparent',
  peach: 'border-transparent',
  support: 'border-support-line',
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
  const { colors } = useAppTheme();
  // Two close tones at a gentle angle: depth without any visible "gradient".
  const fill: Record<Tone, [string, string]> = {
    surface: [colors.surface, colors.canvas],
    primary: [colors.primarySoft, colors.sageSoft],
    lavender: [colors.lavenderSoft, colors.primarySoft],
    peach: [colors.peachSoft, colors.support],
    support: [colors.support, colors.peachSoft],
  };
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const body = (
    <View className="rounded-[26px]" style={tone === 'surface' ? softShadow : undefined}>
      <View className={cn('overflow-hidden rounded-[26px] border p-5', tones[tone], className)} style={style}>
        <LinearGradient
          pointerEvents="none"
          colors={fill[tone]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {children}
      </View>
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
