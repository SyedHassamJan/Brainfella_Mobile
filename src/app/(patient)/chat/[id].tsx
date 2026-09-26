import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send, Trash } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBubble, TypingBubble } from '@/components/chat/bubbles';
import { Card } from '@/components/ui/Card';
import { ErrorNote, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Text } from '@/components/ui/Text';
import { useChatSession, useDeleteChat, useSendMessage } from '@/hooks/chat';
import { getErrorMessage } from '@/lib/errors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import type { ChatMessage } from '@/types';

export default function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const q = useChatSession(id);
  const send = useSendMessage(id);
  const del = useDeleteChat();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [draft, setDraft] = useState('');
  const lastSent = useRef('');

  const messages = q.data?.messages ?? [];

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length, send.isPending]);

  const submit = (text = draft) => {
    const content = text.trim();
    if (!content || send.isPending) return;
    lastSent.current = content;
    setDraft('');
    send.mutate(content, {
      // A failed send restores the words so nothing typed is lost.
      onError: () => setDraft(content),
    });
  };

  const confirmDelete = () =>
    Alert.alert('Delete this conversation?', 'It will be removed for good.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(id, { onSuccess: () => router.back() }) },
    ]);

  if (q.isLoading) return <View className="flex-1 bg-canvas px-6" style={{ paddingTop: insets.top + 16 }}><PageHeader back title="Conversation" /><LoadingState /></View>;
  if (q.isError) {
    return (
      <View className="flex-1 gap-5 bg-canvas px-6" style={{ paddingTop: insets.top + 16 }}>
        <PageHeader back title="Conversation" />
        <ErrorNote message={getErrorMessage(q.error, "We couldn't open this conversation.")} onRetry={() => q.refetch()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior="padding">
      <View className="px-6" style={{ paddingTop: insets.top + 16 }}>
        <PageHeader
          back
          title="Conversation"
          right={
            <Pressable accessibilityRole="button" accessibilityLabel="Delete conversation" hitSlop={12} onPress={confirmDelete} className="h-11 w-11 items-center justify-center">
              <Trash size={19} color={colors.inkFaint} strokeWidth={1.7} />
            </Pressable>
          }
        />
      </View>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 24, paddingTop: 20, flexGrow: 1 }}
        ListEmptyComponent={
          <Card tone="lavender" className="gap-2">
            <Text variant="bodyStrong">Hello, and welcome.</Text>
            <Text variant="small" className="text-ink">
              Share whatever is on your mind. I'm an AI companion: I can listen and offer ideas, but I'm not a therapist. There's no rush and nothing you have to say.
            </Text>
          </Card>
        }
        ListFooterComponent={send.isPending ? <View style={{ marginTop: 12 }}><TypingBubble /></View> : null}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {send.isError ? (
        <View className="px-6 pb-2">
          <ErrorNote message={`${getErrorMessage(send.error)} Your message hasn't been lost.`} onRetry={() => submit(lastSent.current)} />
        </View>
      ) : null}

      <View className="flex-row items-end gap-3 px-5 pt-2" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="max-h-[132px] min-h-[52px] flex-1 justify-center rounded-[26px] border border-line bg-surface px-5">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write here…"
            placeholderTextColor={colors.inkFaint}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            multiline
            accessibilityLabel="Message"
            style={{ color: colors.ink, fontFamily: fonts.body, fontSize: 16, paddingVertical: 12, maxHeight: 120 }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={!draft.trim() || send.isPending}
          onPress={() => submit()}
          className="h-[52px] w-[52px] items-center justify-center rounded-full bg-primary"
          style={{ opacity: draft.trim() && !send.isPending ? 1 : 0.45 }}>
          <Send size={20} color={colors.primaryInk} strokeWidth={1.8} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
