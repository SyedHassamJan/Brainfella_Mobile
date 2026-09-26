import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import api from '@/api';
import { NotPatientError, getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/authStore';

import { useSignIn, useSignUp } from '../auth';

jest.mock('@/api', () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));
const post = api.post as jest.Mock;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{children}</QueryClientProvider>
);

const auth = (role: string) => ({ id: 'u1', name: 'Someone', role, accessToken: 'access-1', refreshToken: 'refresh-1' });

beforeEach(() => {
  post.mockReset();
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, sessionExpired: false });
});

describe('the app is patient-only', () => {
  it('a patient signs in and the session is stored', async () => {
    post.mockResolvedValueOnce({ data: auth('PATIENT') });
    const { result } = renderHook(() => useSignIn(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ email: 'A@Example.com ', password: 'x' });
    });
    expect(post).toHaveBeenCalledWith('/auth/signin', { email: 'a@example.com', password: 'x' });
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: true, accessToken: 'access-1', user: { role: 'PATIENT' } });
  });

  it.each(['THERAPIST', 'GUARDIAN', 'ADMIN'])('a %s is declined: no session is kept and the tokens are revoked server-side', async (role) => {
    post.mockResolvedValueOnce({ data: auth(role) }).mockResolvedValueOnce({ data: {} });
    const { result } = renderHook(() => useSignIn(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ email: 'x@example.com', password: 'x' })).rejects.toBeInstanceOf(NotPatientError);
    });

    // nothing kept on the phone
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
    // and the session the server just created is signed out, using THAT session's own token
    expect(post).toHaveBeenNthCalledWith(2, '/auth/signout', undefined, { headers: { Authorization: 'Bearer access-1' } });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('still declines (and reports it kindly) if the revoke call itself fails', async () => {
    post.mockResolvedValueOnce({ data: auth('THERAPIST') }).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useSignIn(), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ email: 'x@example.com', password: 'x' })).rejects.toBeInstanceOf(NotPatientError);
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('sign-up applies the same gate', async () => {
    post.mockResolvedValueOnce({ data: {} }).mockResolvedValueOnce({ data: auth('THERAPIST') }).mockResolvedValueOnce({ data: {} });
    const { result } = renderHook(() => useSignUp(), { wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ name: 'N', email: 'x@example.com', password: 'x' })).rejects.toBeInstanceOf(NotPatientError);
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('the message points to the website and is shown by the shared error helper', () => {
    const msg = getErrorMessage(new NotPatientError());
    expect(msg).toMatch(/patients/i);
    expect(msg).toMatch(/website/i);
  });

  it('the store itself refuses to establish a non-patient session (defence in depth)', () => {
    useAuthStore.getState().signIn({ user: { id: 'u', name: 'T', role: 'THERAPIST' }, accessToken: 'a', refreshToken: 'r' });
    expect(useAuthStore.getState()).toMatchObject({ isAuthenticated: false, user: null, accessToken: null });
  });
});
