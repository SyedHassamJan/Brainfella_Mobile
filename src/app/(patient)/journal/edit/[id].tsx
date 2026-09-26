import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { JournalForm } from '@/components/journal/JournalForm';
import { Card } from '@/components/ui/Card';
import { ErrorNote, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { useJournal, useUpdateJournal } from '@/hooks/journal';
import { getErrorMessage } from '@/lib/errors';

export default function EditJournalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useJournal(id);
  const update = useUpdateJournal(id);

  if (q.isLoading) return <Screen><PageHeader back title="Edit entry" /><LoadingState /></Screen>;
  if (q.isError || !q.data) {
    return (
      <Screen>
        <PageHeader back title="Edit entry" />
        <ErrorNote message={getErrorMessage(q.error, "We couldn't open that entry.")} onRetry={() => q.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="gap-6">
        <PageHeader back title="Edit entry" />
        <Card className="p-5">
          <JournalForm
            initial={{ title: q.data.title ?? '', content: q.data.content }}
            submitLabel="Save changes"
            submitting={update.isPending}
            error={update.isError ? getErrorMessage(update.error) : undefined}
            onSubmit={(v) => update.mutate({ title: v.title?.trim() || undefined, content: v.content.trim() }, { onSuccess: () => router.back() })}
          />
        </Card>
      </View>
    </Screen>
  );
}
