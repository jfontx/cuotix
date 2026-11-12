import { Text, type TextProps } from 'react-native';

import { useAppTheme } from '@/theme';
import { textStyles, type TextVariant } from '@/theme/typography';

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
};

const HEADER_VARIANTS: TextVariant[] = ['h1', 'h2', 'h3'];

export function AppText({ variant = 'body', color, style, accessibilityRole, ...rest }: AppTextProps) {
  const { colors } = useAppTheme();
  return (
    <Text
      allowFontScaling
      accessibilityRole={accessibilityRole ?? (HEADER_VARIANTS.includes(variant) ? 'header' : undefined)}
      style={[textStyles[variant], { color: color ?? colors.text }, style]}
      {...rest}
    />
  );
}
