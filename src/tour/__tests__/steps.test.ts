import fs from 'fs';
import path from 'path';

import { TOUR_STEPS } from '../steps';

/** Every file under src/app and src/components, as one string, to find TourTarget ids in. */
function sourceText(dir: string): string {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .map((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === '__tests__' ? '' : sourceText(full);
      return /\.tsx?$/.test(e.name) ? fs.readFileSync(full, 'utf8') : '';
    })
    .join('\n');
}

describe('guided tour steps', () => {
  const src = sourceText(path.join(__dirname, '..', '..', 'app')) + sourceText(path.join(__dirname, '..', '..', 'components'));

  it('every step target exists as a <TourTarget id=...> in the screens', () => {
    for (const step of TOUR_STEPS.filter((s) => s.target)) {
      expect({ step: step.id, found: src.includes(`<TourTarget id="${step.target}"`) }).toEqual({ step: step.id, found: true });
    }
  });

  it('starts with a welcome and ends with a finish card, ids are unique, action steps tell the person what to do', () => {
    expect(TOUR_STEPS[0]!.target).toBeUndefined();
    expect(TOUR_STEPS[TOUR_STEPS.length - 1]!.target).toBeUndefined();
    expect(new Set(TOUR_STEPS.map((s) => s.id)).size).toBe(TOUR_STEPS.length);
    for (const s of TOUR_STEPS.filter((x) => x.action)) expect(s.hint).toBeTruthy();
  });

  it('covers check-in, journal, care (sessions, therapists, exercises), camera, voice and settings', () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    for (const id of ['checkin', 'checkin-review', 'journal', 'care-sessions', 'care-therapists', 'care-exercises', 'screening-camera', 'screening-voice', 'profile']) {
      expect(ids).toContain(id);
    }
  });
});
