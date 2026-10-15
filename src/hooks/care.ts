import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import type {
  Appointment,
  CbtExercise,
  CreateAppointmentInput,
  ExerciseCompletion,
  TherapistDetail,
  TherapistListItem,
  SharingState,
  TherapistConnection,
  TherapistReview,
} from '@/types';

// ---- Appointments
export const appointmentKeys = { mine: ['appointments', 'mine'] as const };

export function useAppointments() {
  return useQuery({
    queryKey: appointmentKeys.mine,
    queryFn: async () => (await api.get<Appointment[]>('/appointment/my')).data,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => (await api.post<Appointment>('/appointment', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentKeys.mine }),
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.patch<Appointment>(`/appointment/${id}/cancel`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appointmentKeys.mine }),
  });
}

// ---- Therapists
export const therapistKeys = {
  all: ['therapists'] as const,
  list: () => [...therapistKeys.all, 'list'] as const,
  detail: (id: string) => [...therapistKeys.all, 'detail', id] as const,
};

export function useTherapists() {
  return useQuery({
    queryKey: therapistKeys.list(),
    queryFn: async () => (await api.get<TherapistListItem[]>('/therapist')).data,
  });
}

/** `id` is the therapist PROFILE id. */
export function useTherapist(id: string) {
  return useQuery({
    queryKey: therapistKeys.detail(id),
    queryFn: async () => (await api.get<TherapistDetail>(`/therapist/${id}`)).data,
    enabled: !!id,
  });
}

export function useSubmitReview(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { rating: number; comment?: string }) =>
      (await api.post<TherapistReview>(`/therapist/review/${profileId}`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: therapistKeys.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: therapistKeys.list() });
    },
  });
}

// ---- CBT exercises
export const cbtKeys = {
  all: ['cbt'] as const,
  list: () => [...cbtKeys.all, 'list'] as const,
  detail: (id: string) => [...cbtKeys.all, 'detail', id] as const,
  completions: () => [...cbtKeys.all, 'completions'] as const,
};

export function useExercises() {
  return useQuery({
    queryKey: cbtKeys.list(),
    queryFn: async () => (await api.get<CbtExercise[]>('/cbt')).data,
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: cbtKeys.detail(id),
    queryFn: async () => (await api.get<CbtExercise>(`/cbt/${id}`)).data,
    enabled: !!id,
  });
}

export function useMyCompletions() {
  return useQuery({
    queryKey: cbtKeys.completions(),
    queryFn: async () => (await api.get<ExerciseCompletion[]>('/cbt/completions/my')).data,
  });
}

export function useCompleteExercise(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { feedback?: string; rating?: number }) =>
      (await api.post<ExerciseCompletion>(`/cbt/${id}/complete`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cbtKeys.completions() }),
  });
}

// ---- Contact and record sharing (by therapist PROFILE id)
export const connectionKeys = { mine: ['therapist-connections', 'mine'] as const };

/** The therapists this patient has contacted or shares records with. */
export function useMyConnections() {
  return useQuery({
    queryKey: connectionKeys.mine,
    queryFn: async () => (await api.get<TherapistConnection[]>('/therapist/connections/me')).data,
  });
}

/** Records a WhatsApp tap so the therapist knows who reached out. Grants no access to records. */
export function useRecordContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => (await api.post<SharingState>(`/therapist/${profileId}/contact`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionKeys.mine }),
  });
}

export function useSetSharing(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (share: boolean) => (await api.put<SharingState>(`/therapist/${profileId}/share`, { share })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: connectionKeys.mine }),
  });
}
