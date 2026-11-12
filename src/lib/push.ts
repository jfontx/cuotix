import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationType } from '@/store/notificationsApi';

// En primer plano se muestra el banner igual que en segundo plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Token de este dispositivo, para borrarlo del servidor al cerrar sesión. */
let currentToken: string | null = null;
export const getCurrentPushToken = () => currentToken;
export const clearCurrentPushToken = () => {
  currentToken = null;
};

/** Pide permiso y obtiene el token de Expo; `null` si no se puede (simulador, permiso denegado, sin red). */
export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Cuotix',
        importance: AndroidImportance.HIGH,
      });
    }
    let granted = (await Notifications.getPermissionsAsync()).granted;
    if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    currentToken = data;
    return data;
  } catch {
    return null;
  }
}

type Tag = { type: 'Payment' | 'Group' | 'Membership' | 'Notification'; id: string };

/** Qué datos en caché quedan obsoletos cuando llega una notificación de este tipo. */
export function tagsForNotification(type: NotificationType | undefined, data?: { paymentId?: string }): Tag[] {
  const tags: Tag[] = [{ type: 'Notification', id: 'LIST' }];
  if (type?.startsWith('PAYMENT_')) {
    if (data?.paymentId) tags.push({ type: 'Payment', id: data.paymentId });
    tags.push({ type: 'Payment', id: 'LIST' });
  } else if (type === 'GROUP_CLOSED') {
    tags.push({ type: 'Group', id: 'LIST' }, { type: 'Payment', id: 'LIST' });
  } else if (type) {
    tags.push({ type: 'Group', id: 'LIST' }, { type: 'Membership', id: 'LIST' });
  }
  return tags;
}

/** Ruta a la que lleva una notificación (o `null` si solo informa). */
export function routeForNotification(n: { paymentId?: string | null; data?: { groupId?: string; paymentId?: string } | null }) {
  const paymentId = n.paymentId ?? n.data?.paymentId;
  if (paymentId) return `/payments/${paymentId}` as const;
  if (n.data?.groupId) return `/groups/${n.data.groupId}` as const;
  return null;
}
