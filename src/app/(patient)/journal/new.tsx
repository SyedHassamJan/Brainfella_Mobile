import { useRouter } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { JournalForm } from '@/components/journal/JournalForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBubble, SupportBanner } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/motion';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useCreateJournal } from '@/hooks/journal';
import { useTour } from '@/tour/TourProvider';
import { getErrorMessage } from '@/lib/errors';

export default function NewJournalScreen() {
  const router = useRouter();
  const create = useCreateJournal();
  const tour = useTour();
  const saved = create.data;

  // After saving: an entry the app flagged as a crisis is NEVER just closed away.
  // The person is thanked, shown warm support and a way to call, and only then continues.
  if (saved) {
    return (
      <Screen>
        <View className="gap-6 pt-6">
          <Reveal index={0}>
            <View className="items-center gap-3">
              <IconBubble icon={CircleCheck} tone="sage" size={64} />
              <Text variant="title" className="text-center">
                Saved
              </Text>
              <Text variant="small" className="text-center">
                Thank you for putting that into words.
              </Text>
            </View>
          </Reveal>
          {saved.isCrisis ? (
            <Reveal index={1}>
              <SupportBanner message="What you wrote sounds like a really painful moment. You don't have to carry it alone, and reaching out is a strong thing to do." />
            </Reveal>
          ) : null}
          <Reveal index={2}>
            <View className="gap-3">
              <Button title="View my entry" variant={saved.isCrisis ? 'soft' : 'primary'} onPress={() => router.replace(`/journal/${saved.id}`)} />
              <Button title="Done" variant="ghost" onPress={() => router.back()} />
            </View>
          </Reveal>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="gap-6">
        <PageHeader back title="New entry" subtitle="Take all the time you need." />
        <Card className="p-5">
          <JournalForm
            submitLabel="Save entry"
            submitting={create.isPending}
            error={create.isError ? getErrorMessage(create.error) : undefined}
            onSubmit={(v) =>
              create.mutate(
                { title: v.title?.trim() || undefined, content: v.content.trim() },
                { onSuccess: (entry) => !entry.isCrisis && tour.notify('journal') },
              )
            }
          />
        </Card>
      </View>
    </Screen>
  );
}
