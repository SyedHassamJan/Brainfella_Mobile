import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/theme/ThemeProvider';

/**
 * A row of named steps (Recording -> Sending -> Transcribing -> Done, or
 * similar) so a slow process never looks stalled. `current` is the 0-based
 * step in progress; earlier steps show a checkmark. `failedAt`, if given,
 * turns that step rose instead of advancing further, and the caller is
 * expected to show the error message itself alongside this.
 */
export function StepProgress({ steps, current, failedAt }: { steps: string[]; current: number; failedAt?: number }) {
  const { colors } = useAppTheme();
  return (
    <View className="flex-row items-center justify-between">
      {steps.map((step, i) => {
        const failed = failedAt === i;
        const done = failedAt === undefined && i < current;
        const active = failedAt === undefined && i === current;
        const tone = failed ? colors.rose : done || active ? colors.primary : colors.inkFaint;
        return (
          <View key={step} className="flex-1 items-center gap-1.5">
            <View
              className={cn('h-7 w-7 items-center justify-center rounded-full border-2')}
              style={{ borderColor: tone, backgroundColor: done ? colors.primary : 'transparent' }}>
              {done ? <Check size={14} color={colors.primaryInk} strokeWidth={2.5} /> : <Text style={{ color: tone, fontSize: 12 }}>{i + 1}</Text>}
            </View>
            <Text variant="label" style={{ color: tone, textAlign: 'center' }}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
