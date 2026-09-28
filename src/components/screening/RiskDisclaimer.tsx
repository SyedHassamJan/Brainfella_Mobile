import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

/**
 * Shown everywhere a risk indicator or screening result is displayed, not just
 * once — this is a screening result, never a diagnosis or the output of a
 * trained prediction model.
 */
export function RiskDisclaimer() {
  return (
    <Card tone="lavender" className="gap-1">
      <Text variant="label">A SCREENING RESULT, NOT A DIAGNOSIS</Text>
      <Text variant="small">
        This combines self-report questionnaires with signals from pretrained models using fixed rules — not a
        trained prediction model. Please speak with a qualified professional about your results.
      </Text>
    </Card>
  );
}
