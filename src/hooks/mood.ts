import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import type { EmotionLabel, MoodInsights, MoodLog } from '@/types';

export const moodKeys = { insights: ['mood', 'insights'] as const };

export function useMoodInsights() {
  return useQuery({
    queryKey: moodKeys.insights,
    queryFn: async () => (await api.get<MoodInsights>('/mood/insights')).data,
  });
}

export function useLogMood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { mood: EmotionLabel; intensity: number; note?: string }) =>
      (await api.post<MoodLog>('/mood', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moodKeys.insights }),
  });
}
