/**
 * Two focused tests on the REAL screen components (imported directly, not
 * reimplemented) that together reproduce and guard the bug reported from the
 * phone: "Validation failed (enum string is expected)" -- the backend's
 * ParseEnumPipe rejecting whatever the :type route param actually was.
 *
 * 1. What the chooser screen's card actually calls router.push with when
 *    tapped (this is the piece the earlier hook/live-API tests never
 *    covered: those called the API directly with hardcoded, correct type
 *    values, never the screen's own onPress).
 * 2. What the [type] screen actually requests once expo-router hands it a
 *    real resolved param (i.e. as it would arrive by a real Stack
 *    navigation or deep link).
 *
 * (A full renderRouter({ appDir: 'src/app' }) chained hub -> chooser -> [type]
 * was tried first. Its require-context ponyfill loads every route file with a
 * raw, non-Jest require() that never applies transformIgnorePatterns --
 * lucide-react-native ships ESM and fails to parse there regardless of jest
 * config (worked around below the same way, for the in-memory route map that
 * replaced it). Chaining through a HAND-BUILT in-memory route map also turned
 * out to route the static "index" segment and the dynamic "[type]" segment
 * ambiguously -- an artifact of that virtual map's route-priority resolution,
 * not something a real file tree, where "index" is a real, distinct file,
 * can do. Testing each hop directly, as below, sidesteps that and is a more
 * precise assertion of the actual bug anyway.)
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import api from '@/api';
import QuestionnaireScreen from '@/app/(patient)/screening/questionnaire/[type]';
import QuestionnaireChooserScreen from '@/app/(patient)/screening/questionnaire/index';
import type { QuestionnaireDefinition, QuestionnaireType } from '@/types';

jest.mock('@/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => require('react-native').View }));
jest.mock('@/components/ui/Card', () => {
  const { Pressable, View } = require('react-native');
  return {
    Card: ({ children, onPress, accessibilityLabel }: { children: ReactNode; onPress?: () => void; accessibilityLabel?: string }) =>
      onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>
          {children}
        </Pressable>
      ) : (
        <View>{children}</View>
      ),
  };
});
jest.mock('@/components/ui/Button', () => {
  const { Pressable, View } = require('react-native');
  return {
    Button: ({ title, onPress }: { title: string; onPress?: () => void }) => (
      <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
        <View />
      </Pressable>
    ),
  };
});
jest.mock('@/components/ui/motion', () => ({
  Reveal: ({ children }: { children: ReactNode }) => children,
  Fade: ({ children }: { children: ReactNode }) => children,
}));
// LoadingState (spinner) renders BreathingOrb, which calls react-native-reanimated's
// useReducedMotion (not available under this jest setup; no full-component render test
// exercised it before now). LoadingState is the symbol other screens import, so it's
// replaced wholesale -- overriding just BreathingOrb wouldn't reach it, since LoadingState
// calls it as a same-module local reference, not through the exports object.
jest.mock('@/components/ui/feedback', () => {
  const { View } = require('react-native');
  return { ...jest.requireActual('@/components/ui/feedback'), LoadingState: () => <View /> };
});
// Only useRouter (what onPress calls) is replaced with a spy; useLocalSearchParams and
// everything renderRouter itself needs internally pass through to the real module.
const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const actual = jest.requireActual('expo-router');
  return new Proxy(actual, { get: (target, prop) => (prop === 'useRouter' ? () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }) : target[prop as keyof typeof target]) });
});

const get = api.get as jest.Mock;
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) => (
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </SafeAreaProvider>
);

const DEFINITION: QuestionnaireDefinition = {
  type: 'PHQ9',
  name: 'PHQ-9',
  measures: 'Depression symptoms',
  instructions: 'Over the last 2 weeks…',
  options: [{ value: 0, label: 'Not at all' }],
  items: ['Little interest or pleasure in doing things'],
};

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: DEFINITION });
  mockPush.mockReset();
});

describe('the chooser card sends the router exactly the right type', () => {
  const CASES: { label: string; type: QuestionnaireType }[] = [
    { label: 'PHQ-9', type: 'PHQ9' },
    { label: 'GAD-7', type: 'GAD7' },
    { label: 'OCI-R', type: 'OCIR' },
    { label: 'DASS-21', type: 'DASS21' },
  ];

  it.each(CASES)('tapping $label pushes { pathname: .../[type], params: { type: $type } }', ({ label, type }) => {
    render(<QuestionnaireChooserScreen />, { wrapper });
    fireEvent.press(screen.getByLabelText(label));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/screening/questionnaire/[type]', params: { type } });
  });
});

describe('the [type] screen requests exactly what expo-router hands it', () => {
  const TYPES: QuestionnaireType[] = ['PHQ9', 'GAD7', 'OCIR', 'DASS21'];

  it.each(TYPES)('given the real param :type=%s, it requests GET /questionnaire/%s (never /questionnaire/undefined)', async (type) => {
    renderRouter({ 'screening/questionnaire/[type]': QuestionnaireScreen }, { initialUrl: `/screening/questionnaire/${type}`, wrapper });
    await waitFor(() => expect(get).toHaveBeenCalledWith(`/questionnaire/${type}`));
    // The exact bug reported: a bad first render sending the literal string "undefined".
    expect(get).not.toHaveBeenCalledWith(expect.stringContaining('undefined'));
  });
});
