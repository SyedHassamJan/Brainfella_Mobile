import { useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import { NotPatientError } from '@/lib/errors';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse } from '@/types';

export interface SignInValues {
  email: string;
  password: string;
}
export interface SignUpValues extends SignInValues {
  name: string;
}

/**
 * The app is patient-only for now. If someone else signs in (therapist, guardian,
 * admin) we never keep their session: revoke the tokens the server just issued
 * and tell them, kindly, where to go.
 */
async function requirePatient(data: AuthResponse): Promise<AuthResponse> {
  if (data.role === 'PATIENT') return data;
  try {
    await api.post('/auth/signout', undefined, { headers: { Authorization: `Bearer ${data.accessToken}` } });
  } catch {
    // Best effort: we hold no token for them either way.
  }
  throw new NotPatientError();
}

function startSession(data: AuthResponse) {
  useAuthStore.getState().signIn({
    user: { id: data.id, name: data.name, role: data.role },
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async (values: SignInValues) => {
      const res = await api.post<AuthResponse>('/auth/signin', {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      return requirePatient(res.data);
    },
    onSuccess: startSession,
  });
}

/** Registers, then signs in (the API's signup returns no tokens). New accounts are patients. */
export function useSignUp() {
  return useMutation({
    mutationFn: async (values: SignUpValues) => {
      const email = values.email.trim().toLowerCase();
      await api.post('/auth/signup', { name: values.name.trim(), email, password: values.password });
      const res = await api.post<AuthResponse>('/auth/signin', { email, password: values.password });
      return requirePatient(res.data);
    },
    onSuccess: startSession,
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/signout'); // invalidates the refresh token server-side
      } catch {
        // Offline or already expired: still sign out locally.
      }
    },
    onSettled: () => {
      useAuthStore.getState().logout();
      queryClient.clear(); // never leave one person's data in memory for the next
    },
  });
}

/** Convenience selector for screens. */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  return { user, isAuthenticated, hasHydrated, sessionExpired };
}
