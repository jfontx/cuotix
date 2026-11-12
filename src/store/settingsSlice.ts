import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface SettingsState {
  theme: ThemePreference;
  highContrast: boolean;
  haptics: boolean;
}

const initialState: SettingsState = { theme: 'system', highContrast: false, haptics: true };

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemePreference>) => {
      state.theme = action.payload;
    },
    setHighContrast: (state, action: PayloadAction<boolean>) => {
      state.highContrast = action.payload;
    },
    /** Aplica preferencias guardadas; ignora campos ausentes o con tipo inválido. */
    hydrateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      const { theme, highContrast, haptics } = action.payload;
      if (theme === 'system' || theme === 'light' || theme === 'dark') state.theme = theme;
      if (typeof highContrast === 'boolean') state.highContrast = highContrast;
      if (typeof haptics === 'boolean') state.haptics = haptics;
    },
    setHaptics: (state, action: PayloadAction<boolean>) => {
      state.haptics = action.payload;
    },
  },
});

export const { setTheme, setHighContrast, setHaptics, hydrateSettings } = settingsSlice.actions;
export default settingsSlice.reducer;

export const selectSettings = (state: { settings: SettingsState }) => state.settings;
