import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { SupportBanner } from '@/components/ui/feedback';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { ChatMessage } from '@/types';

/** The API's crisis reply carries an alarm emoji and markdown; show it as plain, warm words. */
export function softenCrisisText(text: string): string {
  return text.replace(/🚨\s*/g, '').replace(/\*\*/g, '').trim();
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.role === 'user';

  if (!mine && message.isCrisis) {
    return (
      <View className="w-full">
        <SupportBanner title="We're here with you" message={softenCrisisText(message.content)} />
      </View>
    );
  }

  return (
    <View className={cn('w-full', mine ? 'items-end' : 'items-start')}>
      <View
        className={cn('max-w-[86%] px-4 py-3', mine ? 'rounded-[22px] rounded-br-lg bg-primary-soft' : 'rounded-[22px] rounded-bl-lg bg-lavender-soft')}>
        <Text variant="body" selectable>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

function Dot({ delay }: { delay: number }) {
  const { colors } = useAppTheme();
  const reduce = useReducedMotion();
  const o = useSharedValue(0.35);
  useEffect(() => {
    if (reduce) return;
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sin) }), withTiming(0.35, { duration: 500, easing: Easing.inOut(Easing.sin) })), -1));
  }, [delay, o, reduce]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inkFaint }, style]} />;
}

/** Three slow-pulsing dots while the companion is replying. */
export function TypingBubble() {
  return (
    <View className="w-full items-start">
      <View className="flex-row items-center gap-1.5 rounded-[22px] rounded-bl-lg bg-lavender-soft px-5 py-4" accessibilityLabel="The companion is typing">
        <Dot delay={0} />
        <Dot delay={180} />
        <Dot delay={360} />
      </View>
    </View>
  );
}
