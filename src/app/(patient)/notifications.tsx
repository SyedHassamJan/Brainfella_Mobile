import { Bell, Calendar, HeartHandshake, Mail } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorNote, IconBubble, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useMarkNotificationRead, useNotifications } from '@/hooks/notifications';
import { getErrorMessage } from '@/lib/errors';
import { relativeDay } from '@/lib/format';
import type { AppNotification } from '@/types';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const byType = (type: string): { icon: IconType; tone: 'primary' | 'lavender' | 'peach' } => {
  if (type === 'CRISIS_DETECTED') return { icon: HeartHandshake, tone: 'peach' };
  if (type.startsWith('APPOINTMENT')) return { icon: Calendar, tone: 'lavender' };
  if (type === 'REPORT_SENT') return { icon: Mail, tone: 'primary' };
  return { icon: Bell, tone: 'primary' };
};

/** Crisis notifications arrive with an alarm emoji; show them as calm words. */
const calm = (s: string) => s.replace(/🚨\s*/g, '').trim();

export default function NotificationsScreen() {
  const q = useNotifications();
  const mark = useMarkNotificationRead();

  const open = (n: AppNotification) => {
    if (!n.isRead) mark.mutate(n.id);
  };

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <PageHeader back title="Notifications" />
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorNote message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : !q.data?.length ? (
        <EmptyState icon={Bell} title="All quiet" message="When there's something for you, it will appear here." />
      ) : (
        <View className="gap-3">
          {q.data.map((n) => {
            const { icon, tone } = byType(n.type);
            return (
              <Card key={n.id} tone={n.isRead ? 'surface' : 'primary'} onPress={() => open(n)} className="flex-row items-start gap-4">
                <IconBubble icon={icon} tone={tone} />
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text variant="bodyStrong" className="flex-1">
                      {calm(n.title)}
                    </Text>
                    {!n.isRead ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                  </View>
                  <Text variant="small">{calm(n.message)}</Text>
                  <Text variant="small" style={{ opacity: 0.7 }}>
                    {relativeDay(n.createdAt)}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
