import * as SecureStore from 'expo-secure-store';

const KEYS = {
  PIN_HASH: 'picshow_pin_hash',
  PIN_TYPE: 'picshow_pin_type', // 'pin' | 'password'
  PIN_LENGTH: 'picshow_pin_length',
  ALBUMS: 'picshow_albums',
  SETTINGS: 'picshow_settings',
  ONBOARDED: 'picshow_onboarded',
  EXCLUDED_FOLDERS: 'picshow_excluded_folders',
};

export const SecureStorage = {
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async get(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  keys: KEYS,
};
