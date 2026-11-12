import { StyleSheet, type StyleProp } from 'react-native';

/** Aplana un `style` (posiblemente anidado) a un objeto para poder inspeccionarlo. */
export const flattenStyle = (style: StyleProp<object>) => (StyleSheet.flatten(style) ?? {}) as Record<string, number>;
