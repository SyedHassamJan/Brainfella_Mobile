import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/auth';
import { useCompleteOnboarding, useProfile } from '@/hooks/profile';
import { useAppTheme } from '@/theme/ThemeProvider';
import { softShadow } from '@/theme/tokens';

import { TOUR_STEPS, type TourAction, type TourStep } from './steps';

type Rect = { x: number; y: number; width: number; height: number };

interface TourApi {
  /** True while the tour is running. */
  active: boolean;
  /** Called by TourTarget; returns an unregister function. */
  register: (id: string, ref: RefObject<View | null>) => () => void;
  /** A screen reports that the person did something (e.g. saved a check-in). */
  notify: (action: TourAction) => void;
  /** Start again from the welcome card (Profile → Replay the tour). */
  restart: () => void;
}

const TourContext = createContext<TourApi>({ active: false, register: () => () => {}, notify: () => {}, restart: () => {} });
export const useTour = () => useContext(TourContext);

/** The tab screens. The tour only navigates between these, never away from a screen the person opened. */
const TAB_ROUTES = ['/home', '/journal', '/chat', '/care', '/screening', '/profile'];
const storageKey = (userId: string) => `bh.tour.v1.${userId}`;
const CONTENT_STEPS = TOUR_STEPS.filter((s) => s.target).length;

const HOLE_PAD = 8;
const DIM = 'rgba(24, 38, 36, 0.58)';
/** The floating tab bar plus its gap, which the card must not sit behind. */
const TAB_BAR_SPACE = 100;

