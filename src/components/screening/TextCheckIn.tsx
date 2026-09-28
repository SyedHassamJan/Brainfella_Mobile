import { CircleCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconBubble, SupportBanner } from '@/components/ui/feedback';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';
import { useAnalyzeText } from '@/hooks/screening';
import { getErrorMessage } from '@/lib/errors';

/** A quick typed check-in: analyzed for language signals (sentiment, emotion, depression/anxiety/stress cues). */
export function TextCheckIn() {
  const analyze = useAnalyzeText();
  const [text, setText] = useState('');

  const reset = () => {
    analyze.reset();
    setText('');
  };

  if (analyze.isSuccess) {
    const result = analyze.data;
    return (
      <Card className="gap-4">
        <View className="items-center gap-3 py-2">
          <IconBubble icon={CircleCheck} tone="sage" />
          <Text variant="heading">Thanks for sharing that</Text>
          {!result.available ? (
            <Text variant="small" className="text-center">
              We couldn&apos;t read language signals from that this time — it still counts as a check-in.
            </Text>
          ) : null}
        </View>
        {result.crisisFlag ? <SupportBanner message={result.crisisSupport} /> : null}
        <Button title="Write another check-in" variant="soft" compact onPress={reset} />
      </Card>
    );
  }

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Text variant="heading">A few words</Text>
        <Text variant="small">Write freely about how things are for you right now. There&apos;s no right way to do this.</Text>
      </View>
      <TextField placeholder="Right now I feel…" value={text} onChangeText={setText} multiline />
      {analyze.isError ? (
        <Text variant="small" className="text-support-ink">
          {getErrorMessage(analyze.error)}
        </Text>
      ) : null}
      <Button title="Check in with this" loading={analyze.isPending} disabled={text.trim().length < 3} onPress={() => analyze.mutate(text.trim())} />
    </Card>
  );
}
