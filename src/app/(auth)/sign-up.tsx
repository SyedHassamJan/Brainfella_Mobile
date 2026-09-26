import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/controls';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';
import { useSignUp } from '@/hooks/auth';
import { getErrorMessage } from '@/lib/errors';
import { signUpSchema, type SignUpFormValues } from '@/schemas/auth';

export default function SignUpScreen() {
  const signUp = useSignUp();
  const { control, handleSubmit } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  });

  const submit = handleSubmit((v) => signUp.mutate({ name: v.name, email: v.email, password: v.password }));

  return (
    <AuthShell title="Let's get you started" subtitle="Create your private space. It only takes a minute.">
      <View className="gap-5">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              label="What should we call you?"
              placeholder="Your name"
              autoComplete="name"
              textContentType="name"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="Password"
              placeholder="Choose a password"
              hint="At least 8 characters, with a capital letter and a number."
              secure
              autoCapitalize="none"
              textContentType="newPassword"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <TextField
              label="Repeat password"
              placeholder="Type it once more"
              secure
              autoCapitalize="none"
              textContentType="newPassword"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field, fieldState }) => (
            <View className="gap-2">
              <Checkbox
                checked={field.value}
                onChange={field.onChange}
                label="I understand BrainHealth is a support tool, not a replacement for professional care, and that if my messages suggest I may be in danger, a therapist I am working with may be told so they can check in."
              />
              {fieldState.error ? (
                <Text variant="small" className="text-support-ink">
                  {fieldState.error.message}
                </Text>
              ) : null}
            </View>
          )}
        />

        {signUp.isError ? (
          <Text variant="small" className="text-support-ink">
            {getErrorMessage(signUp.error)}
          </Text>
        ) : null}

        <Button title="Create my account" loading={signUp.isPending} onPress={submit} />

        <View className="flex-row items-center justify-center gap-2 pt-2">
          <Text variant="small">Already have an account?</Text>
          <Link href="/sign-in" asChild>
            <Pressable accessibilityRole="link" hitSlop={10}>
              <Text variant="small" className="text-primary-strong">
                Sign in
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthShell>
  );
}
