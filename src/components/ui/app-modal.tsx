import { Modal, Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { useAppTheme } from '@/theme';
import { borderRadius, spacing, touchable } from '@/theme/spacing';

import { AppIcon } from './app-icon';
import { AppText } from './app-text';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Hoja inferior accesible: se cierra con el botón, tocando el fondo o con el gesto de retroceso. */
export function AppModal({ visible, onClose, title, children }: AppModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.root}>
        {/* Cerrar al tocar el fondo es un atajo visual; el botón del encabezado es el control accesible */}
        <Pressable
          testID="modal-backdrop"
          accessible={false}
          importantForAccessibility="no"
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <AppText variant="h2" style={styles.title}>
              {title}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={touchable.hitSlop}
              onPress={onClose}
              style={styles.close}>
              <AppIcon name="close" size={20} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1 },
  close: { minWidth: touchable.minWidth, minHeight: touchable.minHeight, alignItems: 'center', justifyContent: 'center' },
});
