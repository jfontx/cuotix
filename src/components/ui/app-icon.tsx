import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Text } from 'react-native';

import { useAppTheme } from '@/theme';

/** Nombre semántico → símbolo SF (iOS) y glifo de respaldo para Android/web. */
const ICONS = {
  clock: { sf: 'clock', glyph: '◷' },
  send: { sf: 'paperplane', glyph: '➤' },
  'check-circle': { sf: 'checkmark.circle', glyph: '✓' },
  'alert-triangle': { sf: 'exclamationmark.triangle', glyph: '⚠' },
  'x-circle': { sf: 'xmark.circle', glyph: '✕' },
  error: { sf: 'exclamationmark.circle', glyph: '!' },
  close: { sf: 'xmark', glyph: '✕' },
  info: { sf: 'info.circle', glyph: 'i' },
} as const satisfies Record<string, { sf: SymbolViewProps['name']; glyph: string }>;

export type AppIconName = keyof typeof ICONS;

export interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  /** Si se omite el icono es decorativo y se oculta a los lectores de pantalla */
  accessibilityLabel?: string;
}

export function AppIcon({ name, size = 20, color, accessibilityLabel }: AppIconProps) {
  const { colors } = useAppTheme();
  const tint = color ?? colors.text;
  const a11y = accessibilityLabel
    ? ({ accessible: true, accessibilityRole: 'image', accessibilityLabel } as const)
    : ({ accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const);
  const { sf, glyph } = ICONS[name];

  return (
    <SymbolView
      testID={`icon-${name}`}
      name={sf}
      size={size}
      tintColor={tint}
      {...a11y}
      fallback={
        <Text allowFontScaling={false} style={{ color: tint, fontSize: size * 0.9, lineHeight: size, width: size, textAlign: 'center' }} {...a11y}>
          {glyph}
        </Text>
      }
    />
  );
}
