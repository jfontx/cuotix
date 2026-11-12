import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'cuotix.refreshToken';
const SETTINGS_KEY = 'cuotix.settings';

export const secureStorage = {
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  clearRefreshToken: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  getSettings: () => SecureStore.getItemAsync(SETTINGS_KEY),
  setSettings: (json: string) => SecureStore.setItemAsync(SETTINGS_KEY, json),
};
