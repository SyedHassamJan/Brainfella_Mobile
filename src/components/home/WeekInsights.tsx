import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/controls';
import { Text } from '@/components/ui/Text';
import { useMoodInsights } from '@/hooks/mood';
import { cn } from '@/lib/cn';
import { emotionLabel } from '@/theme/tokens';
import type { MoodInsights } from '@/types';

const BAR_AREA = 74;

/** The last 7 calendar days, oldest first, each with its average intensity (or null). */
export function lastSevenDays(insights: MoodInsights | undefined, now = new Date()) {
  const byDate = new Map((insights?.dailyAverages ?? []).map((d) => [d.date, d.averageIntensity]));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0]!;
    return { key, letter: d.toLocaleDateString(undefined, { weekday: 'narrow' }), value: byDate.get(key) ?? null, isToday: i === 6 };
  });
}

export function WeekInsights() {
  const { data, isLoading, isError } = useMoodInsights();
  if (isLoading || isError) return null; // supplementary: never block or alarm the Home screen

  const days = lastSevenDays(data);
  const empty = !data || data.totalLogs === 0;

  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text variant="heading">Your week</Text>
        {!empty && data.dominantEmotion ? <Badge label={`Mostly ${emotionLabel(data.dominantEmotion).toLowerCase()}`} tone="lavender" /> : null}
      </View>

      {empty ? (
        <Text variant="small">Your check-ins will gather here, so you can see how your week has felt.</Text>
      ) : (
        <>
          <View className="flex-row items-end justify-between" style={{ height: BAR_AREA + 22 }}>
            {days.map((d) => (
              <View key={d.key} className="items-center gap-2" style={{ width: 30 }}>
                <View className="justify-end" style={{ height: BAR_AREA }}>
                  <View
                    className={cn('w-[14px] rounded-full', d.value === null ? 'bg-sunken' : d.isToday ? 'bg-primary' : 'bg-primary-soft')}
                    style={{ height: d.value === null ? 8 : Math.max(12, (d.value / 10) * BAR_AREA) }}
                  />
                </View>
                <Text variant="small" style={{ fontSize: 12, lineHeight: 16 }}>
                  {d.letter}
                </Text>
              </View>
            ))}
          </View>
          <Text variant="small">
            {data.totalLogs} check-in{data.totalLogs === 1 ? '' : 's'} this week · average strength {data.averageIntensity}/10
          </Text>
        </>
      )}
    </Card>
  );
}
