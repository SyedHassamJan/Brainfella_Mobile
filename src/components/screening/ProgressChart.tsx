import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { relativeDay } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';
import { RISK_CONDITIONS } from '@/theme/tokens';
import type { RiskAssessment } from '@/types';

const HEIGHT = 200;
const PAD = { top: 16, bottom: 28, left: 8, right: 8 };
const CONDITIONS = Object.keys(RISK_CONDITIONS) as (keyof typeof RISK_CONDITIONS)[];

/** A soft multi-line chart of the four risk categories over time, oldest first. */
export function ProgressChart({ data }: { data: RiskAssessment[] }) {
  const { colors, scheme } = useAppTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const n = data.length;
  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (score: number) => PAD.top + innerH - (score / 100) * innerH;

  // One or more "M x y L x y…" subpaths per condition, broken wherever the score is null
  // (a missing input is a gap, never interpolated as zero).
  const pathFor = (key: keyof typeof RISK_CONDITIONS) => {
    const segments: string[] = [];
    let current: string[] = [];
    data.forEach((row, i) => {
      const v = row[key];
      if (v === null) {
        if (current.length > 1) segments.push(current.join(' '));
        current = [];
        return;
      }
      current.push(`${current.length === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`);
    });
    if (current.length > 1) segments.push(current.join(' '));
    return segments;
  };

  return (
    <View className="gap-4">
      <View onLayout={onLayout} style={{ height: HEIGHT }}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {[0, 25, 50, 75, 100].map((g) => (
              <Line key={g} x1={PAD.left} x2={width - PAD.right} y1={y(g)} y2={y(g)} stroke={colors.line} strokeWidth={1} />
            ))}
            {CONDITIONS.map((key) =>
              pathFor(key).map((d, i) => (
                <Path key={`${key}-${i}`} d={d} stroke={RISK_CONDITIONS[key].color[scheme]} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )),
            )}
            {CONDITIONS.map((key) =>
              data.map((row, i) => {
                const v = row[key];
                if (v === null) return null;
                return <Circle key={`${key}-dot-${i}`} cx={x(i)} cy={y(v)} r={3.5} fill={RISK_CONDITIONS[key].color[scheme]} />;
              }),
            )}
          </Svg>
        ) : null}
      </View>
      {n > 0 ? (
        <View className="flex-row justify-between">
          <Text variant="label">{relativeDay(data[0]!.computedAt)}</Text>
          <Text variant="label">{relativeDay(data[n - 1]!.computedAt)}</Text>
        </View>
      ) : null}
      <View className="flex-row flex-wrap gap-x-4 gap-y-2">
        {CONDITIONS.map((key) => (
          <View key={key} className="flex-row items-center gap-2">
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: RISK_CONDITIONS[key].color[scheme] }} />
            <Text variant="small">{RISK_CONDITIONS[key].label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
