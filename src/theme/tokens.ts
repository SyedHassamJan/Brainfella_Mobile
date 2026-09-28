import type { EmotionLabel } from '@/types';

/**
 * Design tokens. LIGHT values must match src/global.css; DARK values are applied
 * at runtime through NativeWind's VariableContextProvider (see ThemeProvider).
 *
 * Intent: calm on sight. Soft sage and mist, deep blue-grey text (never pure
 * black), lavender and peach as gentle accents, and NO red on support
 * surfaces: help is offered warmly, not announced as an alarm.
 */
export type ColorScheme = 'light' | 'dark';

export const palette = {
  light: {
    canvas: '#f5f7f4',
    surface: '#ffffff',
    sunken: '#eef2ef',
    line: '#e1e8e4',
    ink: '#26363d',
    inkSoft: '#5f7278',
    inkFaint: '#94a4a8',
    primary: '#5b9a90',
    primaryStrong: '#467f76',
    primarySoft: '#e2f0ed',
    primaryInk: '#ffffff',
    lavender: '#9a8fcb',
    lavenderSoft: '#eeebf8',
    peach: '#e9b79a',
    peachSoft: '#fbefe6',
    rose: '#c58585',
    roseSoft: '#f7e6e4',
    sage: '#7fb08a',
    sageSoft: '#e6f2e8',
    support: '#fbf0ea',
    supportLine: '#f1d9cc',
    supportInk: '#7a4b3c',
  },
  dark: {
    canvas: '#101719',
    surface: '#182225',
    sunken: '#1f2b2f',
    line: '#2a383d',
    ink: '#e7efec',
    inkSoft: '#a7bbb8',
    inkFaint: '#6f8489',
    primary: '#7dbbb0',
    primaryStrong: '#5fa095',
    primarySoft: '#1f3431',
    primaryInk: '#0f1a1a',
    lavender: '#b3a9e0',
    lavenderSoft: '#272437',
    peach: '#e7b597',
    peachSoft: '#33261f',
    rose: '#d69a9a',
    roseSoft: '#352222',
    sage: '#8fc79b',
    sageSoft: '#1f3125',
    support: '#2e2420',
    supportLine: '#4a372f',
    supportInk: '#f0cdbb',
  },
} as const;

export type Palette = { [K in keyof (typeof palette)['light']]: string };

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** { canvas: '#..' } -> { '--color-canvas': '#..' } for VariableContextProvider. */
export function toCssVars(p: Palette): Record<string, string> {
  return Object.fromEntries(Object.entries(p).map(([k, v]) => [`--color-${kebab(k)}`, v]));
}

export const cssVars: Record<ColorScheme, Record<string, string>> = {
  light: toCssVars(palette.light),
  dark: toCssVars(palette.dark),
};

/** Custom font files are one family per weight, so weights are separate names. */
export const fonts = {
  heading: 'Fraunces_400Regular',
  headingMedium: 'Fraunces_500Medium',
  body: 'Nunito_400Regular',
  bodyMedium: 'Nunito_500Medium',
  bodySemibold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
} as const;

/** Very soft, tinted shadow (never a hard grey drop shadow). */
export const softShadow = {
  shadowColor: '#2b4a45',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.07,
  shadowRadius: 18,
  elevation: 2,
} as const;

export const emotions: Record<EmotionLabel, { label: string; tint: string }> = {
  joy: { label: 'Joyful', tint: '#f6e3a6' },
  neutral: { label: 'Calm', tint: '#d5e3e0' },
  sadness: { label: 'Low', tint: '#c9dcf0' },
  fear: { label: 'Anxious', tint: '#ddd5f1' },
  anger: { label: 'Frustrated', tint: '#f0c9be' },
  surprise: { label: 'Surprised', tint: '#f7d3c0' },
  disgust: { label: 'Uneasy', tint: '#d3e2c6' },
};

/** Order shown when picking a mood: gentle, most common first. */
export const moodOrder: EmotionLabel[] = ['joy', 'neutral', 'sadness', 'fear', 'anger', 'surprise', 'disgust'];

export const emotionLabel = (e?: EmotionLabel | null) => (e ? emotions[e]?.label ?? 'Calm' : 'Calm');

/** The four risk-indicator categories the fusion layer reports, each with a distinct, calm accent. */
export const RISK_CONDITIONS = {
  depressionRisk: { label: 'Depression', color: { light: palette.light.primary, dark: palette.dark.primary } },
  anxietyRisk: { label: 'Anxiety', color: { light: palette.light.lavender, dark: palette.dark.lavender } },
  stressRisk: { label: 'Stress', color: { light: palette.light.peach, dark: palette.dark.peach } },
  ocdRisk: { label: 'OCD symptoms', color: { light: palette.light.rose, dark: palette.dark.rose } },
} as const;

/**
 * Display bands for a 0-100 risk indicator, matching the backend's own
 * `FUSION.levelBounds` (<25 Low, <50 Mild, <75 Moderate, else High). Colors stay
 * within the calm palette on purpose — nothing on this screen turns alarm-red.
 */
export function riskLevel(score: number): { label: string; tone: 'sage' | 'primary' | 'peach' | 'rose' } {
  if (score < 25) return { label: 'Low', tone: 'sage' };
  if (score < 50) return { label: 'Mild', tone: 'primary' };
  if (score < 75) return { label: 'Moderate', tone: 'peach' };
  return { label: 'High', tone: 'rose' };
}
