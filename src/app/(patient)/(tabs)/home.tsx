import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Calendar, MessageCircle, NotebookPen, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { BreathePrompt } from '@/components/home/BreathePrompt';
import { MoodCheckIn } from '@/components/home/MoodCheckIn';
import { WeekInsights } from '@/components/home/WeekInsights';
import { Card } from '@/components/ui/Card';
import { IconBubble } from '@/components/ui/feedback';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/hooks/auth';
import { useAppointments } from '@/hooks/care';
import { firstName, formatDateTime, greeting, isUpcoming } from '@/lib/format';

function QuickAction({ icon, label, onPress, tone }: { icon: typeof Calendar; label: string; onPress: () => void; tone: 'primary' | 'lavender' | 'peach' }) {
  return (
    <View className="flex-1">
      <Card onPress={onPress} accessibilityLabel={label} className="items-center gap-3 px-2 py-5">
        <IconBubble icon={icon} tone={tone} />
        <Text variant="small" className="text-center text-ink">
          {label}
        </Text>
      </Card>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: appointments } = useAppointments();
  const [refreshing, setRefreshing] = useState(false);

  const next = appointments
    ?.filter((a) => (a.status === 'PENDING' || a.status === 'CONFIRMED') && isUpcoming(a.scheduledAt))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];

  const refresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  return (
    <Screen tabBarSpace refreshing={refreshing} onRefresh={refresh}>
      <Reveal index={0}>
        <View className="gap-1.5 pt-2">
          <Text variant="small">{greeting()}</Text>
          <Text variant="display">{firstName(user?.name) || 'Welcome'}</Text>
          <Text variant="body" className="text-ink-soft">
            How are you arriving today?
          </Text>
        </View>
      </Reveal>

      <Reveal index={1}>
        <BreathePrompt />
      </Reveal>

      <Reveal index={2}>
        <MoodCheckIn />
      </Reveal>

      <Reveal index={3}>
        <WeekInsights />
      </Reveal>

      <Reveal index={4}>
        <View className="flex-row gap-3">
          <QuickAction icon={NotebookPen} label="Write it down" tone="primary" onPress={() => router.push('/journal/new')} />
          <QuickAction icon={MessageCircle} label="Talk it through" tone="lavender" onPress={() => router.push('/chat')} />
          <QuickAction icon={Sprout} label="Try an exercise" tone="peach" onPress={() => router.push({ pathname: '/care', params: { tab: 'exercises' } })} />
        </View>
      </Reveal>

      {next ? (
        <Reveal index={5}>
          <Card tone="lavender" onPress={() => router.push({ pathname: '/care', params: { tab: 'sessions' } })} className="flex-row items-center gap-4">
            <IconBubble icon={Calendar} tone="lavender" />
            <View className="flex-1 gap-0.5">
              <Text variant="label">{next.status === 'CONFIRMED' ? 'UP NEXT' : 'AWAITING CONFIRMATION'}</Text>
              <Text variant="bodyStrong">{next.therapist?.name ?? 'Your therapist'}</Text>
              <Text variant="small">{formatDateTime(next.scheduledAt)}</Text>
            </View>
          </Card>
        </Reveal>
      ) : null}
    </Screen>
  );
}
