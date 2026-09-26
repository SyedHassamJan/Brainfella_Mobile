import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { createApiClient, type AuthDeps } from '../client';

const BASE = 'http://api.test';

function setup() {
  let access: string | null = 'old-access';
  let refresh: string | null = 'old-refresh';
  const deps: AuthDeps = {
    baseURL: BASE,
    getAccessToken: () => access,
    getRefreshToken: () => refresh,
    onTokens: jest.fn((a: string, r: string) => {
      access = a;
      refresh = r;
    }),
    onSessionExpired: jest.fn(),
  };
  const api = createApiClient(deps);
  const apiMock = new MockAdapter(api); // the app's client
  const bareMock = new MockAdapter(axios); // the bare axios used for /auth/refresh
  return { api, apiMock, bareMock, deps, tokens: () => ({ access, refresh }), clear: () => (refresh = null) };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('api client', () => {
  it('attaches the bearer token', async () => {
    const { api, apiMock } = setup();
    apiMock.onGet('/x').reply((config) => [200, { auth: config.headers?.Authorization }]);
    expect((await api.get('/x')).data.auth).toBe('Bearer old-access');
  });

  it('on 401: refreshes with { refresh } in the BODY, stores the rotated pair, retries with the new token', async () => {
    const { api, apiMock, bareMock, deps, tokens } = setup();
    apiMock
      .onGet('/journal/my')
      .replyOnce(401)
      .onGet('/journal/my')
      .reply((config) => [200, { auth: config.headers?.Authorization }]);
    bareMock.onPost(`${BASE}/auth/refresh`).reply(200, { accessToken: 'new-access', refreshToken: 'new-refresh' });

    const res = await api.get('/journal/my');

    expect(res.data.auth).toBe('Bearer new-access');
    expect(JSON.parse(bareMock.history.post[0].data)).toEqual({ refresh: 'old-refresh' });
    expect(deps.onTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    expect(tokens()).toEqual({ access: 'new-access', refresh: 'new-refresh' });
    expect(deps.onSessionExpired).not.toHaveBeenCalled();
  });

  it('concurrent 401s trigger exactly ONE refresh; every request retries with the new token', async () => {
    const { api, apiMock, bareMock } = setup();
    apiMock.onGet(/\/r\d/).reply((config) => {
      const ok = config.headers?.Authorization === 'Bearer new-access';
      return [ok ? 200 : 401, { n: config.url }];
    });
    let refreshCalls = 0;
    bareMock.onPost(`${BASE}/auth/refresh`).reply(async () => {
      refreshCalls += 1;
      await new Promise((r) => setTimeout(r, 25));
      return [200, { accessToken: 'new-access', refreshToken: 'new-refresh' }];
    });

    const results = await Promise.all([api.get('/r1'), api.get('/r2'), api.get('/r3'), api.get('/r4')]);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    expect(refreshCalls).toBe(1);
  });

  it('when the server REJECTS the refresh token (401): ends the session and surfaces the original error', async () => {
    const { api, apiMock, bareMock, deps } = setup();
    apiMock.onGet('/x').reply(401);
    bareMock.onPost(`${BASE}/auth/refresh`).reply(401);

    await expect(api.get('/x')).rejects.toMatchObject({ response: { status: 401 } });
    expect(deps.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('when the phone is OFFLINE during a refresh: the session is kept (no sign-out)', async () => {
    const { api, apiMock, bareMock, deps } = setup();
    apiMock.onGet('/x').reply(401);
    bareMock.onPost(`${BASE}/auth/refresh`).networkError();

    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(deps.onSessionExpired).not.toHaveBeenCalled();
  });

  it('a server error (500) during refresh also keeps the session', async () => {
    const { api, apiMock, bareMock, deps } = setup();
    apiMock.onGet('/x').reply(401);
    bareMock.onPost(`${BASE}/auth/refresh`).reply(500);
    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(deps.onSessionExpired).not.toHaveBeenCalled();
  });

  it('no refresh token available: ends the session', async () => {
    const { api, apiMock, deps, clear } = setup();
    clear();
    apiMock.onGet('/x').reply(401);
    await expect(api.get('/x')).rejects.toBeTruthy();
    expect(deps.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('a wrong password (401 on /auth/signin) is just an error: no refresh, no sign-out', async () => {
    const { api, apiMock, bareMock, deps } = setup();
    apiMock.onPost('/auth/signin').reply(401, { message: 'Invalid credentials' });
    await expect(api.post('/auth/signin', {})).rejects.toMatchObject({ response: { status: 401 } });
    expect(bareMock.history.post).toHaveLength(0);
    expect(deps.onSessionExpired).not.toHaveBeenCalled();
  });

  it('retries only once: a second 401 after refresh does not loop', async () => {
    const { api, apiMock, bareMock } = setup();
    apiMock.onGet('/x').reply(401);
    bareMock.onPost(`${BASE}/auth/refresh`).reply(200, { accessToken: 'a2', refreshToken: 'r2' });
    await expect(api.get('/x')).rejects.toMatchObject({ response: { status: 401 } });
    expect(bareMock.history.post).toHaveLength(1);
    expect(apiMock.history.get).toHaveLength(2); // original + one retry
  });

  it('non-401 errors pass straight through untouched', async () => {
    const { api, apiMock, bareMock } = setup();
    apiMock.onGet('/x').reply(403);
    await expect(api.get('/x')).rejects.toMatchObject({ response: { status: 403 } });
    expect(bareMock.history.post).toHaveLength(0);
  });
});
