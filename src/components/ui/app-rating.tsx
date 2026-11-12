import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';
import { spacing, touchable } from '@/theme/spacing';

import { AppText } from './app-text';

const STARS = [1, 2, 3, 4, 5] as const;

export interface AppRatingProps {
  /** 0–5; admite decimales en modo `readonly` (se redondea a la estrella más cercana) */
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

const starsLabel = (n: number) => `${n} ${n === 1 ? 'estrella' : 'estrellas'}`;

/** Estrellas de calificación. Editable: cinco botones; solo lectura: un único elemento con el valor en texto. */
export function AppRating({ value, onChange, readonly = false, size = 28 }: AppRatingProps) {
  const { colors } = useAppTheme();
  const filled = Math.round(value);

  if (readonly || !onChange) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Calificación: ${value} de 5 estrellas`}
        style={styles.row}>
        {STARS.map((n) => (
          <AppText
            key={n}
            allowFontScaling={false}
            importantForAccessibility="no"
            color={n <= filled ? colors.payment.pending.text : colors.textSecondary}
            style={{ fontSize: size, lineHeight: size * 1.2 }}>
            {n <= filled ? '★' : '☆'}
          </AppText>
        ))}
      </View>
    );
  }

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Calificación" style={styles.row}>
      {STARS.map((n) => (
        <Pressable
          key={n}
          accessibilityRole="radio"
          accessibilityLabel={starsLabel(n)}
          accessibilityState={{ selected: n === value, checked: n === value }}
          hitSlop={touchable.hitSlop}
          onPress={() => onChange(n)}
          style={styles.star}>
          <AppText
            allowFontScaling={false}
            color={n <= value ? colors.payment.pending.text : colors.textSecondary}
            style={{ fontSize: size, lineHeight: size * 1.2 }}>
            {n <= value ? '★' : '☆'}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  star: { minWidth: touchable.minWidth, minHeight: touchable.minHeight, alignItems: 'center', justifyContent: 'center' },
});
