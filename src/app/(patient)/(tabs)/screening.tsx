import { useRouter } from 'expo-router';
import { Camera, ChartLine, ClipboardList, Mic } from 'lucide-react-native';
import { View } from 'react-native';

import { RiskDisclaimer } from '@/components/screening/RiskDisclaimer';
import { TextCheckIn } from '@/components/screening/TextCheckIn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBubble } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useScreeningHistory } from '@/hooks/screening';
import { formatDate } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';
import { riskLevel } from '@/theme/tokens';
import { TourTarget } from '@/tour/TourTarget';

function InputCard({ icon, title, subtitle, tone, onPress }: { icon: typeof Camera; title: string; subtitle: string; tone: 'primary' | 'lavender' | 'peach'; onPress: () => void }) {
  return (
    <Card onPress={onPress} accessibilityLabel={title} className="flex-1 items-center gap-3 px-3 py-6" style={{ minHeight: 128 }}>
      <IconBubble icon={icon} tone={tone} />
      <View className="items-center gap-0.5">
        <Text variant="bodyStrong" className="text-center">
          {title}
        </Text>
        <Text variant="small" className="text-center">
          {subtitle}
        </Text>
      </View>
    </Card>
  );
}

export default function ScreeningHubScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const history = useScreeningHistory();
  const latest = history.data && history.data.length > 0 ? history.data[history.data.length - 1] : undefined;

  return (
    <Screen tabBarSpace>
      <Reveal index={0}>
        <PageHeader title="Screening" subtitle="A gentle check on how you're doing, whenever you'd like." />
      </Reveal>

      <Reveal index={1}>
        <RiskDisclaimer />
      </Reveal>

      {latest ? (
        <Reveal index={2}>
          <Card tone="primary" onPress={() => router.push('/screening/progress')} className="gap-2">
            <Text variant="label">YOUR LAST RESULT · {formatDate(latest.computedAt)}</Text>
            <View className="flex-row flex-wrap gap-x-5 gap-y-1">
              {latest.depressionRisk !== null ? <Text variant="small">Depression: {riskLevel(latest.depressionRisk).label}</Text> : null}
              {latest.anxietyRisk !== null ? <Text variant="small">Anxiety: {riskLevel(latest.anxietyRisk).label}</Text> : null}
              {latest.stressRisk !== null ? <Text variant="small">Stress: {riskLevel(latest.stressRisk).label}</Text> : null}
              {latest.ocdRisk !== null ? <Text variant="small">OCD symptoms: {riskLevel(latest.ocdRisk).label}</Text> : null}
            </View>
            <Text variant="small" className="text-primary-strong">
              See progress over time →
            </Text>
          </Card>
        </Reveal>
      ) : null}

      <Reveal index={3}>
        <View className="gap-1">
          <Text variant="heading">Add an input</Text>
          <Text variant="small">Any one of these is useful on its own; more together gives a fuller picture.</Text>
        </View>
      </Reveal>

      <Reveal index={4}>
        <View className="flex-row gap-3">
          <TourTarget id="screening.questionnaire" style={{ flex: 1 }}>
            <InputCard icon={ClipboardList} title="Questionnaire" subtitle="A few minutes" tone="primary" onPress={() => router.push('/screening/questionnaire')} />
          </TourTarget>
          <TourTarget id="screening.camera" style={{ flex: 1 }}>
            <InputCard icon={Camera} title="Camera" subtitle="One photo" tone="lavender" onPress={() => router.push('/screening/camera')} />
          </TourTarget>
          <TourTarget id="screening.voice" style={{ flex: 1 }}>
            <InputCard icon={Mic} title="Voice" subtitle="A short clip" tone="peach" onPress={() => router.push('/screening/voice')} />
          </TourTarget>
        </View>
      </Reveal>

      <Reveal index={5}>
        <View className="gap-1">
          <Text variant="heading">Or, a quick typed check-in</Text>
        </View>
      </Reveal>

      <Reveal index={6}>
        <TextCheckIn />
      </Reveal>

      <Reveal index={7}>
        <TourTarget id="screening.results">
          <Button title="Get my risk indicator" onPress={() => router.push('/screening/results')} />
        </TourTarget>
      </Reveal>

      <Reveal index={8}>
        <Button
          title="View my progress over time"
          variant="ghost"
          icon={<ChartLine size={18} color={colors.sage} strokeWidth={1.8} />}
          onPress={() => router.push('/screening/progress')}
        />
      </Reveal>
    </Screen>
  );
}
