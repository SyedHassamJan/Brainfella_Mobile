import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { authStorage } from '@/lib/secureStorage';
import type { SessionUser } from '@/types';

export interface AuthSession {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /** True once persisted state has been read; the UI waits for it (no sign-in flash on launch). */
  _hasHydrated: boolean;
  /** Set when the session ended because the refresh token was rejected, so sign-in can say so gently. */
  sessionExpired: boolean;

  signIn: (session: AuthSession) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: SessionUser) => void;
  logout: (reason?: 'expired') => void;
  setHasHydrated: (v: boolean) => void;
  clearSessionExpired: () => void;
}

const signedOut = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...signedOut,
      _hasHydrated: false,
      sessionExpired: false,

      // One atomic update so no screen ever sees a half-signed-in state.
      // The app is patient-only; a non-patient session is never established.
      signIn: ({ user, accessToken, refreshToken }) => {
        if (user.role !== 'PATIENT') return;
        set({ user, accessToken, refreshToken, isAuthenticated: true, sessionExpired: false });
      },

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      logout: (reason) => set({ ...signedOut, sessionExpired: reason === 'expired' }),

      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),

      clearSessionExpired: () => set({ sessionExpired: false }),
    }),
    {
      name: 'brainhealth-auth',
      storage: createJSONStorage(() => authStorage),
      // Only what is needed to restore a session; flags are recomputed.
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AuthState>;
        // A saved non-patient session (e.g. from an earlier build) is discarded, not restored.
        const ok = !!p.user && p.user.role === 'PATIENT' && !!p.accessToken && !!p.refreshToken;
        return { ...current, ...(ok ? { user: p.user!, accessToken: p.accessToken!, refreshToken: p.refreshToken!, isAuthenticated: true } : signedOut) };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
