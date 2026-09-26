import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

/**
 * Persistence for the auth store.
 *
 * The two JWTs go into the OS keystore (expo-secure-store) as SEPARATE keys.
 * SecureStore is meant for small values, and a token pair plus a user object in
 * one blob can outgrow it. Everything else (the non-secret user profile) goes
 * into AsyncStorage. On web, where SecureStore does not exist, tokens fall back
 * to AsyncStorage (localStorage); the phone build is the one that matters.
 */
export const ACCESS_KEY = 'bh.accessToken';
export const REFRESH_KEY = 'bh.refreshToken';

const useKeystore = Platform.OS !== 'web';

async function secureGet(key: string): Promise<string | null> {
  try {
    return useKeystore ? await SecureStore.getItemAsync(key) : await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn(`[auth] could not read ${key}:`, (e as Error).message);
    return null;
  }
}

async function secureSet(key: string, value: string | null | undefined): Promise<void> {
  try {
    if (!value) {
      await (useKeystore ? SecureStore.deleteItemAsync(key) : AsyncStorage.removeItem(key));
    } else {
      await (useKeystore ? SecureStore.setItemAsync(key, value) : AsyncStorage.setItem(key, value));
    }
  } catch (e) {
    // Not persisting means the user signs in again next launch; never crash over it.
    console.warn(`[auth] could not write ${key}:`, (e as Error).message);
  }
}

export const authStorage: StateStorage = {
  async getItem(name) {
    const [rest, accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(name),
      secureGet(ACCESS_KEY),
      secureGet(REFRESH_KEY),
    ]);
    if (!rest && !accessToken && !refreshToken) return null;
    const parsed = rest ? JSON.parse(rest) : { state: {}, version: 0 };
    parsed.state = { ...parsed.state, accessToken, refreshToken };
    return JSON.stringify(parsed);
  },

  async setItem(name, value) {
    const parsed = JSON.parse(value);
    const { accessToken, refreshToken, ...rest } = parsed.state ?? {};
    await Promise.all([
      AsyncStorage.setItem(name, JSON.stringify({ ...parsed, state: rest })),
      secureSet(ACCESS_KEY, accessToken),
      secureSet(REFRESH_KEY, refreshToken),
    ]);
  },

  async removeItem(name) {
    await Promise.all([AsyncStorage.removeItem(name), secureSet(ACCESS_KEY, null), secureSet(REFRESH_KEY, null)]);
  },
};
