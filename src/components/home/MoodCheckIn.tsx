import { CircleCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/controls';
import { IconBubble, SupportBanner } from '@/components/ui/feedback';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';
import { useLogMood } from '@/hooks/mood';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/errors';
import { emotions, moodOrder } from '@/theme/tokens';
import { toneMessage } from '@/lib/checkin';
import { useTour } from '@/tour/TourProvider';
import type { EmotionLabel, MoodLog } from '@/types';

/** 1-10 as ten soft dots: less clinical than a slider, and easy to tap. */
export function IntensityDots({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Pressable key={n} accessibilityRole="button" accessibilityLabel={`Intensity ${n}`} accessibilityState={{ selected: n === value }} hitSlop={6} onPress={() => onChange(n)}>
            <View className={cn('h-[26px] w-[26px] rounded-full', n <= value ? 'bg-primary' : 'bg-sunken')} style={{ opacity: n <= value ? 0.35 + n * 0.065 : 1 }} />
          </Pressable>
        ))}
      </View>
      <View className="flex-row justify-between">
        <Text variant="small">Barely</Text>
        <Text variant="small">Very strongly</Text>
      </View>
    </View>
  );
}

/** After saving: exactly what was logged, so the person can see their check-in as recorded. */
function CheckInSummary({ log, onAgain }: { log: MoodLog; onAgain: () => void }) {
  const tone = toneMessage(log);
  return (
    <Card tone="surface" className="gap-4 py-6">
      <View className="flex-row items-center gap-3">
        <IconBubble icon={CircleCheck} tone="sage" size={48} />
        <View className="flex-1 gap-0.5">
          <Text variant="heading">Thank you for checking in</Text>
          <Text variant="small">Your week view has been updated.</Text>
        </View>
      </View>
      <View className="gap-2 rounded-2xl bg-sunken p-4">
        <Text variant="label">YOUR CHECK-IN</Text>
        <Text variant="bodyStrong">
          {emotions[log.mood].label} · {log.intensity}/10
        </Text>
        {log.note ? <Text variant="body" className="text-ink-soft">{`“${log.note}”`}</Text> : null}
        {tone ? <Text variant="small">{tone}</Text> : null}
      </View>
      <Button title="Check in again" variant="soft" compact onPress={onAgain} />
    </Card>
  );
}

/** A small, forgiving check-in: how do you feel, how strongly, anything to add. */
export function MoodCheckIn() {
  const log = useLogMood();
  const tour = useTour();
  const [mood, setMood] = useState<EmotionLabel | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');

  const reset = () => {
    log.reset();
    setMood(null);
    setIntensity(5);
    setNote('');
  };

  // The note matched the crisis check (whatever mood was picked): offer support first, gently.
  if (log.isSuccess && log.data.isCrisis) {
    return (
      <View className="gap-3">
        <SupportBanner title="Thank you for telling us" message={log.data.crisisSupport} />
        <Button title="Back to check-in" variant="ghost" compact onPress={reset} />
      </View>
    );
  }

  if (log.isSuccess) return <CheckInSummary log={log.data} onAgain={reset} />;

  return (
    <Card className="gap-5">
      <View className="gap-1">
        <Text variant="heading">How are you feeling?</Text>
        <Text variant="small">There are no wrong answers.</Text>
      </View>

      <View className="flex-row flex-wrap gap-2.5">
        {moodOrder.map((m) => (
          <Chip key={m} label={emotions[m].label} tint={emotions[m].tint} selected={mood === m} onPress={() => setMood(m)} />
        ))}
      </View>

      {mood ? (
        <View className="gap-5">
          <View className="gap-3">
            <Text variant="label">HOW STRONGLY?</Text>
            <IntensityDots value={intensity} onChange={setIntensity} />
          </View>
          <TextField placeholder="Anything you'd like to add? (optional)" value={note} onChangeText={setNote} multiline />
          {log.isError ? (
            <Text variant="small" className="text-support-ink">
              {getErrorMessage(log.error)}
            </Text>
          ) : null}
          <Button
            title="Save check-in"
            loading={log.isPending}
            onPress={() =>
              log.mutate(
                { mood, intensity, note: note.trim() || undefined },
                // The guided tour moves on after a first check-in, but never over crisis support.
                { onSuccess: (saved) => !saved.isCrisis && tour.notify('checkin') },
              )
            }
          />
        </View>
      ) : null}
    </Card>
  );
}
