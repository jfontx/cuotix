export const fontSize = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 } as const;

export const lineHeight = { xs: 16, sm: 20, base: 24, lg: 28, xl: 28, '2xl': 32, '3xl': 40 } as const;

export const fontWeight = { regular: '400', medium: '500', semibold: '600', bold: '700' } as const;

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'button';

export const textStyles: Record<TextVariant, { fontSize: number; lineHeight: number; fontWeight: '400' | '500' | '600' | '700' }> = {
  h1: { fontSize: fontSize['2xl'], lineHeight: lineHeight['2xl'], fontWeight: fontWeight.bold },
  h2: { fontSize: fontSize.xl, lineHeight: lineHeight.xl, fontWeight: fontWeight.semibold },
  h3: { fontSize: fontSize.lg, lineHeight: lineHeight.lg, fontWeight: fontWeight.semibold },
  body: { fontSize: fontSize.base, lineHeight: lineHeight.base, fontWeight: fontWeight.regular },
  bodySmall: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, fontWeight: fontWeight.regular },
  caption: { fontSize: fontSize.xs, lineHeight: lineHeight.xs, fontWeight: fontWeight.regular },
  button: { fontSize: fontSize.base, lineHeight: lineHeight.base, fontWeight: fontWeight.semibold },
};
