import { BREATH_PATTERNS, cycleSeconds, cyclesForMinutes, orbTarget } from '../breathing';

describe('breathing patterns', () => {
  it('every pattern breathes in and out, with a longer or equal out-breath than in-breath', () => {
    for (const p of BREATH_PATTERNS) {
      const inn = p.phases.find((ph) => ph.kind === 'in');
      const out = p.phases.find((ph) => ph.kind === 'out');
      expect(inn).toBeDefined();
      expect(out).toBeDefined();
      expect(out!.seconds).toBeGreaterThanOrEqual(inn!.seconds);
    }
  });

  it('computes cycle length', () => {
    const byId = Object.fromEntries(BREATH_PATTERNS.map((p) => [p.id, p]));
    expect(cycleSeconds(byId.gentle)).toBe(10);
    expect(cycleSeconds(byId.box)).toBe(16);
    expect(cycleSeconds(byId.relax)).toBe(19);
  });

  it('fits whole cycles into a session so it ends on an out-breath, and never fewer than one', () => {
    const gentle = BREATH_PATTERNS.find((p) => p.id === 'gentle')!;
    expect(cyclesForMinutes(gentle, 1)).toBe(6);
    expect(cyclesForMinutes(gentle, 3)).toBe(18);
    expect(cyclesForMinutes(gentle, 0)).toBe(1);
  });
});

describe('orbTarget', () => {
  it('grows on in, shrinks on out, and holds keep the current size', () => {
    expect(orbTarget('in', 0)).toBe(1);
    expect(orbTarget('out', 1)).toBe(0);
    expect(orbTarget('hold', 1)).toBe(1);
    expect(orbTarget('rest', 0)).toBe(0);
  });
});
