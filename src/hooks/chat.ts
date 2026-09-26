import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import type { ChatMessage, ChatSession, SendMessageResult } from '@/types';

export const chatKeys = {
  all: ['chat'] as const,
  sessions: () => [...chatKeys.all, 'sessions'] as const,
  session: (id: string) => [...chatKeys.all, 'session', id] as const,
};

export function useChatSessions() {
  return useQuery({
    queryKey: chatKeys.sessions(),
    queryFn: async () => (await api.get<ChatSession[]>('/chatbot/sessions')).data,
  });
}

export function useChatSession(id: string) {
  return useQuery({
    queryKey: chatKeys.session(id),
    queryFn: async () => (await api.get<ChatSession>(`/chatbot/session/${id}`)).data,
    enabled: !!id,
  });
}

export function useStartChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<ChatSession>('/chatbot/session')).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.sessions() }),
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/chatbot/session/${id}`);
    },
    onSuccess: (_d, id) => {
      queryClient.removeQueries({ queryKey: chatKeys.session(id) });
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() });
    },
  });
}

const local = (sessionId: string, role: ChatMessage['role'], content: string, isCrisis = false): ChatMessage => ({
  id: `local-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  sessionId,
  role,
  content,
  isCrisis,
  createdAt: new Date().toISOString(),
});

/**
 * Sends a message. The user's bubble appears immediately (optimistic); the
 * assistant's reply is appended when it arrives. If sending fails, the bubble is
 * rolled back and the error is surfaced, so a message is never silently lost
 * (this matters most for crisis messages).
 */
export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const key = chatKeys.session(sessionId);

  return useMutation({
    mutationFn: async (content: string) =>
      (await api.post<SendMessageResult>('/chatbot/message', { sessionId, content })).data,

    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatSession>(key);
      const optimistic = local(sessionId, 'user', content);
      queryClient.setQueryData<ChatSession>(key, (s) => (s ? { ...s, messages: [...(s.messages ?? []), optimistic] } : s));
      return { previous };
    },

    onError: (_e, _content, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },

    onSuccess: (result) => {
      queryClient.setQueryData<ChatSession>(key, (s) =>
        s ? { ...s, messages: [...(s.messages ?? []), local(sessionId, 'assistant', result.reply, result.isCrisis)] } : s,
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions() });
    },
  });
}
