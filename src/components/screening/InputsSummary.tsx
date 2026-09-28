import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/controls';
import { Text } from '@/components/ui/Text';
import { formatDateTime } from '@/lib/format';
import type { RiskAssessment } from '@/types';

function Row({ label, included, detail }: { label: string; included: boolean; detail?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1 gap-0.5">
        <Text variant="bodyStrong">{label}</Text>
        {detail ? <Text variant="small">{detail}</Text> : null}
      </View>
      <Badge label={included ? 'Included' : 'Not included'} tone={included ? 'sage' : 'neutral'} />
    </View>
  );
}

/**
 * What actually went into this risk indicator, plainly labeled per input so a
 * result never looks like it came from more than it did. Questionnaires show
 * which instrument and when; typed/spoken text, voice and camera show whether
 * something recent enough (within the fusion layer's own recency window) was
 * found, since the backend doesn't return a spare timestamp for those.
 */
export function InputsSummary({ result }: { result: RiskAssessment }) {
  const { inputsUsed, breakdown } = result;
  const questionnaires = breakdown.questionnairesUsed;

  return (
    <Card className="gap-4">
      <Text variant="label">WHAT WENT INTO THIS</Text>

      <Row
        label="Questionnaire"
        included={inputsUsed.includes('questionnaire')}
        detail={
          questionnaires.length > 0
            ? questionnaires.map((q) => `${q.type} · ${formatDateTime(q.takenAt)}`).join('\n')
            : 'Not included, older than its own recall window or not done'
        }
      />
      <Row
        label="Typed text"
        included={inputsUsed.includes('text')}
        detail={inputsUsed.includes('text') ? 'Included, within the last 24 hours' : 'Not included, older than 24 hours or not done'}
      />
      <Row
        label="Voice"
        included={inputsUsed.includes('voice')}
        detail={inputsUsed.includes('voice') ? 'Included, within the last 24 hours' : 'Not included, older than 24 hours or not done'}
      />
      <Row
        label="Camera"
        included={inputsUsed.includes('facial')}
        detail={inputsUsed.includes('facial') ? 'Included, within the last 24 hours' : 'Not included, older than 24 hours or not done'}
      />
    </Card>
  );
}
