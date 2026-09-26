import { Calendar, MapPin, Video } from 'lucide-react-native';
import { Alert, Linking, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar, Badge } from '@/components/ui/controls';
import { EmptyState, ErrorNote, LoadingState } from '@/components/ui/feedback';
import { Text } from '@/components/ui/Text';
import { useAppointments, useCancelAppointment } from '@/hooks/care';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime, isUpcoming } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { Appointment, AppointmentStatus } from '@/types';

const statusUi: Record<AppointmentStatus, { label: string; tone: 'peach' | 'sage' | 'neutral' }> = {
  PENDING: { label: 'Waiting for confirmation', tone: 'peach' },
  CONFIRMED: { label: 'Confirmed', tone: 'sage' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

function AppointmentCard({ a }: { a: Appointment }) {
  const { colors } = useAppTheme();
  const cancel = useCancelAppointment();
  const active = (a.status === 'PENDING' || a.status === 'CONFIRMED') && isUpcoming(a.scheduledAt);
  const Mode = a.sessionType === 'ONLINE' ? Video : MapPin;

  const confirmCancel = () =>
    Alert.alert('Cancel this session?', 'Your therapist will be told. You can always book another time.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel session', style: 'destructive', onPress: () => cancel.mutate(a.id) },
    ]);

  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-3">
        <Avatar name={a.therapist?.name ?? 'T'} />
        <View className="flex-1 gap-0.5">
          <Text variant="bodyStrong">{a.therapist?.name ?? 'Your therapist'}</Text>
          <Text variant="small">{formatDateTime(a.scheduledAt)}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center gap-3">
        <Badge label={statusUi[a.status].label} tone={statusUi[a.status].tone} />
        <View className="flex-row items-center gap-1.5">
          <Mode size={15} color={colors.inkFaint} strokeWidth={1.7} />
          <Text variant="small">
            {a.sessionType === 'ONLINE' ? 'Online' : 'In person'} · {a.duration} min
          </Text>
        </View>
      </View>
      {a.notes ? <Text variant="small">“{a.notes}”</Text> : null}
      {a.status === 'CONFIRMED' && a.meetingLink ? <Button title="Join session" variant="soft" onPress={() => Linking.openURL(a.meetingLink!)} /> : null}
      {a.status === 'COMPLETED' && a.therapistNotes ? (
        <Card tone="lavender" className="gap-1">
          <Text variant="label">NOTE FROM YOUR THERAPIST</Text>
          <Text variant="small" className="text-ink">
            {a.therapistNotes}
          </Text>
        </Card>
      ) : null}
      {cancel.isError ? <Text variant="small" className="text-support-ink">{getErrorMessage(cancel.error)}</Text> : null}
      {active ? <Button title="Cancel session" variant="ghost" loading={cancel.isPending} onPress={confirmCancel} /> : null}
    </Card>
  );
}

export function SessionsList({ onFindTherapist }: { onFindTherapist: () => void }) {
  const q = useAppointments();
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorNote message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />;

  const all = q.data ?? [];
  const upcoming = all.filter((a) => (a.status === 'PENDING' || a.status === 'CONFIRMED') && isUpcoming(a.scheduledAt)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const past = all.filter((a) => !upcoming.includes(a));

  if (all.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No sessions yet"
        message="Talking with a therapist can make a real difference. Browse the therapists and book when you feel ready."
        action={<Button title="Find a therapist" variant="soft" compact onPress={onFindTherapist} />}
      />
    );
  }

  return (
    <View className="gap-5">
      {upcoming.length > 0 ? (
        <View className="gap-3">
          <Text variant="label">COMING UP</Text>
          {upcoming.map((a) => <AppointmentCard key={a.id} a={a} />)}
        </View>
      ) : null}
      {past.length > 0 ? (
        <View className="gap-3">
          <Text variant="label">PAST</Text>
          {past.map((a) => <AppointmentCard key={a.id} a={a} />)}
        </View>
      ) : null}
    </View>
  );
}
