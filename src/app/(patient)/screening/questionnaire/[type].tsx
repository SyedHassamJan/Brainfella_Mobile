import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { QuestionnaireForm } from '@/components/screening/QuestionnaireForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBubble, LoadingState, SupportBanner } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useQuestionnaireDefinition, useSubmitQuestionnaire } from '@/hooks/screening';
import { getErrorMessage } from '@/lib/errors';
import type { QuestionnaireType } from '@/types';

export default function QuestionnaireScreen() {
  const { type } = useLocalSearchParams<{ type: QuestionnaireType }>();
  const router = useRouter();
  const definition = useQuestionnaireDefinition(type);
  const submit = useSubmitQuestionnaire(type);
  const saved = submit.data;

  if (saved) {
    return (
      <Screen>
        <View className="gap-6 pt-6">
          <Reveal index={0}>
            <View className="items-center gap-3">
              <IconBubble icon={CircleCheck} tone="sage" size={64} />
              <Text variant="title" className="text-center">
                Submitted
              </Text>
              <Text variant="small" className="text-center">
                {definition.data?.name ?? type} · Severity: {saved.severityLabel} · Score: {saved.score}
              </Text>
            </View>
          </Reveal>
          {saved.crisisFlag ? (
            <Reveal index={1}>
              <SupportBanner message={saved.crisisSupport} />
            </Reveal>
          ) : null}
          <Reveal index={2}>
            <View className="gap-3">
              <Button title="Get my risk indicator" onPress={() => router.replace('/screening/results')} />
              <Button title="Done" variant="ghost" onPress={() => router.push('/screening')} />
            </View>
          </Reveal>
        </View>
      </Screen>
    );
  }

  if (!type || definition.isPending) {
    return (
      <Screen>
        <PageHeader back title="Questionnaire" />
        <LoadingState />
      </Screen>
    );
  }

  if (definition.isError || !definition.data) {
    return (
      <Screen>
        <PageHeader back title="Questionnaire" />
        <Text variant="small" className="text-support-ink">
          {getErrorMessage(definition.error)}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader back title={definition.data.name} subtitle={definition.data.instructions} />
      <Card className="p-5">
        <QuestionnaireForm
          definition={definition.data}
          submitting={submit.isPending}
          error={submit.isError ? getErrorMessage(submit.error) : undefined}
          onSubmit={(answers) => submit.mutate(answers)}
        />
      </Card>
    </Screen>
  );
}
