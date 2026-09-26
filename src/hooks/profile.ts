import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import { useAuthStore } from '@/store/authStore';
import type { GuardianLink, SetGuardianInput, UpdateProfileInput, UserProfile } from '@/types';

export const profileKeys = { me: ['profile'] as const };

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: async () => (await api.get<UserProfile>('/user/profile')).data,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    // PATCH returns only the base user fields (no patient sub-profile), so refetch the full profile.
    mutationFn: async (input: UpdateProfileInput) => (await api.patch<Pick<UserProfile, 'id' | 'name' | 'email' | 'role'>>('/user/profile', input)).data,
    onSuccess: (updated) => {
      const user = useAuthStore.getState().user;
      if (user && updated.name) useAuthStore.getState().setUser({ ...user, name: updated.name });
      return queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}

export function useSetGuardian() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetGuardianInput) => (await api.post<GuardianLink>('/user/guardian', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.me }),
  });
}