type Status = 'loading' | 'on' | 'off';

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const profile = useProfile();
  const complete = useCompleteOnboarding();
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<Status>('loading');
  const [index, setIndex] = useState(0);
  const targets = useRef(new Map<string, RefObject<View | null>>());
  const paramsAppliedFor = useRef<string | null>(null);

  const step: TourStep | undefined = status === 'on' ? TOUR_STEPS[index] : undefined;

  // Decide once per sign-in whether to run: the account flag wins; local progress lets an
  // interrupted tour resume where it stopped.
  useEffect(() => {
    if (!user || !profile.data || status !== 'loading') return;
    let cancelled = false;
    (async () => {
      let saved: { index?: number; done?: boolean } = {};
      try {
        saved = JSON.parse((await AsyncStorage.getItem(storageKey(user.id))) ?? '{}');
      } catch {
        // unreadable progress: start from the beginning
      }
      if (cancelled) return;
      if (profile.data.onboardingCompletedAt) return setStatus('off');
      if (saved.done) {
        complete.mutate(); // finished offline earlier: tell the server now
        return setStatus('off');
      }
      setIndex(Math.min(Math.max(saved.index ?? 0, 0), TOUR_STEPS.length - 1));
      setStatus('on');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile.data, status]);

  const save = useCallback(
    (value: { index: number; done: boolean }) => {
      if (user) AsyncStorage.setItem(storageKey(user.id), JSON.stringify(value)).catch(() => {});
    },
    [user],
  );

  const finish = useCallback(() => {
    setStatus('off');
    save({ index: 0, done: true });
    complete.mutate();
  }, [save, complete]);

  const goTo = useCallback(
    (i: number) => {
      if (i >= TOUR_STEPS.length) return finish();
      setIndex(i);
      save({ index: i, done: false });
    },
    [finish, save],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  const notify = useCallback(
    (action: TourAction) => {
      if (status === 'on' && TOUR_STEPS[index]?.action === action) goTo(index + 1);
    },
    [status, index, goTo],
  );

  const restart = useCallback(() => {
    paramsAppliedFor.current = null;
    setIndex(0);
    setStatus('on');
    save({ index: 0, done: false });
  }, [save]);

  /** Looked up inside the overlay's measuring effect, never during render. */
  const lookupTarget = useCallback((id: string) => targets.current.get(id), []);

  const register = useCallback((id: string, ref: RefObject<View | null>) => {
    targets.current.set(id, ref);
    return () => {
      if (targets.current.get(id) === ref) targets.current.delete(id);
    };
  }, []);

  // Bring the person to the step's screen. Only from one tab to another: if they opened
  // something (e.g. the new-entry screen, or a crisis-support card), wait for them to come back.
  useEffect(() => {
    const route = step?.route;
    if (!route || !TAB_ROUTES.includes(pathname)) return;
    if (pathname !== route.pathname) {
      paramsAppliedFor.current = step.id;
      router.navigate({ pathname: route.pathname as never, params: route.params });
    } else if (route.params && paramsAppliedFor.current !== step.id) {
      paramsAppliedFor.current = step.id;
      router.setParams(route.params);
    }
  }, [step, pathname, router]);

  const api = useMemo<TourApi>(() => ({ active: status === 'on', register, notify, restart }), [status, register, notify, restart]);
  const visible = !!step && (!step.route || pathname === step.route.pathname);

  return (
    <TourContext.Provider value={api}>
      <View style={{ flex: 1 }}>
        {children}
        {visible ? (
          <TourOverlay
            key={step.id}
            step={step}
            index={index}
            lookupTarget={lookupTarget}
            onNext={next}
            onSkip={finish}
          />
        ) : null}
      </View>
    </TourContext.Provider>
  );
}

function TourOverlay({
  step,
  index,
  lookupTarget,
  onNext,
  onSkip,
}: {
  step: TourStep;
  index: number;
  lookupTarget: (id: string) => RefObject<View | null> | undefined;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const rootRef = useRef<View>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(220);

  // Follow the target as the screen scrolls or the element grows (e.g. the check-in card
  // expanding after a mood is picked). Coordinates are made relative to this overlay.
  useEffect(() => {
    if (!step.target) return;
    const id = step.target;
    const measure = () => {
      const target = lookupTarget(id)?.current;
      const root = rootRef.current;
      if (!target || !root) return;
      root.measureInWindow((rx, ry) => {
        target.measureInWindow((x, y, width, height) => {
          if (!width || !height) return;
          setRect((prev) => {
            const nextRect = { x: x - rx, y: y - ry, width, height };
            return prev && Math.abs(prev.x - nextRect.x) < 1 && Math.abs(prev.y - nextRect.y) < 1 && Math.abs(prev.height - nextRect.height) < 1 && Math.abs(prev.width - nextRect.width) < 1
              ? prev
              : nextRect;
          });
        });
      });
    };
    measure();
    const timer = setInterval(measure, 350);
    return () => clearInterval(timer);
  }, [step.target, lookupTarget]);

  const top = insets.top + 8;
  const bottom = H - insets.bottom - TAB_BAR_SPACE;
  const hole = rect
    ? (() => {
        const y1 = Math.max(rect.y - HOLE_PAD, top);
        const y2 = Math.min(rect.y + rect.height + HOLE_PAD, bottom);
        const x1 = Math.max(rect.x - HOLE_PAD, 8);
        const x2 = Math.min(rect.x + rect.width + HOLE_PAD, W - 8);
        return y2 > y1 ? { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } : null;
      })()
    : null;

  // The card sits below the highlight if it fits, else above, else at the bottom.
  const centered = !step.target;
  let cardTop = (H - cardH) / 2;
  if (!centered) {
    if (!hole) cardTop = bottom - cardH;
    else if (hole.y + hole.h + 14 + cardH <= bottom) cardTop = hole.y + hole.h + 14;
    else if (hole.y - 14 - cardH >= top) cardTop = hole.y - 14 - cardH;
    else cardTop = bottom - cardH;
  }

  const block = <T extends object>(style: T) => (
    <Pressable accessible={false} onPress={() => {}} style={[StyleSheet.absoluteFill, style, { backgroundColor: DIM }]} />
  );
  const numbered = TOUR_STEPS.slice(0, index + 1).filter((s) => s.target).length;
  const isFirst = step.id === 'welcome';
  const isLast = index === TOUR_STEPS.length - 1;

  return (
    <Animated.View ref={rootRef} entering={FadeIn.duration(280)} exiting={FadeOut.duration(180)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {hole ? (
        <>
          {block({ top: 0, left: 0, right: 0, height: hole.y })}
          {block({ top: hole.y + hole.h, left: 0, right: 0, bottom: 0 })}
          {block({ top: hole.y, left: 0, width: hole.x, height: hole.h })}
          {block({ top: hole.y, left: hole.x + hole.w, right: 0, height: hole.h })}
          {/* Read-only steps also block the highlighted element; action steps let it be used. */}
          {!step.action ? <Pressable accessible={false} onPress={() => {}} style={{ position: 'absolute', top: hole.y, left: hole.x, width: hole.w, height: hole.h }} /> : null}
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: hole.y, left: hole.x, width: hole.w, height: hole.h, borderRadius: 26, borderWidth: 2, borderColor: colors.primary }}
          />
        </>
      ) : (
        block({ top: 0, left: 0, right: 0, bottom: 0 })
      )}

      <View
        accessibilityViewIsModal
        onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
        className="gap-3 rounded-[26px] bg-surface p-5"
        style={[{ position: 'absolute', left: 20, right: 20, top: Math.max(cardTop, top) }, softShadow]}>
        {!centered ? <Text variant="label">{`STEP ${numbered} OF ${CONTENT_STEPS}`}</Text> : null}
        <Text variant="heading" accessibilityRole="header">
          {step.title}
        </Text>
        <Text variant="body" className="text-ink-soft">
          {step.body}
        </Text>
        {step.action && step.hint ? (
          <Text variant="bodyStrong" className="text-primary-strong">
            {step.hint}
          </Text>
        ) : null}
        <View className="flex-row items-center justify-between gap-3 pt-1">
          {isLast ? <View /> : <Button title="Skip tour" variant="ghost" compact onPress={onSkip} />}
          {step.action ? (
            <Button title="Skip this step" variant="soft" compact onPress={onNext} />
          ) : (
            <Button title={isFirst ? 'Start the tour' : isLast ? 'Start using BrainHealth' : 'Next'} compact onPress={onNext} />
          )}
        </View>
      </View>
    </Animated.View>
  );
}
