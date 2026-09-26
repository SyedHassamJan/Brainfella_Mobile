import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/controls';
import { ErrorNote, LoadingState } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';
import { useProfile, useUpdateProfile } from '@/hooks/profile';
import { getErrorMessage } from '@/lib/errors';
import type { UserProfile } from '@/types';

const GENDERS = ['Female', 'Male', 'Other', 'Prefer not to say'];

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  phone: z.string().trim().optional(),
  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))), 'Please use the form YYYY-MM-DD, for example 2003-05-21'),
  gender: z.string().optional(),
  emergencyContact: z.string().trim().optional(),
});
type Values = z.infer<typeof schema>;

function EditForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const update = useUpdateProfile();
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone ?? '',
      dateOfBirth: profile.patientProfile?.dateOfBirth?.split('T')[0] ?? '',
      gender: profile.patientProfile?.gender ?? '',
      emergencyContact: profile.patientProfile?.emergencyContact ?? '',
    },
  });

  const onSubmit = (v: Values) => {
    const patientProfile = {
      // A full ISO timestamp (the API also accepts a bare date now).
      ...(v.dateOfBirth ? { dateOfBirth: `${v.dateOfBirth}T00:00:00.000Z` } : {}),
      ...(v.gender ? { gender: v.gender } : {}),
      ...(v.emergencyContact ? { emergencyContact: v.emergencyContact } : {}),
    };
    update.mutate(
      { name: v.name, ...(v.phone ? { phone: v.phone } : {}), ...(Object.keys(patientProfile).length ? { patientProfile } : {}) },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Card className="gap-5 p-5">
      <Controller control={control} name="name" render={({ field, fieldState }) => (
        <TextField label="Name" autoComplete="name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="phone" render={({ field, fieldState }) => (
        <TextField label="Phone (optional)" keyboardType="phone-pad" autoComplete="tel" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="dateOfBirth" render={({ field, fieldState }) => (
        <TextField label="Date of birth (optional)" placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
      <Controller control={control} name="gender" render={({ field }) => (
        <View className="gap-2.5">
          <Text variant="label">Gender (optional)</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {GENDERS.map((g) => (
              <Chip key={g} label={g} selected={field.value === g} onPress={() => field.onChange(field.value === g ? '' : g)} />
            ))}
          </View>
        </View>
      )} />
      <Controller control={control} name="emergencyContact" render={({ field, fieldState }) => (
        <TextField label="Emergency contact (optional)" placeholder="Name and phone number" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} hint="Someone we could suggest you reach out to." />
      )} />
      {update.isError ? <Text variant="small" className="text-support-ink">{getErrorMessage(update.error)}</Text> : null}
      <Button title="Save" loading={update.isPending} onPress={handleSubmit(onSubmit)} />
    </Card>
  );
}

export default function ProfileEditScreen() {
  const q = useProfile();
  return (
    <Screen>
      <View className="gap-6">
        <PageHeader back title="Your details" />
        {q.isLoading ? <LoadingState /> : q.isError || !q.data ? <ErrorNote message={getErrorMessage(q.error)} onRetry={() => q.refetch()} /> : <EditForm profile={q.data} />}
      </View>
    </Screen>
  );
}
