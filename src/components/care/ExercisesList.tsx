import { useRouter } from 'expo-router';
import { CircleCheck, Sprout } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/controls';
import { EmptyState, ErrorNote, IconBubble, LoadingState } from '@/components/ui/feedback';
import { Text } from '@/components/ui/Text';
import { useExercises, useMyCompletions } from '@/hooks/care';
import { getErrorMessage } from '@/lib/errors';
import { snippet } from '@/lib/format';

export function ExercisesList() {
  const router = useRouter();
  const q = useExercises();
  const done = useMyCompletions();
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorNote message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data?.length) return <EmptyState icon={Sprout} title="No exercises yet" message="Guided exercises will appear here." />;

  const completed = new Set(done.data?.map((c) => c.exerciseId));

  return (
    <View className="gap-3.5">
      {q.data.map((e) => (
        <Card key={e.id} onPress={() => router.push(`/exercise/${e.id}`)} className="gap-3">
          <View className="flex-row items-start gap-3">
            <View className="flex-1 gap-1">
              <Text variant="heading">{e.title}</Text>
              <Text variant="small">{snippet(e.description, 110)}</Text>
            </View>
            {completed.has(e.id) ? <IconBubble icon={CircleCheck} tone="sage" size={36} /> : null}
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Badge label={e.category} tone="primary" />
            {e.duration ? <Badge label={`${e.duration} min`} tone="neutral" /> : null}
            <Badge label={e.difficulty} tone="neutral" />
          </View>
        </Card>
      ))}
    </View>
  );
}
