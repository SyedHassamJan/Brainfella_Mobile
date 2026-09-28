import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/controls';
import { Text } from '@/components/ui/Text';
import type { QuestionnaireDefinition } from '@/types';

function Item({ index, prompt, options, value, onChange }: { index: number; prompt: string; options: { value: number; label: string }[]; value: number | null; onChange: (v: number) => void }) {
  return (
    <View className="gap-3">
      <Text variant="bodyStrong">
        {index + 1}. {prompt}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
        ))}
      </View>
    </View>
  );
}

/**
 * Renders one standardized instrument (item wording and options are the
 * published clinical text — never reworded here). The submit button only
 * enables once every item has an answer.
 */
export function QuestionnaireForm({
  definition,
  submitting,
  error,
  onSubmit,
}: {
  definition: QuestionnaireDefinition;
  submitting: boolean;
  error?: string;
  onSubmit: (answers: number[]) => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => definition.items.map(() => null));
  const complete = answers.every((a) => a !== null);

  return (
    <View className="gap-7">
      <View className="gap-6">
        {definition.items.map((prompt, i) => (
          <Item
            key={i}
            index={i}
            prompt={prompt}
            options={definition.options}
            value={answers[i] ?? null}
            onChange={(v) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
          />
        ))}
      </View>
      {error ? (
        <Text variant="small" className="text-support-ink">
          {error}
        </Text>
      ) : null}
      <Button title="Submit" loading={submitting} disabled={!complete} onPress={() => onSubmit(answers as number[])} />
    </View>
  );
}
