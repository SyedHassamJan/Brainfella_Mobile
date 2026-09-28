import { HeartHandshake, Leaf, RefreshCw } from 'lucide-react-native';
import type { ComponentType, ReactNode } from 'react';
import { Linking, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { HELPLINE } from '@/lib/config';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/theme/ThemeProvider';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** A slow, calming "breathing" circle. Used for loading instead of a jittery spinner. */
export function BreathingOrb({ size = 72 }: { size?: number }) {
  const { colors } = useAppTheme();
  const reduce = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(
      withSequence(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.sin) })),
      -1,
    );
  }, [reduce, t]);

  const outer = useAnimatedStyle(() => ({ transform: [{ scale: 0.86 + t.value * 0.26 }], opacity: 0.35 + t.value * 0.25 }));
  const inner = useAnimatedStyle(() => ({ transform: [{ scale: 0.9 + t.value * 0.12 }] }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }, outer]} />
      <Animated.View style={[{ width: size * 0.55, height: size * 0.55, borderRadius: size, backgroundColor: colors.primary, opacity: 0.85 }, inner]} />
    </View>
  );
}

export function LoadingState({ label = 'One moment…' }: { label?: string }) {
  return (
    <View className="items-center gap-4 py-16" accessibilityRole="progressbar" accessibilityLabel={label}>
      <BreathingOrb />
      <Text variant="small">{label}</Text>
    </View>
  );
}

export function IconBubble({ icon: Icon, tone = 'primary', size = 44 }: { icon: IconType; tone?: 'primary' | 'lavender' | 'peach' | 'sage' | 'rose'; size?: number }) {
  const { colors } = useAppTheme();
  const bg = { primary: colors.primarySoft, lavender: colors.lavenderSoft, peach: colors.peachSoft, sage: colors.sageSoft, rose: colors.roseSoft }[tone];
  const fg = { primary: colors.primaryStrong, lavender: colors.lavender, peach: colors.supportInk, sage: colors.sage, rose: colors.rose }[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.48} color={fg} strokeWidth={1.7} />
    </View>
  );
}

export function EmptyState({
  icon = Leaf,
  title,
  message,
  action,
}: {
  icon?: IconType;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center gap-4 px-6 py-14">
      <IconBubble icon={icon} size={64} />
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {message ? (
        <Text variant="small" className="text-center">
          {message}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

/** A soft, non-alarming error: says what happened kindly and offers to try again. */
export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Card tone="peach" className="gap-3">
      <Text variant="body" className="text-support-ink">
        {message}
      </Text>
      {onRetry ? (
        <Button title="Try again" variant="support" compact onPress={onRetry} icon={<RefreshCw size={16} color={colors.supportInk} strokeWidth={1.8} />} />
      ) : null}
    </Card>
  );
}

/**
 * Crisis support, offered warmly: soft peach, a heart, plain kind words, and one
 * clear way to reach a person. Deliberately NOT red and not shouty.
 */
export function SupportBanner({ title = "You're not alone", message }: { title?: string; message?: string }) {
  const { colors } = useAppTheme();
  return (
    <Card tone="support" className="gap-4">
      <View className="flex-row items-center gap-3">
        <IconBubble icon={HeartHandshake} tone="peach" />
        <Text variant="heading" className="flex-1 text-support-ink">
          {title}
        </Text>
      </View>
      <Text variant="body" className="text-support-ink">
        {message ?? 'It sounds like things feel really heavy right now. Talking to someone can help, and there are people who want to listen.'}
      </Text>
      <Button
        title={`Call ${HELPLINE.name} · ${HELPLINE.number}`}
        variant="support"
        onPress={() => Linking.openURL(`tel:${HELPLINE.number.replace(/\D/g, '')}`)}
      />
      <Text variant="small" className={cn('text-support-ink')} style={{ opacity: 0.8 }}>
        If you are in immediate danger, please contact your local emergency number.
      </Text>
    </Card>
  );
}
