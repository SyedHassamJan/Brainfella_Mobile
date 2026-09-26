import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Avatar, Badge } from '@/components/ui/controls';
import { EmptyState, ErrorNote, LoadingState } from '@/components/ui/feedback';
import { Stars } from '@/components/ui/pickers';
import { Text } from '@/components/ui/Text';
import { useTherapists } from '@/hooks/care';
import { getErrorMessage } from '@/lib/errors';

export function TherapistsList() {
  const router = useRouter();
  const q = useTherapists();
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorNote message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />;
  if (!q.data?.length) {
    return <EmptyState icon={Users} title="No therapists available yet" message="Please check back soon. New therapists are joining." />;
  }

  return (
    <View className="gap-3.5">
      {q.data.map((t) => (
        <Card key={t.id} onPress={() => router.push(`/therapist/${t.id}`)} className="gap-3">
          <View className="flex-row items-center gap-3">
            <Avatar name={t.user.name} size={52} />
            <View className="flex-1 gap-1">
              <Text variant="bodyStrong">{t.user.name}</Text>
              <View className="flex-row items-center gap-2">
                <Stars value={t.rating ?? 0} size={14} />
                <Text variant="small">
                  {t.totalReviews > 0 ? `${(t.rating ?? 0).toFixed(1)} (${t.totalReviews})` : 'New'}
                </Text>
              </View>
            </View>
          </View>
          {t.specializations.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {t.specializations.slice(0, 3).map((s) => (
                <Badge key={s} label={s} tone="lavender" />
              ))}
            </View>
          ) : null}
          <Text variant="small">
            {t.experienceYears > 0 ? `${t.experienceYears} years of experience` : 'Verified therapist'}
            {t.consultationFee ? ` · PKR ${t.consultationFee.toLocaleString()}` : ''}
          </Text>
        </Card>
      ))}
    </View>
  );
}
