import { useLocalSearchParams } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/controls';
import { ErrorNote, IconBubble, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Stars } from '@/components/ui/pickers';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';
import { useCompleteExercise, useExercise, useMyCompletions } from '@/hooks/care';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useExercise(id);
  const completions = useMyCompletions();
  const complete = useCompleteExercise(id);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  if (q.isLoading) return <Screen><PageHeader back title="Exercise" /><LoadingState /></Screen>;
  if (q.isError || !q.data) {
    return (
      <Screen>
        <PageHeader back title="Exercise" />
        <ErrorNote message={getErrorMessage(q.error, "We couldn't load this exercise.")} onRetry={() => q.refetch()} />
      </Screen>
    );
  }
  const e = q.data;
  const doneAt = completions.data?.find((c) => c.exerciseId === e.id)?.completedAt ?? (complete.isSuccess ? new Date().toISOString() : null);

  return (
    <Screen>
      <View className="gap-6">
        <PageHeader back title={e.title} />
        <View className="flex-row flex-wrap gap-2">
          <Badge label={e.category} tone="primary" />
          {e.duration ? <Badge label={`${e.duration} min`} tone="neutral" /> : null}
          <Badge label={e.difficulty} tone="neutral" />
        </View>

        <Text variant="body" className="text-ink-soft">{e.description}</Text>

        <View className="gap-3">
          {e.steps.map((s, i) => (
            <Reveal key={i} index={i}>
              <Card className="flex-row items-start gap-4">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-soft">
                  <Text variant="small" className="text-primary-strong">{i + 1}</Text>
                </View>
                <Text variant="body" className="flex-1">{s}</Text>
              </Card>
            </Reveal>
          ))}
        </View>

        {doneAt ? (
          <Card tone="primary" className="flex-row items-center gap-3">
            <IconBubble icon={CircleCheck} tone="sage" size={40} />
            <Text variant="body" className="flex-1">You did this on {formatDate(doneAt)}. Well done.</Text>
          </Card>
        ) : (
          <Card className="gap-4">
            <Text variant="heading">How did it go?</Text>
            <Stars value={rating} onChange={setRating} size={30} />
            <TextField placeholder="Any thoughts? (optional)" multiline value={feedback} onChangeText={setFeedback} />
            {complete.isError ? <Text variant="small" className="text-support-ink">{getErrorMessage(complete.error)}</Text> : null}
            <Button
              title="I've done this"
              loading={complete.isPending}
              onPress={() => complete.mutate({ rating: rating || undefined, feedback: feedback.trim() || undefined })}
            />
          </Card>
        )}
      </View>
    </Screen>
  );
}
