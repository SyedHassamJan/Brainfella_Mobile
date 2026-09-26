import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';

/**
 * Gentle entrance: a slow fade with a tiny rise, never a bounce or a slide-in.
 * `index` staggers siblings by a fraction of a second so a screen settles in
 * rather than appearing all at once. Skipped entirely when the phone's
 * "reduce motion" setting is on.
 *
 * These wrappers take a plain `style` (no className) on purpose: put
 * className-styled Views INSIDE them.
 */
export function Reveal({
  children,
  index = 0,
  style,
}: {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <Animated.View style={style}>{children}</Animated.View>;
  return (
    <Animated.View
      entering={FadeInDown.duration(650)
        .delay(Math.min(index, 8) * 90)
        .easing(Easing.out(Easing.cubic))
        .withInitialValues({ transform: [{ translateY: 10 }] })}
      style={style}>
      {children}
    </Animated.View>
  );
}

/** Plain fade, for content that should not move at all (lists, chat bubbles). */
export function Fade({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  return (
    <Animated.View entering={reduce ? undefined : FadeIn.duration(500)} style={style}>
      {children}
    </Animated.View>
  );
}
