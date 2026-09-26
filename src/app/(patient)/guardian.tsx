import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorNote, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';
import { useProfile, useSetGuardian } from '@/hooks/profile';
import { getErrorMessage } from '@/lib/errors';
import type { GuardianLink } from '@/types';

const schema = z.object({
  guardianEmail: z.string().min(1, 'Please enter their email').email('That email does not look quite right'),
  guardianName: z.string().trim().optional(),
  guardianPhone: z.string().trim().optional(),
  relationship: z.string().trim().optional(),
});
type Values = z.infer<typeof schema>;

function GuardianForm({ current }: { current?: GuardianLink | null }) {
  const router = useRouter();
  const save = useSetGuardian();
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      guardianEmail: current?.guardianEmail ?? '',
      guardianName: current?.guardianName ?? '',
      guardianPhone: current?.guardianPhone ?? '',
      relationship: current?.relationship ?? '',
    },
  });

  const onSubmit = (v: Values) =>
    save.mutate(
      {
        guardianEmail: v.guardianEmail.trim().toLowerCase(),
        ...(v.guardianName ? { guardianName: v.guardianName } : {}),
        ...(v.guardianPhone ? { guardianPhone: v.guardianPhone } : {}),
        ...(v.relationship ? { relationship: v.relationship } : {}),
      },
      { onSuccess: () => router.back() },
    );

  return (
    <View className="gap-5">
      <Card tone="lavender" className="gap-2">
        <Text variant="bodyStrong">Only add someone you trust</Text>
        <Text variant="small" className="text-ink">
          Each week, a short wellness summary is emailed to this person: how your check-ins and journaling have gone, and whether you may have needed extra support. It never includes what you wrote.
        </Text>
      </Card>
      <Card className="gap-5 p-5">
        <Controller control={control} name="guardianEmail" render={({ field, fieldState }) => (
          <TextField label="Their email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
        )} />
        <Controller control={control} name="guardianName" render={({ field }) => (
          <TextField label="Their name (optional)" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
        )} />
        <Controller control={control} name="relationship" render={({ field }) => (
          <TextField label="Relationship (optional)" placeholder="Parent, sibling, friend…" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
        )} />
        <Controller control={control} name="guardianPhone" render={({ field }) => (
          <TextField label="Their phone (optional)" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} />
        )} />
        {save.isError ? <Text variant="small" className="text-support-ink">{getErrorMessage(save.error)}</Text> : null}
        <Button title={current ? 'Update' : 'Save'} loading={save.isPending} onPress={handleSubmit(onSubmit)} />
      </Card>
    </View>
  );
}

export default function GuardianScreen() {
  const q = useProfile();
  return (
    <Screen>
      <View className="gap-6">
        <PageHeader back title="Guardian" subtitle="A trusted person who receives a weekly summary." />
        {q.isLoading ? <LoadingState /> : q.isError ? <ErrorNote message={getErrorMessage(q.error)} onRetry={() => q.refetch()} /> : <GuardianForm current={q.data?.guardianLink} />}
      </View>
    </Screen>
  );
}
