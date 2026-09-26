import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/controls';
import { IconBubble } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { DateTimeField } from '@/components/ui/pickers';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';
import { useBookAppointment } from '@/hooks/care';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import type { SessionType } from '@/types';

const DURATIONS = [30, 45, 60, 90];
const MIN_LEAD_MS = 30 * 60 * 1000;

/** Default suggestion: tomorrow at 10:00. */
function tomorrowMorning() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

/** `id` here is the therapist's USER id (what the API books against). */
export default function BookScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const book = useBookAppointment();
  const [when, setWhen] = useState(tomorrowMorning);
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState<SessionType>('ONLINE');
  const [notes, setNotes] = useState('');
  const [tooSoon, setTooSoon] = useState(false);

  if (book.isSuccess) {
    return (
      <Screen>
        <View className="gap-6 pt-6">
          <Reveal index={0}>
            <View className="items-center gap-3">
              <IconBubble icon={CircleCheck} tone="sage" size={64} />
              <Text variant="title" className="text-center">Request sent</Text>
              <Text variant="small" className="text-center">
                {name ? `${name} ` : 'Your therapist '}will confirm your session for {formatDateTime(book.data.scheduledAt)}. We'll let you know as soon as they do.
              </Text>
            </View>
          </Reveal>
          <Reveal index={1}>
            <Button title="See my sessions" onPress={() => router.replace({ pathname: '/care', params: { tab: 'sessions' } })} />
          </Reveal>
        </View>
      </Screen>
    );
  }

  const submit = () => {
    if (when.getTime() < Date.now() + MIN_LEAD_MS) {
      setTooSoon(true);
      return;
    }
    setTooSoon(false);
    book.mutate({ therapistId: id, scheduledAt: when.toISOString(), duration, sessionType: type, notes: notes.trim() || undefined });
  };

  return (
    <Screen>
      <View className="gap-6">
        <PageHeader back title="Book a session" subtitle={name ? `With ${name}` : undefined} />
        <Card className="gap-6">
          <DateTimeField label="WHEN" value={when} onChange={(d) => { setWhen(d); setTooSoon(false); }} minimumDate={new Date()} />
          {tooSoon ? <Text variant="small" className="text-support-ink">Please choose a time at least 30 minutes from now.</Text> : null}

          <View className="gap-2.5">
            <Text variant="label">HOW LONG</Text>
            <View className="flex-row flex-wrap gap-2.5">
              {DURATIONS.map((d) => <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />)}
            </View>
          </View>

          <View className="gap-2.5">
            <Text variant="label">HOW</Text>
            <View className="flex-row gap-2.5">
              <Chip label="Online" selected={type === 'ONLINE'} onPress={() => setType('ONLINE')} />
              <Chip label="In person" selected={type === 'IN_PERSON'} onPress={() => setType('IN_PERSON')} />
            </View>
          </View>

          <TextField label="ANYTHING TO SHARE FIRST? (OPTIONAL)" placeholder="What would you like to talk about?" multiline value={notes} onChangeText={setNotes} />

          {book.isError ? <Text variant="small" className="text-support-ink">{getErrorMessage(book.error)}</Text> : null}
          <Button title="Request this time" loading={book.isPending} onPress={submit} />
        </Card>
      </View>
    </Screen>
  );
}
