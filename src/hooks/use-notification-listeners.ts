import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { routeForNotification, tagsForNotification } from '@/lib/push';
import { api } from '@/store/api';
import type { NotificationType } from '@/store/notificationsApi';

type PushData = { type?: NotificationType; paymentId?: string; groupId?: string };

/** Mientras hay sesión: refresca los datos al llegar un push y navega al tocarlo. */
export function useNotificationListeners(enabled: boolean) {
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const received = Notifications.addNotificationReceivedListener((n) => {
      const data = n.request.content.data as PushData;
      dispatch(api.util.invalidateTags(tagsForNotification(data.type, data)));
    });
    const response = Notifications.addNotificationResponseReceivedListener((r) => {
      if (r.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const data = r.notification.request.content.data as PushData;
      dispatch(api.util.invalidateTags(tagsForNotification(data.type, data)));
      const route = routeForNotification({ data });
      router.push(route ?? '/notifications');
    });
    return () => {
      received.remove();
      response.remove();
    };
  }, [enabled, dispatch, router]);
}
