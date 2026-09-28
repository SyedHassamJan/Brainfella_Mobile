import { useRouter } from 'expo-router';
import { Linking } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { HELPLINE } from '@/lib/config';
import type { RiskRecommendation } from '@/types';

const tone: Record<RiskRecommendation['priority'], 'support' | 'peach' | 'surface'> = {
  urgent: 'support',
  high: 'peach',
  normal: 'surface',
};

const actionLabel: Record<NonNullable<RiskRecommendation['action']>, string> = {
  helpline: `Call ${HELPLINE.name}`,
  book_therapist: 'Find a therapist',
  cbt_exercises: 'Browse exercises',
  questionnaire: 'Take a questionnaire',
};

export function RecommendationCard({ recommendation }: { recommendation: RiskRecommendation }) {
  const router = useRouter();

  const go = () => {
    switch (recommendation.action) {
      case 'helpline':
        Linking.openURL(`tel:${HELPLINE.number.replace(/\D/g, '')}`);
        return;
      case 'book_therapist':
        router.push({ pathname: '/care', params: { tab: 'therapists' } });
        return;
      case 'cbt_exercises':
        router.push({ pathname: '/care', params: { tab: 'exercises' } });
        return;
      case 'questionnaire':
        router.push('/screening');
        return;
      default:
        return;
    }
  };

  return (
    <Card tone={tone[recommendation.priority]} className="gap-3">
      <Text variant="body" className={recommendation.priority === 'urgent' ? 'text-support-ink' : 'text-ink'}>
        {recommendation.text}
      </Text>
      {recommendation.action ? (
        <Button
          title={actionLabel[recommendation.action]}
          variant={recommendation.priority === 'urgent' ? 'support' : 'soft'}
          compact
          onPress={go}
        />
      ) : null}
    </Card>
  );
}
