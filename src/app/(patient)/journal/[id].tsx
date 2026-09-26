import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil, Trash } from 'lucide-react-native';
import { Alert, View } from 'react-native';

import { EmotionDot } from '@/components/journal/EntryCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorNote, LoadingState, SupportBanner } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useDeleteJournal, useJournal } from '@/hooks/journal';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const q = useJournal(id);
  const del = useDeleteJournal();

  const confirmDelete = () =>
    Alert.alert('Delete this entry?', 'It will be removed for good. This can’t be undone.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(id, { onSuccess: () => router.back() }) },
    ]);

  if (q.isLoading) return <Screen><PageHeader back title="Entry" /><LoadingState /></Screen>;
  if (q.isError || !q.data) {
    return (
      <Screen>
        <PageHeader back title="Entry" />
        <ErrorNote message={getErrorMessage(q.error, "We couldn't open that entry.")} onRetry={() => q.refetch()} />
      </Screen>
    );
  }
  const e = q.data;

  return (
    <Screen>
      <View className="gap-6">
        <PageHeader back title={e.title || 'Journal entry'} subtitle={formatDateTime(e.createdAt)} />

        <Reveal index={0}>
          <Card className="gap-4">
            <EmotionDot emotion={e.detectedEmotion} />
            <Text variant="body" selectable>
              {e.content}
            </Text>
          </Card>
        </Reveal>

        {e.isCrisis ? (
          <Reveal index={1}>
            <SupportBanner message="When you wrote this, things sounded really hard. If they still feel that way, please consider reaching out to someone today." />
          </Reveal>
        ) : null}

        {e.therapistComment ? (
          <Reveal index={2}>
            <Card tone="lavender" className="gap-2">
              <Text variant="label">A NOTE FROM YOUR THERAPIST</Text>
              <Text variant="body">{e.therapistComment}</Text>
            </Card>
          </Reveal>
        ) : null}

        {del.isError ? (
          <Text variant="small" className="text-support-ink">
            {getErrorMessage(del.error)}
          </Text>
        ) : null}

        <Reveal index={3}>
          <View className="gap-3">
            <Button title="Edit" variant="soft" onPress={() => router.push(`/journal/edit/${e.id}`)} icon={<Pencil size={17} color={colors.primaryStrong} strokeWidth={1.8} />} />
            <Button title="Delete entry" variant="ghost" loading={del.isPending} onPress={confirmDelete} icon={<Trash size={17} color={colors.inkSoft} strokeWidth={1.8} />} />
          </View>
        </Reveal>
      </View>
    </Screen>
  );
}
