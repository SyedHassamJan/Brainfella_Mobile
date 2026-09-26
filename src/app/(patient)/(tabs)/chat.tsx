import { useRouter } from 'expo-router';
import { MessageCircle, Trash } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorNote, IconBubble, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScreenList } from '@/components/ui/ScreenList';
import { Text } from '@/components/ui/Text';
import { useChatSessions, useDeleteChat, useStartChat } from '@/hooks/chat';
import { getErrorMessage } from '@/lib/errors';
import { relativeDay } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function ChatScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const q = useChatSessions();
  const start = useStartChat();
  const del = useDeleteChat();

  const begin = () => start.mutate(undefined, { onSuccess: (s) => router.push(`/chat/${s.id}`) });

  const confirmDelete = (id: string) =>
    Alert.alert('Delete this conversation?', 'It will be removed for good.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(id) },
    ]);

  return (
    <ScreenList
      tabBarSpace
      data={q.data}
      keyExtractor={(s) => s.id}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
      renderItem={({ item }) => (
        <Card onPress={() => router.push(`/chat/${item.id}`)} className="flex-row items-center gap-4">
          <IconBubble icon={MessageCircle} tone="lavender" />
          <View className="flex-1 gap-0.5">
            <Text variant="bodyStrong">{item.title || 'Conversation'}</Text>
            <Text variant="small">{relativeDay(item.createdAt)}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Delete conversation" hitSlop={12} onPress={() => confirmDelete(item.id)}>
            <Trash size={18} color={colors.inkFaint} strokeWidth={1.7} />
          </Pressable>
        </Card>
      )}
      header={
        <View className="gap-6 pb-5">
          <PageHeader title="Talk it through" subtitle="A gentle companion, here whenever you'd like to talk." />
          <Card tone="lavender" className="gap-2">
            <Text variant="small" className="text-ink">
              Your companion is an AI. It can listen and share ideas that may help, but it isn't a therapist and can't diagnose. If you ever feel unsafe, it will point you to real people.
            </Text>
          </Card>
          {start.isError ? <Text variant="small" className="text-support-ink">{getErrorMessage(start.error)}</Text> : null}
          <Button title="Start a conversation" loading={start.isPending} onPress={begin} />
        </View>
      }
      empty={
        q.isLoading ? (
          <LoadingState />
        ) : q.isError ? (
          <ErrorNote message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : (
          <EmptyState icon={MessageCircle} title="No conversations yet" message="Whenever you're ready, say hello. There's no rush." />
        )
      }
    />
  );
}
