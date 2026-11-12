// El `requestAnimationFrame` del preset de React Native llama a `jest.now()`; si el callback se dispara
// cuando Jest ya cerró el entorno, lanza "accessed after it has been torn down". Esta versión no depende de `jest`.
Object.defineProperty(globalThis, 'requestAnimationFrame', {
  configurable: true,
  writable: true,
  value: (callback: (time: number) => void) => setTimeout(() => callback(Date.now()), 0),
});

// Reanimated no se puede cargar en el entorno de Jest; se mockea el componente que lo usa.
jest.mock('@/components/animated-icon', () => ({
  AnimatedIcon: () => null,
  AnimatedSplashOverlay: () => null,
}));

// Módulos nativos de notificaciones: sin dispositivo real no hay token ni permisos.
jest.mock('expo-device', () => ({ isDevice: false }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test]', type: 'expo' })),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { HIGH: 4 },
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));
