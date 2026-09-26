import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { ACCESS_KEY, REFRESH_KEY } from '@/lib/secureStorage';

import { useAuthStore } from '../authStore';

const session = {
  user: { id: 'u1', name: 'Aisha Khan', role: 'PATIENT' as const },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

const secure = () => (SecureStore as any).__store as Map<string, string>;

beforeEach(async () => {
  await AsyncStorage.clear();
  secure().clear();
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, sessionExpired: false });
});

describe('authStore', () => {
  it('signIn sets everything at once', () => {
    useAuthStore.getState().signIn(session);
    const s = useAuthStore.getState();
    expect(s).toMatchObject({ isAuthenticated: true, accessToken: 'access-token', refreshToken: 'refresh-token', user: { id: 'u1' } });
  });

  it('logout clears the session; logout("expired") also flags why', () => {
    useAuthStore.getState().signIn(session);
    useAuthStore.getState().logout('expired');
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, user: null, accessToken: null, sessionExpired: true });
    useAuthStore.getState().signIn(session);
    expect(useAuthStore.getState().sessionExpired).toBe(false);
  });

  it('persists the tokens in the keystore as SEPARATE keys, and the profile in AsyncStorage without tokens', async () => {
    useAuthStore.getState().signIn(session);
    await new Promise((r) => setTimeout(r, 20)); // let the persist middleware flush

    expect(secure().get(ACCESS_KEY)).toBe('access-token');
    expect(secure().get(REFRESH_KEY)).toBe('refresh-token');

    const plain = JSON.parse((await AsyncStorage.getItem('brainhealth-auth'))!);
    expect(plain.state.user).toEqual(session.user);
    expect(JSON.stringify(plain)).not.toContain('access-token');
    expect(JSON.stringify(plain)).not.toContain('refresh-token');
  });

  it('restores a session on a fresh launch (what is on disk becomes the state)', async () => {
    // A fresh launch starts with empty memory and finds these in storage (nothing is written on startup).
    await AsyncStorage.setItem('brainhealth-auth', JSON.stringify({ state: { user: session.user }, version: 0 }));
    secure().set(ACCESS_KEY, 'access-token');
    secure().set(REFRESH_KEY, 'refresh-token');

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, accessToken: 'access-token', user: { name: 'Aisha Khan' } });
    expect(useAuthStore.getState()._hasHydrated).toBe(true);
  });

  it('logout wipes the keystore too', async () => {
    useAuthStore.getState().signIn(session);
    await new Promise((r) => setTimeout(r, 20));
    useAuthStore.getState().logout();
    await new Promise((r) => setTimeout(r, 20));
    expect(secure().has(ACCESS_KEY)).toBe(false);
    expect(secure().has(REFRESH_KEY)).toBe(false);
  });

  it('a half-saved state (user but no tokens) is NOT treated as signed in', async () => {
    await AsyncStorage.setItem('brainhealth-auth', JSON.stringify({ state: { user: session.user }, version: 0 }));
    await useAuthStore.persist.rehydrate();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('a saved NON-patient session (e.g. from an earlier build) is discarded on launch, not restored', async () => {
    await AsyncStorage.setItem('brainhealth-auth', JSON.stringify({ state: { user: { id: 'u', name: 'T', role: 'THERAPIST' } }, version: 0 }));
    secure().set(ACCESS_KEY, 'access-token');
    secure().set(REFRESH_KEY, 'refresh-token');

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, user: null, accessToken: null });
  });
});
