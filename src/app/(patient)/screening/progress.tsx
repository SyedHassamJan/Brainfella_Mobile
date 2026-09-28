import { ChartLine } from 'lucide-react-native';

import { ProgressChart } from '@/components/screening/ProgressChart';
import { Card } from '@/components/ui/Card';
import { EmptyState, ErrorNote, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useScreeningHistory } from '@/hooks/screening';
import { getErrorMessage } from '@/lib/errors';

export default function ProgressScreen() {
  const history = useScreeningHistory();

  return (
    <Screen>
      <PageHeader back title="Your progress" subtitle="Risk indicators over time, from every past check-in." />

      {history.isLoading ? <LoadingState /> : null}
      {history.isError ? <ErrorNote message={getErrorMessage(history.error)} onRetry={() => history.refetch()} /> : null}

      {history.data && history.data.length === 0 ? (
        <EmptyState icon={ChartLine} title="No history yet" message="Once you've completed a check-in and gotten a risk indicator, it will show up here." />
      ) : null}

      {history.data && history.data.length > 0 ? (
        <Reveal index={0}>
          <Card className="gap-4">
            <Text variant="label">RISK INDICATOR, 0–100</Text>
            <ProgressChart data={history.data} />
          </Card>
        </Reveal>
      ) : null}
    </Screen>
  );
}
