import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import type { JournalEntry, Paginated } from '@/types';

export const journalKeys = {
  all: ['journal'] as const,
  list: () => [...journalKeys.all, 'list'] as const,
  detail: (id: string) => [...journalKeys.all, 'detail', id] as const,
};

const PAGE_SIZE = 10;

export function useJournals() {
  return useInfiniteQuery({
    queryKey: journalKeys.list(),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      (await api.get<Paginated<JournalEntry>>('/journal/my', { params: { page: pageParam, limit: PAGE_SIZE } })).data,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useJournal(id: string) {
  return useQuery({
    queryKey: journalKeys.detail(id),
    queryFn: async () => (await api.get<JournalEntry>(`/journal/${id}`)).data,
    enabled: !!id,
  });
}

export interface JournalInput {
  title?: string;
  content: string;
}

/** Resolves with the saved entry, whose `isCrisis` flag the screen MUST surface. */
export function useCreateJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: JournalInput) => (await api.post<JournalEntry>('/journal', input)).data,
    onSuccess: (entry) => {
      queryClient.setQueryData(journalKeys.detail(entry.id), entry);
      queryClient.invalidateQueries({ queryKey: journalKeys.list() });
    },
  });
}

export function useUpdateJournal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<JournalInput>) => (await api.patch<JournalEntry>(`/journal/${id}`, input)).data,
    onSuccess: (entry) => {
      queryClient.setQueryData(journalKeys.detail(id), entry);
      queryClient.invalidateQueries({ queryKey: journalKeys.list() });
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/journal/${id}`);
    },
    onSuccess: (_d, id) => {
      queryClient.removeQueries({ queryKey: journalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: journalKeys.list() });
    },
  });
}
