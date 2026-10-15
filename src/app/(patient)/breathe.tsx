import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/controls';
import { Fade, Reveal } from '@/components/ui/motion';
import { Text } from '@/components/ui/Text';
import {
  BREATH_PATTERNS,
  cyclesForMinutes,
  orbTarget,
  PHASE_LABEL,
  SESSION_MINUTES,
  type BreathPattern,
  type BreathPhaseKind,
} from '@/lib/breathing';
import { useAppTheme } from '@/theme/ThemeProvider';

type Stage = 'setup' | 'running' | 'done';

const ORB = 250;

/** The circle: grows on the in-breath, stays on holds, shrinks on the out-breath. */
function Orb({ progress, reduce }: { progress: { value: number }; reduce: boolean }) {
  const { colors } = useAppTheme();
  const glow = useAnimatedStyle(() => ({
    transform: [{ scale: reduce ? 1 : 0.62 + progress.value * 0.38 }],
    opacity: 0.3 + progress.value * 0.35,
  }));
  const core = useAnimatedStyle(() => ({
    transform: [{ scale: reduce ? 1 : 0.5 + progress.value * 0.4 }],
    opacity: reduce ? 0.5 + progress.value * 0.5 : 0.9,
  }));
  return (
    <View style={{ width: ORB, height: ORB, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[{ position: 'absolute', width: ORB, height: ORB, borderRadius: ORB / 2, backgroundColor: colors.primarySoft }, glow]} />
      <Animated.View style={[{ width: ORB * 0.66, height: ORB * 0.66, borderRadius: ORB, backgroundColor: colors.primary }, core]} />
    </View>
  );
}

export default function BreatheScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const reduce = !!useReducedMotion();

  const [stage, setStage] = useState<Stage>('setup');
  const [pattern, setPattern] = useState<BreathPattern>(BREATH_PATTERNS[0]);
  const [minutes, setMinutes] = useState<number | null>(3);
  const [haptics, setHaptics] = useState(true);
  const [phase, setPhase] = useState<BreathPhaseKind>('in');
  const [spentSeconds, setSpentSeconds] = useState(0);

  const progress = useSharedValue(0);
  const last = useRef(0);
  const startedAt = useRef(0);

  const finish = useCallback(() => {
    setSpentSeconds(Math.round((Date.now() - startedAt.current) / 1000));
    setStage('done');
  }, []);

  useEffect(() => {
    if (stage !== 'running') return;
    const phases = pattern.phases;
    const totalCycles = minutes == null ? null : cyclesForMinutes(pattern, minutes);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let i = 0;

    const step = () => {
      if (cancelled) return;
      const ph = phases[i % phases.length];
      setPhase(ph.kind);
      const target = orbTarget(ph.kind, last.current);
      if (target !== last.current) {
        progress.value = withTiming(target, { duration: ph.seconds * 1000, easing: Easing.inOut(Easing.sin) });
        last.current = target;
        if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
      }
      timer = setTimeout(() => {
        i += 1;
        if (totalCycles != null && i >= totalCycles * phases.length) {
          finish();
          return;
        }
        step();
      }, ph.seconds * 1000);
    };
    step();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [stage, pattern, minutes, haptics, progress, finish]);

  const begin = () => {
    progress.value = 0;
    last.current = 0;
    startedAt.current = Date.now();
    setPhase('in');
    setStage('running');
  };

  const again = () => {
    progress.value = withTiming(0, { duration: 400 });
    last.current = 0;
    setStage('setup');
  };

  const spentMinutes = Math.max(1, Math.round(spentSeconds / 60));

  return (
    <AmbientBackground scene="water">
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 24 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave breathing space"
          hitSlop={10}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface">
          <ChevronLeft size={22} color={colors.inkSoft} strokeWidth={1.7} />
        </Pressable>
      </View>

      {stage === 'setup' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: insets.bottom + 32, gap: 22 }}>
          <Reveal index={0}>
            <View className="gap-2">
              <Text variant="title">Let’s slow down</Text>
              <Text variant="body" className="text-ink-soft">
                Follow the circle. There is no right or wrong, and you can stop whenever you like.
              </Text>
            </View>
          </Reveal>

          <Reveal index={1}>
            <View className="gap-3">
              <Text variant="label">A RHYTHM</Text>
              {BREATH_PATTERNS.map((p) => (
                <Card key={p.id} tone={p.id === pattern.id ? 'primary' : 'surface'} onPress={() => setPattern(p)} accessibilityLabel={p.name} className="gap-1">
                  <Text variant="bodyStrong">{p.name}</Text>
                  <Text variant="small">{p.blurb}</Text>
                </Card>
              ))}
            </View>
          </Reveal>

          <Reveal index={2}>
            <View className="gap-3">
              <Text variant="label">FOR HOW LONG</Text>
              <View className="flex-row flex-wrap gap-2">
                {SESSION_MINUTES.map((m) => (
                  <Chip key={String(m)} label={m == null ? 'As long as I like' : `${m} min`} selected={minutes === m} onPress={() => setMinutes(m)} />
                ))}
              </View>
            </View>
          </Reveal>

          <Reveal index={3}>
            <View className="flex-row items-center gap-3">
              <Chip label={haptics ? 'Soft vibration: on' : 'Soft vibration: off'} selected={haptics} onPress={() => setHaptics((v) => !v)} />
            </View>
          </Reveal>

          <Reveal index={4}>
            <Button title="Begin" onPress={begin} />
          </Reveal>
        </ScrollView>
      ) : null}

      {stage === 'running' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingBottom: insets.bottom + 28, paddingHorizontal: 24 }}>
          <View />
          <View className="items-center gap-8">
            <Orb progress={progress} reduce={reduce} />
            <Fade key={phase}>
              <Text variant="title" className="text-center" accessibilityLiveRegion="polite">
                {PHASE_LABEL[phase]}
              </Text>
            </Fade>
          </View>
          <Button title="I’m done for now" variant="ghost" onPress={finish} />
        </View>
      ) : null}

      {stage === 'done' ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: insets.bottom + 28, gap: 28 }}>
          <Reveal index={0}>
            <View className="items-center gap-3">
              <Text variant="title" className="text-center">
                That was time for you
              </Text>
              <Text variant="body" className="text-center text-ink-soft">
                {spentSeconds < 30 ? 'Even a few breaths count.' : `You spent about ${spentMinutes} ${spentMinutes === 1 ? 'minute' : 'minutes'} just breathing. Notice how you feel now.`}
              </Text>
            </View>
          </Reveal>
          <Reveal index={1}>
            <View className="gap-3">
              <Button title="Back to my day" onPress={() => router.back()} />
              <Button title="Breathe again" variant="soft" onPress={again} />
            </View>
          </Reveal>
        </View>
      ) : null}
    </AmbientBackground>
  );
}
