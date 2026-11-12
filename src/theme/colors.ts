export interface PaymentColors {
  bg: string;
  text: string;
  border: string;
}

export type PaymentStatus = 'pending' | 'markedPaid' | 'confirmed' | 'overdue' | 'cancelled';

export interface AppColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  /** Texto/icono sobre `primary` */
  onPrimary: string;
  primarySubtle: string;
  secondary: string;
  error: string;
  errorBg: string;
  overlay: string;
  payment: Record<PaymentStatus, PaymentColors>;
}

export const lightColors: AppColors = {
  background: '#FAFAF9',
  surface: '#FFFFFF',
  border: '#D6D3D1',
  text: '#1C1917',
  textSecondary: '#57534E',
  primary: '#007A62',
  onPrimary: '#FFFFFF',
  primarySubtle: '#E6F4F1',
  secondary: '#F5B800',
  error: '#B91C1C',
  errorBg: '#FEF2F2',
  overlay: 'rgba(0,0,0,0.5)',
  payment: {
    pending: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
    markedPaid: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    confirmed: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
    overdue: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
    cancelled: { bg: '#F5F5F4', text: '#57534E', border: '#D6D3D1' },
  },
};

export const darkColors: AppColors = {
  background: '#0C0A09',
  surface: '#292524',
  border: '#57534E',
  text: '#FAFAF9',
  textSecondary: '#D6D3D1',
  primary: '#2DD4A8',
  onPrimary: '#00352D',
  primarySubtle: '#004C3F',
  secondary: '#FBBF24',
  error: '#FCA5A5',
  errorBg: '#7F1D1D',
  overlay: 'rgba(0,0,0,0.7)',
  payment: {
    pending: { bg: '#422006', text: '#FDE68A', border: '#78350F' },
    markedPaid: { bg: '#1E3A5F', text: '#BFDBFE', border: '#1E40AF' },
    confirmed: { bg: '#064E3B', text: '#A7F3D0', border: '#065F46' },
    overdue: { bg: '#7F1D1D', text: '#FECACA', border: '#991B1B' },
    cancelled: { bg: '#292524', text: '#A8A29E', border: '#44403C' },
  },
};

/** Variantes de alto contraste: texto negro/blanco puro y bordes marcados */
export const highContrastLight: AppColors = {
  ...lightColors,
  background: '#FFFFFF',
  border: '#1C1917',
  text: '#000000',
  textSecondary: '#292524',
  primary: '#00352D',
  error: '#7F1D1D',
};

export const highContrastDark: AppColors = {
  ...darkColors,
  background: '#000000',
  surface: '#0C0A09',
  border: '#FAFAF9',
  text: '#FFFFFF',
  textSecondary: '#F5F5F4',
  primary: '#5EEAD4',
  error: '#FECACA',
};
