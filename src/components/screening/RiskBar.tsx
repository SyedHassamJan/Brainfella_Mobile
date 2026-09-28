import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { riskLevel } from '@/theme/tokens';
import type { RiskSource } from '@/types';

const fillTone: Record<ReturnType<typeof riskLevel>['tone'], string> = {
  sage: 'bg-sage',
  primary: 'bg-primary',
  peach: 'bg-peach',
  rose: 'bg-rose',
};

const SOURCE_LABEL: Record<RiskSource, string> = {
  questionnaire: 'your questionnaire',
  text: 'your typed or spoken text',
  facial: 'your camera check-in',
};

/** "Based on your questionnaire and typed or spoken text" from the sources the backend actually used for this condition. */
function basedOnNote(sources?: { source: RiskSource }[]): string | undefined {
  if (!sources || sources.length === 0) return undefined;
  const labels = [...new Set(sources.map((s) => SOURCE_LABEL[s.source]))];
  if (labels.length === 1) return `Based on ${labels[0]}.`;
  return `Based on ${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}.`;
}

/**
 * One condition's 0-100 risk indicator as a soft horizontal bar. `null` means
 * "not enough recent input" and is shown as a plain dash, never a fake zero.
 * `sources` (from the backend's per-condition breakdown) becomes a short note
 * underneath naming what it was actually based on.
 */
export function RiskBar({
  label,
  score,
  confidence,
  sources,
}: {
  label: string;
  score: number | null;
  confidence?: 'low' | 'high';
  sources?: { source: RiskSource }[];
}) {
  if (score === null) {
    return (
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text variant="bodyStrong">{label}</Text>
          <Text variant="small">Not enough recent input</Text>
        </View>
        <View className="h-3 rounded-full bg-sunken" />
      </View>
    );
  }

  const level = riskLevel(score);
  const note = basedOnNote(sources);
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text variant="bodyStrong">{label}</Text>
        <Text variant="small">
          {level.label} · {Math.round(score)}/100{confidence === 'low' ? ' (indicative only)' : ''}
        </Text>
      </View>
      <View className="h-3 overflow-hidden rounded-full bg-sunken">
        <View className={cn('h-3 rounded-full', fillTone[level.tone])} style={{ width: `${Math.max(4, Math.round(score))}%` }} />
      </View>
      {note ? <Text variant="small">{note}</Text> : null}
    </View>
  );
}
