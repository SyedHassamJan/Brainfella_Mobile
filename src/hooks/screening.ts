import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import type {
  FaceAnalysisResult,
  QuestionnaireDefinition,
  QuestionnaireResponse,
  QuestionnaireType,
  RiskAssessment,
  TextAnalysisResult,
  VoiceAnalysisResult,
} from '@/types';

export const screeningKeys = {
  all: ['screening'] as const,
  history: () => [...screeningKeys.all, 'history'] as const,
  questionnaire: (type: QuestionnaireType) => [...screeningKeys.all, 'questionnaire', type] as const,
};

// Voice (Whisper on CPU) and face analysis run the ML models synchronously and can
// take well past the app's default 15 s request timeout; the backend itself allows
// up to 90 s (voice) and 60 s (face), so the client must too.
const VOICE_TIMEOUT_MS = 95_000;
const FACE_TIMEOUT_MS = 65_000;

export function useQuestionnaireDefinition(type: QuestionnaireType) {
  return useQuery({
    queryKey: screeningKeys.questionnaire(type),
    queryFn: async () => (await api.get<QuestionnaireDefinition>(`/questionnaire/${type}`)).data,
    // The route param isn't always settled on the very first render (same reason
    // useJournal(id) guards on `id`): firing early sent `/questionnaire/undefined`,
    // which the backend's ParseEnumPipe rejects as "enum string is expected".
    enabled: !!type,
  });
}

/** Resolves with the saved response, whose severity/crisis handling the screen MUST surface. */
export function useSubmitQuestionnaire(type: QuestionnaireType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (answers: number[]) =>
      (await api.post<QuestionnaireResponse>(`/questionnaire/${type}/submit`, { answers })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: screeningKeys.history() }),
  });
}

/** Analyzes typed text. Resolves with language signals the results screen must surface, including any crisis flag. */
export function useAnalyzeText() {
  return useMutation({
    mutationFn: async (text: string) => (await api.post<TextAnalysisResult>('/screening/analyze-text', { text })).data,
  });
}

/** Analyzes a short voice recording (base64 audio). Slow: see VOICE_TIMEOUT_MS. */
export function useAnalyzeVoice() {
  return useMutation({
    mutationFn: async (input: { audio: string; language?: string }) =>
      (await api.post<VoiceAnalysisResult>('/screening/analyze-voice', input, { timeout: VOICE_TIMEOUT_MS })).data,
  });
}

/** Analyzes a single captured photo (base64 image). Slow: see FACE_TIMEOUT_MS. */
export function useAnalyzeFace() {
  return useMutation({
    mutationFn: async (image: string) =>
      (await api.post<FaceAnalysisResult>('/screening/analyze-face', { image }, { timeout: FACE_TIMEOUT_MS })).data,
  });
}

/** Fuses recent questionnaires + stored signals into a risk indicator. 422 means "nothing recent to assess". */
export function useAssess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<RiskAssessment>('/screening/assess')).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: screeningKeys.history() }),
  });
}

/** Past risk-indicator assessments, oldest first, for the progress chart. */
export function useScreeningHistory() {
  return useQuery({
    queryKey: screeningKeys.history(),
    queryFn: async () => (await api.get<RiskAssessment[]>('/screening/history')).data,
  });
}
