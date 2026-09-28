import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import type { QuestionnaireType } from '@/types';

const INSTRUMENTS: { type: QuestionnaireType; name: string; measures: string }[] = [
  { type: 'PHQ9', name: 'PHQ-9', measures: 'Depression symptoms' },
  { type: 'GAD7', name: 'GAD-7', measures: 'Anxiety symptoms' },
  { type: 'OCIR', name: 'OCI-R', measures: 'Obsessive-compulsive symptoms' },
  { type: 'DASS21', name: 'DASS-21', measures: 'Depression, anxiety and stress' },
];

export default function QuestionnaireChooserScreen() {
  const router = useRouter();

  return (
    <Screen>
      <PageHeader back title="Choose a questionnaire" subtitle="Standardized, validated instruments. Pick whichever feels relevant." />
      <View className="gap-3">
        {INSTRUMENTS.map((i, index) => (
          <Reveal key={i.type} index={index}>
            <Card onPress={() => router.push({ pathname: '/screening/questionnaire/[type]', params: { type: i.type } })} accessibilityLabel={i.name} className="gap-1">
              <Text variant="bodyStrong">{i.name}</Text>
              <Text variant="small">{i.measures}</Text>
            </Card>
          </Reveal>
        ))}
      </View>
    </Screen>
  );
}
