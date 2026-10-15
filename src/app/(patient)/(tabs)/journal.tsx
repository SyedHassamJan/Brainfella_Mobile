import { useRouter } from 'expo-router';
import { NotebookPen, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { EntryCard } from '@/components/journal/EntryCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorNote, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScreenList } from '@/components/ui/ScreenList';
import { useJournals } from '@/hooks/journal';
import { getErrorMessage } from '@/lib/errors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { TourTarget } from '@/tour/TourTarget';

export default function JournalScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const q = useJournals();
  const entries = q.data?.pages.flatMap((p) => p.entries);

  return (
    <ScreenList
      tabBarSpace
      data={entries}
      keyExtractor={(e) => e.id}
      renderItem={({ item, index }) =>
        index === 0 ? (
          <TourTarget id="journal.list">
            <EntryCard entry={item} onPress={() => router.push(`/journal/${item.id}`)} />
          </TourTarget>
        ) : (
          <EntryCard entry={item} onPress={() => router.push(`/journal/${item.id}`)} />
        )
      }
      refreshing={q.isRefetching && !q.isFetchingNextPage}
      onRefresh={() => q.refetch()}
      onEndReached={() => q.hasNextPage && !q.isFetchingNextPage && q.fetchNextPage()}
      header={
        <View className="gap-6 pb-5">
          <PageHeader title="Your journal" subtitle="A private place for whatever is on your mind." />
          <TourTarget id="journal.new">
            <Button
              title="Write a new entry"
              onPress={() => router.push('/journal/new')}
              icon={<Plus size={18} color={colors.primaryInk} strokeWidth={1.9} />}
            />
          </TourTarget>
        </View>
      }
      empty={
        q.isLoading ? (
          <LoadingState />
        ) : q.isError ? (
          <ErrorNote message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : (
          <EmptyState
            icon={NotebookPen}
            title="Nothing here yet"
            message="When you're ready, writing a few lines can help sort out how you feel. Only you can read this."
          />
        )
      }
      footer={q.isFetchingNextPage ? <LoadingState label="Loading more…" /> : null}
    />
  );
}
