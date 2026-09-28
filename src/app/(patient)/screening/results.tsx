import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { InputsSummary } from '@/components/screening/InputsSummary';
import { RecommendationCard } from '@/components/screening/RecommendationCard';
import { RiskBar } from '@/components/screening/RiskBar';
import { RiskDisclaimer } from '@/components/screening/RiskDisclaimer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState, SupportBanner } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAssess } from '@/hooks/screening';
import { getErrorMessage } from '@/lib/errors';

export default function ResultsScreen() {
  const router = useRouter();
  const assess = useAssess();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    assess.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (assess.isPending || assess.isIdle) {
    return (
      <Screen>
        <PageHeader back title="Your risk indicator" />
        <LoadingState label="Bringing your recent inputs together…" />
      </Screen>
    );
  }

  if (assess.isError) {
    return (
      <Screen>
        <PageHeader back title="Your risk indicator" />
        <Card tone="peach" className="gap-4">
          <Text variant="body" className="text-support-ink">
            {getErrorMessage(assess.error)}
          </Text>
        </Card>
        <View className="gap-3">
          <Button title="Add an input" onPress={() => router.replace('/screening')} />
          <Button title="Try again" variant="ghost" onPress={() => assess.mutate()} />
        </View>
      </Screen>
    );
  }

  const result = assess.data!;

  return (
    <Screen>
      <PageHeader back title="Your risk indicator" />

      {result.crisisFlag ? (
        <Reveal index={0}>
          <SupportBanner />
        </Reveal>
      ) : null}

      <Reveal index={1}>
        <RiskDisclaimer />
      </Reveal>

      <Reveal index={2}>
        <Card className="gap-5">
          <RiskBar label="Depression" score={result.depressionRisk} confidence={result.confidence} sources={result.breakdown.conditions.depression?.sources} />
          <RiskBar label="Anxiety" score={result.anxietyRisk} confidence={result.confidence} sources={result.breakdown.conditions.anxiety?.sources} />
          <RiskBar label="Stress" score={result.stressRisk} confidence={result.confidence} sources={result.breakdown.conditions.stress?.sources} />
          <RiskBar label="OCD symptoms" score={result.ocdRisk} confidence={result.confidence} sources={result.breakdown.conditions.ocd?.sources} />
        </Card>
      </Reveal>

      <Reveal index={3}>
        <InputsSummary result={result} />
      </Reveal>

      {result.breakdown.recommendations.length > 0 ? (
        <Reveal index={4}>
          <View className="gap-3">
            <Text variant="heading">What might help</Text>
            {result.breakdown.recommendations.map((r) => (
              <RecommendationCard key={r.id} recommendation={r} />
            ))}
          </View>
        </Reveal>
      ) : null}

      <Reveal index={5}>
        <Button title="View my progress over time" variant="ghost" onPress={() => router.push('/screening/progress')} />
      </Reveal>
    </Screen>
  );
}
