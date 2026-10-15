export type BreathPhaseKind = 'in' | 'hold' | 'out' | 'rest';

export interface BreathPhase {
  kind: BreathPhaseKind;
  seconds: number;
}

export interface BreathPattern {
  id: 'gentle' | 'box' | 'relax';
  name: string;
  /** One quiet line shown on the chooser, never a clinical claim. */
  blurb: string;
  phases: BreathPhase[];
}

/**
 * Common slow-breathing rhythms. Exhaling longer than inhaling is the usual
 * "settling" shape. These are relaxation aids, not treatment.
 */
export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'gentle',
    name: 'Gentle',
    blurb: 'In for 4, out for 6. A good place to start.',
    phases: [
      { kind: 'in', seconds: 4 },
      { kind: 'out', seconds: 6 },
    ],
  },
  {
    id: 'box',
    name: 'Steady',
    blurb: 'In 4, hold 4, out 4, hold 4. Even and grounding.',
    phases: [
      { kind: 'in', seconds: 4 },
      { kind: 'hold', seconds: 4 },
      { kind: 'out', seconds: 4 },
      { kind: 'rest', seconds: 4 },
    ],
  },
  {
    id: 'relax',
    name: 'Deep rest',
    blurb: 'In 4, hold 7, out 8. Slower, for winding down.',
    phases: [
      { kind: 'in', seconds: 4 },
      { kind: 'hold', seconds: 7 },
      { kind: 'out', seconds: 8 },
    ],
  },
];

/** Session lengths in minutes; `null` means "as long as I like". */
export const SESSION_MINUTES: (number | null)[] = [1, 3, 5, null];

export const PHASE_LABEL: Record<BreathPhaseKind, string> = {
  in: 'Breathe in',
  hold: 'Hold gently',
  out: 'Breathe out',
  rest: 'Rest',
};

export const cycleSeconds = (p: BreathPattern) => p.phases.reduce((n, ph) => n + ph.seconds, 0);

/** Orb size target (0 = small, 1 = full) the circle should be at the END of a phase. */
export function orbTarget(kind: BreathPhaseKind, previous: number): number {
  if (kind === 'in') return 1;
  if (kind === 'out') return 0;
  return previous; // holds keep whatever size the lungs are at
}

/** Whole cycles that fit a session, so it ends at the end of an out-breath, not mid-inhale. */
export function cyclesForMinutes(p: BreathPattern, minutes: number): number {
  return Math.max(1, Math.round((minutes * 60) / cycleSeconds(p)));
}
