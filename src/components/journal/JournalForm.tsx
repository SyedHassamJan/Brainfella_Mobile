import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';

const schema = z.object({
  // Match the API: title up to 100 characters; content has no minimum length, just not empty.
  title: z.string().max(100, 'A shorter title works best (up to 100 characters)').optional(),
  content: z.string().trim().min(1, 'Write a few words first, whatever comes to mind'),
});
export type JournalFormValues = z.infer<typeof schema>;

export function JournalForm({
  initial,
  submitLabel,
  submitting,
  error,
  onSubmit,
}: {
  initial?: Partial<JournalFormValues>;
  submitLabel: string;
  submitting: boolean;
  /** Save failures are always shown: a journal entry (and any crisis flag on it) must never vanish silently. */
  error?: string;
  onSubmit: (v: JournalFormValues) => void;
}) {
  const { control, handleSubmit } = useForm<JournalFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: initial?.title ?? '', content: initial?.content ?? '' },
  });

  return (
    <View className="gap-5">
      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <TextField label="Title (optional)" placeholder="A few words to remember it by" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )}
      />
      <Controller
        control={control}
        name="content"
        render={({ field, fieldState }) => (
          <TextField
            label="What's on your mind?"
            placeholder="Write freely. There's no right way to do this."
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      {error ? (
        <Text variant="small" className="text-support-ink">
          {error} Your words are still here. Please try saving again.
        </Text>
      ) : null}
      <Button title={submitLabel} loading={submitting} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
