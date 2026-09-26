import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, GraduationCap } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar, Badge } from '@/components/ui/controls';
import { ErrorNote, IconBubble, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Stars } from '@/components/ui/pickers';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';
import { useSubmitReview, useTherapist } from '@/hooks/care';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/format';

function ReviewForm({ profileId }: { profileId: string }) {
  const submit = useSubmitReview(profileId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  if (submit.isSuccess) {
    return (
      <Card tone="primary">
        <Text variant="body">Thank you for sharing your experience. It helps others choose with confidence.</Text>
      </Card>
    );
  }
  return (
    <Card className="gap-4">
      <Text variant="heading">Had a session? Share how it went</Text>
      <Stars value={rating} onChange={setRating} size={30} />
      <TextField placeholder="Anything you'd like others to know (optional)" multiline value={comment} onChangeText={setComment} />
      {submit.isError ? (
        <Text variant="small" className="text-support-ink">
          {getErrorMessage(submit.error)}
        </Text>
      ) : null}
      <Button title="Submit review" variant="soft" disabled={rating === 0} loading={submit.isPending} onPress={() => submit.mutate({ rating, comment: comment.trim() || undefined })} />
    </Card>
  );
}

export default function TherapistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useTherapist(id);

  if (q.isLoading) return <Screen><PageHeader back title="Therapist" /><LoadingState /></Screen>;
  if (q.isError || !q.data) {
    return (
      <Screen>
        <PageHeader back title="Therapist" />
        <ErrorNote message={getErrorMessage(q.error, "We couldn't load this therapist.")} onRetry={() => q.refetch()} />
      </Screen>
    );
  }
  const t = q.data;

  return (
    <Screen
      footer={
        <Button
          title="Book a session"
          onPress={() => router.push({ pathname: '/book/[id]', params: { id: t.user.id, name: t.user.name } })}
        />
      }>
      <View className="gap-6">
        <PageHeader back title={t.user.name} />

        <Reveal index={0}>
          <Card className="items-center gap-3 py-6">
            <Avatar name={t.user.name} size={76} />
            <View className="flex-row items-center gap-2">
              <Stars value={t.rating ?? 0} size={17} />
              <Text variant="small">{t.totalReviews > 0 ? `${(t.rating ?? 0).toFixed(1)} · ${t.totalReviews} review${t.totalReviews === 1 ? '' : 's'}` : 'No reviews yet'}</Text>
            </View>
            {t.specializations.length > 0 ? (
              <View className="flex-row flex-wrap justify-center gap-2">
                {t.specializations.map((s) => <Badge key={s} label={s} tone="lavender" />)}
              </View>
            ) : null}
          </Card>
        </Reveal>

        {t.bio ? (
          <Reveal index={1}>
            <Card className="gap-2">
              <Text variant="heading">About</Text>
              <Text variant="body" className="text-ink-soft">{t.bio}</Text>
            </Card>
          </Reveal>
        ) : null}

        <Reveal index={2}>
          <Card className="gap-4">
            {t.qualifications.length > 0 ? (
              <View className="flex-row items-start gap-3">
                <IconBubble icon={GraduationCap} size={38} />
                <View className="flex-1 gap-0.5">
                  <Text variant="bodyStrong">Qualifications</Text>
                  <Text variant="small">{t.qualifications.join(' · ')}</Text>
                </View>
              </View>
            ) : null}
            <View className="flex-row items-start gap-3">
              <IconBubble icon={Clock} tone="peach" size={38} />
              <View className="flex-1 gap-0.5">
                <Text variant="bodyStrong">Availability</Text>
                <Text variant="small">
                  {t.availableDays.length ? t.availableDays.join(', ') : 'Ask when booking'}
                  {t.availableTimeFrom && t.availableTimeTo ? ` · ${t.availableTimeFrom} to ${t.availableTimeTo}` : ''}
                </Text>
                {t.consultationFee ? <Text variant="small">Consultation fee: PKR {t.consultationFee.toLocaleString()}</Text> : null}
              </View>
            </View>
          </Card>
        </Reveal>

        <ReviewForm profileId={t.id} />

        {t.reviews.length > 0 ? (
          <View className="gap-3">
            <Text variant="heading">What others say</Text>
            {t.reviews.map((r) => (
              <Card key={r.id} className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Stars value={r.rating} size={15} />
                  <Text variant="small">{formatDate(r.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                {r.comment ? <Text variant="body">{r.comment}</Text> : null}
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
