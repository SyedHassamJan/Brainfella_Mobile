import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/api';
import type { AppNotification } from '@/types';

export const notificationKeys = { mine: ['notifications', 'mine'] as const };

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.mine,
    queryFn: async () => (await api.get<AppNotification[]>('/notification/my')).data,
    // Cheap and gentle: refresh the badge occasionally while the app is open.
    refetchInterval: 60_000,
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.isRead).length ?? 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notification/${id}/read`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.mine });
      const previous = queryClient.getQueryData<AppNotification[]>(notificationKeys.mine);
      queryClient.setQueryData<AppNotification[]>(notificationKeys.mine, (list) =>
        list?.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notificationKeys.mine, ctx.previous);
    },
  });
}
