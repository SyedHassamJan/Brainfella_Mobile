import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AMBIENT_PALETTES, type AmbientScene } from '@/constants/ambient';
import { useAppTheme } from '@/theme/ThemeProvider';

type Size = { w: number; h: number };

/** A looping 0→1 value that restarts after `delay`. Stays at rest when `still`. */
function useLoop(duration: number, delay: number, still: boolean, yoyo = false) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (still) {
      t.value = 0;
      return;
    }
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, yoyo));
    return () => cancelAnimation(t);
  }, [still, duration, delay, yoyo, t]);
  return t;
}

/** A soft glow built from stacked circles, so it has no hard edge and needs no blur. */
function Glow({ x, y, size, color, duration, delay, drift, still }: { x: number; y: number; size: number; color: string; duration: number; delay: number; drift: number; still: boolean }) {
  const t = useLoop(duration, delay, still, true);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (t.value - 0.5) * drift }, { translateY: (0.5 - t.value) * drift * 0.7 }, { scale: 0.94 + t.value * 0.12 }],
  }));
  const layers = [1, 0.72, 0.46];
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size }, style]}>
      {layers.map((k, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: (size * (1 - k)) / 2,
            top: (size * (1 - k)) / 2,
            width: size * k,
            height: size * k,
            borderRadius: size,
            backgroundColor: color,
            opacity: 0.16,
          }}
        />
      ))}
    </Animated.View>
  );
}

/** One expanding, fading ring, like a drop landing on still water. */
function Ripple({ x, y, max, color, delay, still }: { x: number; y: number; max: number; color: string; delay: number; still: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (still) {
      t.value = 0.5;
      return;
    }
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 7000, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(t);
  }, [still, delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - t.value),
    transform: [{ scale: 0.15 + t.value * 0.85 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x - max / 2, top: y - max / 2, width: max, height: max, borderRadius: max, borderWidth: 1.5, borderColor: color }, style]}
    />
  );
}

/** A slow, faint streak falling down the screen. */
function Droplet({ x, h, len, color, duration, delay, still }: { x: number; h: number; len: number; color: string; duration: number; delay: number; still: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (still) {
      t.value = 0.4;
      return;
    }
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(t);
  }, [still, duration, delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * Math.sin(Math.PI * t.value),
    transform: [{ translateY: -len + t.value * (h + len * 2) }],
  }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: 0, width: 2, height: len, borderRadius: 2, backgroundColor: color }, style]} />;
}

/** A wide soft band of mist drifting sideways. */
function Mist({ y, w, height, color, duration, delay, still }: { y: number; w: number; height: number; color: string; duration: number; delay: number; still: boolean }) {
  const t = useLoop(duration, delay, still, true);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + t.value * 0.25,
    transform: [{ translateX: (t.value - 0.5) * w * 0.35 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: -w * 0.25, top: y, width: w * 1.5, height, borderRadius: height, backgroundColor: color, opacity: 0.4 }, style]}
    />
  );
}

function SceneLayer({ scene, size, accent, still }: { scene: AmbientScene; size: Size; accent: string; still: boolean }) {
  const { w, h } = size;
  if (scene === 'water') {
    return (
      <>
        <Ripple x={w * 0.3} y={h * 0.38} max={w * 0.9} color={accent} delay={0} still={still} />
        <Ripple x={w * 0.3} y={h * 0.38} max={w * 0.9} color={accent} delay={2300} still={still} />
        <Ripple x={w * 0.3} y={h * 0.38} max={w * 0.9} color={accent} delay={4600} still={still} />
        <Ripple x={w * 0.74} y={h * 0.66} max={w * 0.7} color={accent} delay={1200} still={still} />
        <Ripple x={w * 0.74} y={h * 0.66} max={w * 0.7} color={accent} delay={3700} still={still} />
      </>
    );
  }
  if (scene === 'rain') {
    // Fixed spread so the layout is stable between renders.
    const drops = Array.from({ length: 16 }, (_, i) => ({
      x: ((i * 0.6180339) % 1) * (w - 8) + 4,
      len: 44 + ((i * 7) % 5) * 12,
      duration: 7000 + ((i * 3) % 6) * 1100,
      delay: (i * 640) % 6000,
    }));
    return (
      <>
        {drops.map((d, i) => (
          <Droplet key={i} x={d.x} h={h} len={d.len} color={accent} duration={d.duration} delay={d.delay} still={still} />
        ))}
      </>
    );
  }
  return (
    <>
      <Mist y={h * 0.5} w={w} height={h * 0.16} color={accent} duration={16000} delay={0} still={still} />
      <Mist y={h * 0.64} w={w} height={h * 0.2} color={accent} duration={21000} delay={3000} still={still} />
      <Mist y={h * 0.8} w={w} height={h * 0.18} color={accent} duration={18000} delay={6000} still={still} />
    </>
  );
}

/**
 * A calm, living backdrop behind a screen's content, drawn entirely in code (no
 * video files): a soft gradient, slowly drifting glows, and one gentle scene
 * (ripples on water, slow rain, drifting mist). Everything is faint so text
 * stays easy to read. With "reduce motion" on it is a still gradient.
 *
 * Use on spaces meant for rest (breathing, welcome). Keep forms and results on
 * the plain canvas: moving imagery behind dense text is tiring.
 */
export function AmbientBackground({ scene, children }: { scene: AmbientScene; children: ReactNode }) {
  const { colors, scheme } = useAppTheme();
  const reduce = !!useReducedMotion();
  const { width, height } = useWindowDimensions();
  const palette = AMBIENT_PALETTES[scene][scheme];
  const size = { w: width, h: height };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={palette.sky} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <Glow x={width * 0.18} y={height * 0.2} size={width * 0.95} color={palette.glow} duration={13000} delay={0} drift={width * 0.18} still={reduce} />
        <Glow x={width * 0.88} y={height * 0.78} size={width * 1.1} color={palette.glow} duration={17000} delay={2500} drift={width * 0.22} still={reduce} />
        <SceneLayer scene={scene} size={size} accent={palette.accent} still={reduce} />
      </View>
      {children}
    </View>
  );
}
