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
    setHaptics: (state, action: PayloadAction<boolean>) => {
      state.haptics = action.payload;
    },
  },
});

export const { setTheme, setHighContrast, setHaptics } = settingsSlice.actions;
export default settingsSlice.reducer;

export const selectSettings = (state: { settings: SettingsState }) => state.settings;
