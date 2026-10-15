import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import { useAppTheme } from '@/theme/ThemeProvider';
import { glowShadow } from '@/theme/tokens';

import { Text } from './Text';

type Variant = 'primary' | 'soft' | 'ghost' | 'support';

const container: Record<Variant, string> = {
  primary: '',
  soft: 'bg-primary-soft',
  ghost: 'bg-transparent border border-line',
  support: 'bg-peach-soft border border-support-line',
};
const label: Record<Variant, string> = {
  primary: 'text-primary-ink',
  soft: 'text-primary-strong',
  ghost: 'text-ink',
  support: 'text-support-ink',
};

interface Props extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  /** Full-width by default (the natural shape for a single main action). */
  compact?: boolean;
}

/**
 * Soft, rounded, unhurried button. Presses ease down to 98% over 150 ms; a very
 * light haptic confirms the tap. Disabled and loading states dim rather than
 * turn grey-and-harsh.
 */
export function Button({ title, variant = 'primary', loading, disabled, icon, compact, onPress, ...rest }: Props) {
  const { colors } = useAppTheme();
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const inactive = disabled || loading;

  return (
    <Animated.View style={[animated, compact ? { alignSelf: 'flex-start' } : undefined]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!inactive, busy: !!loading }}
        disabled={inactive}
        onPressIn={() => {
          if (!reduce) scale.value = withTiming(0.98, { duration: 150 });
        }}
        onPressOut={() => {
          if (!reduce) scale.value = withTiming(1, { duration: 200 });
        }}
        onPress={(e) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress?.(e);
        }}
        {...rest}>
        <View className={cn('rounded-full', inactive && 'opacity-55')} style={variant === 'primary' && !inactive ? glowShadow : undefined}>
          <View className={cn('min-h-[54px] flex-row items-center justify-center gap-2 overflow-hidden rounded-full px-7', container[variant])}>
            {variant === 'primary' ? (
              <LinearGradient
                pointerEvents="none"
                colors={[colors.primary, colors.primaryStrong]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
            ) : null}
            {loading ? (
              <ActivityIndicator color={variant === 'primary' ? colors.primaryInk : colors.primary} />
            ) : (
              <>
                {icon}
                <Text variant="bodyStrong" className={label[variant]}>
                  {title}
                </Text>
              </>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
