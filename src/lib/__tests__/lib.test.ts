import { AxiosError, type AxiosResponse } from 'axios';

import { NETWORK_MESSAGE, getErrorMessage, isNetworkError } from '../errors';
import { firstName, greeting, isUpcoming, relativeDay, snippet } from '../format';

function httpError(status: number, message?: string | string[]) {
  const err = new AxiosError('failed');
  err.response = { status, data: { statusCode: status, message } } as AxiosResponse;
  return err;
}

describe('getErrorMessage', () => {
  it('reports no-answer errors as a calm connectivity message', () => {
    const err = new AxiosError('Network Error');
    expect(isNetworkError(err)).toBe(true);
    expect(getErrorMessage(err)).toBe(NETWORK_MESSAGE);
  });

  it("prefers the API's own message and makes it a sentence", () => {
    expect(getErrorMessage(httpError(409, 'User already exists!'))).toBe('User already exists!');
    expect(getErrorMessage(httpError(400, 'email must be an email'))).toBe('Email must be an email.');
  });

  it('takes the first of a validation array', () => {
    expect(getErrorMessage(httpError(400, ['password is too short', 'other']))).toBe('Password is too short.');
  });

  it('never leaks server internals on 5xx', () => {
    const msg = getErrorMessage(httpError(500, 'prisma exploded: secret'));
    expect(msg).not.toMatch(/prisma|secret/);
  });

  it('falls back kindly for unknown errors', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
    expect(getErrorMessage(httpError(404))).toMatch(/couldn't find/);
  });
});

describe('format helpers', () => {
  it('greets by time of day', () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe('Good morning');
    expect(greeting(new Date(2026, 0, 1, 14))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 0, 1, 21))).toBe('Good evening');
    expect(greeting(new Date(2026, 0, 1, 2))).toBe('Still up');
  });

  it('firstName', () => {
    expect(firstName('Aisha Khan')).toBe('Aisha');
    expect(firstName('  ')).toBe('');
    expect(firstName(undefined)).toBe('');
  });

  it('relativeDay', () => {
    const now = new Date(2026, 8, 27, 15);
    expect(relativeDay(new Date(2026, 8, 27, 9).toISOString(), now)).toBe('Today');
    expect(relativeDay(new Date(2026, 8, 26, 23).toISOString(), now)).toBe('Yesterday');
    expect(relativeDay(new Date(2026, 8, 24, 9).toISOString(), now)).toBe('3 days ago');
  });

  it('isUpcoming and snippet', () => {
    const now = new Date(2026, 8, 27, 12);
    expect(isUpcoming(new Date(2026, 8, 27, 13).toISOString(), now)).toBe(true);
    expect(isUpcoming(new Date(2026, 8, 27, 11).toISOString(), now)).toBe(false);
    expect(snippet('a   b\n c', 100)).toBe('a b c');
    expect(snippet('x'.repeat(200), 10)).toBe('xxxxxxxxxx…');
  });
});

import { resolveApiUrl } from '../config';

describe('resolveApiUrl', () => {
  it('in development, follows the address the phone used to reach Metro (Wi-Fi or hotspot)', () => {
    expect(resolveApiUrl({ dev: true, hostUri: '192.168.100.20:8081', envUrl: 'http://192.168.137.1:8001' })).toBe('http://192.168.100.20:8001');
    expect(resolveApiUrl({ dev: true, hostUri: '192.168.137.1:8081' })).toBe('http://192.168.137.1:8001');
  });

  it('uses EXPO_PUBLIC_API_URL for production builds, tunnels, or an unknown host', () => {
    expect(resolveApiUrl({ dev: false, hostUri: '192.168.100.20:8081', envUrl: 'https://api.example.org/' })).toBe('https://api.example.org');
    expect(resolveApiUrl({ dev: true, hostUri: 'abc-anonymous-8081.exp.direct', envUrl: 'http://10.0.0.5:8001' })).toBe('http://10.0.0.5:8001');
    expect(resolveApiUrl({ dev: true, hostUri: null })).toBe('http://localhost:8001');
  });
});
