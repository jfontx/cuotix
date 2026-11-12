import * as Haptics from 'expo-haptics';

let enabled = true;

/** Lo sincroniza `ThemeProvider` con la preferencia `settings.haptics`. */
export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export const isHapticsEnabled = () => enabled;

// El feedback es decorativo: nunca debe romper la acción (web / dispositivos sin motor háptico).
const run = (fn: () => Promise<void>) => {
  if (enabled) fn().catch(() => undefined);
};

export const haptics = {
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  select: () => run(() => Haptics.selectionAsync()),
};
