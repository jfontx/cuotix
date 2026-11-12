import { Platform } from 'react-native';

import { getPushToken } from '@/lib/push';

import { notificationsApi } from './notificationsApi';
import type { AppDispatch } from './index';

/** Registra el dispositivo para recibir push. Nunca falla: sin push la app sigue funcionando. */
export const registerPush = () => async (dispatch: AppDispatch) => {
  const token = await getPushToken();
  if (!token) return;
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
  await dispatch(notificationsApi.endpoints.registerPushToken.initiate({ token, platform })).unwrap().catch(() => undefined);
};
