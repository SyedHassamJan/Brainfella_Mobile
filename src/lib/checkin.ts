import { emotions } from '@/theme/tokens';
import type { MoodLog } from '@/types';

/**
 * What the note's tone adds to the chosen mood. The person's choice always stands:
 * a different tone is offered as an observation ("feelings can be mixed"), never a correction.
 */
export function toneMessage(log: Pick<MoodLog, 'mood' | 'note' | 'detectedEmotion'>): string | null {
  if (!log.note) return null;
  if (!log.detectedEmotion) return "We couldn't read the tone of your note just now. Your check-in is saved as you chose it.";
  const tone = emotions[log.detectedEmotion].label.toLowerCase();
  if (log.detectedEmotion === log.mood) return `Your note sounds ${tone} too.`;
  return `Your note sounds more ${tone}. That's okay, feelings can be mixed. We've kept ${emotions[log.mood].label} as you chose.`;
}

