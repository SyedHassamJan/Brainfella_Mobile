import { HeartHandshake } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { formatTime, relativeDay, snippet } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';
import { emotionLabel, emotions } from '@/theme/tokens';
import type { JournalEntry } from '@/types';

export function EmotionDot({ emotion }: { emotion?: JournalEntry['detectedEmotion'] }) {
  if (!emotion) return null;
  return (
    <View className="flex-row items-center gap-2">
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: emotions[emotion].tint }} />
      <Text variant="small">{emotionLabel(emotion)}</Text>
    </View>
  );
}

export function EntryCard({ entry, onPress }: { entry: JournalEntry; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Card onPress={onPress} className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="label">
          {relativeDay(entry.createdAt).toUpperCase()} · {formatTime(entry.createdAt)}
        </Text>
        {entry.isCrisis ? <HeartHandshake size={18} color={colors.peach} strokeWidth={1.7} /> : null}
      </View>
      {entry.title ? <Text variant="heading">{entry.title}</Text> : null}
      <Text variant="body" className="text-ink-soft" numberOfLines={3}>
        {snippet(entry.content, 160)}
      </Text>
      <View className="flex-row items-center justify-between">
        <EmotionDot emotion={entry.detectedEmotion} />
        {entry.therapistComment ? (
          <Text variant="small" className="text-primary-strong">
            Therapist note
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
