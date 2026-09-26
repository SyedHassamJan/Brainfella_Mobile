import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Text } from '@/components/ui/Text';
import { useAuth, useSignIn } from '@/hooks/auth';
import { getErrorMessage } from '@/lib/errors';
import { signInSchema, type SignInFormValues } from '@/schemas/auth';
import { useAuthStore } from '@/store/authStore';

export default function SignInScreen() {
  const { sessionExpired } = useAuth();
  const signIn = useSignIn();
  const { control, handleSubmit } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  // Once shown, the "session ended" note has done its job.
  useEffect(() => () => useAuthStore.getState().clearSessionExpired(), []);

  return (
    <AuthShell title="Welcome back" subtitle="A calm place to check in with yourself. Take your time.">
      <View className="gap-5">
        {sessionExpired ? (
          <Card tone="lavender">
            <Text variant="small" className="text-ink">
              Your session ended, so we signed you out to keep your space private. Please sign in again.
            </Text>
          </Card>
        ) : null}

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
              placeholder="Your password"
              secure
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              onSubmitEditing={handleSubmit((v) => signIn.mutate(v))}
              returnKeyType="go"
            />
          )}
        />

        {signIn.isError ? (
          <Text variant="small" className="text-support-ink">
            {signIn.error && (signIn.error as { response?: { status?: number } }).response?.status === 401
              ? "That email and password don't match. Please check them and try again."
              : getErrorMessage(signIn.error)}
          </Text>
        ) : null}

        <Button title="Sign in" loading={signIn.isPending} onPress={handleSubmit((v) => signIn.mutate(v))} />

        <View className="flex-row items-center justify-center gap-2 pt-2">
          <Text variant="small">New here?</Text>
          <Link href="/sign-up" asChild>
            <Pressable accessibilityRole="link" hitSlop={10}>
              <Text variant="small" className="text-primary-strong">
                Create an account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthShell>
  );
}
