/**
 * @jest-environment node
 *
 * LIVE contract test: drives the app's real API client against a running
 * BrainHealth backend. Skipped unless LIVE_API_URL is set, e.g.
 *
 *   LIVE_API_URL=http://localhost:8001 npx jest test/live
 *
 * It creates a throwaway user (email starts with "smoketest-mobile+"); delete
 * it afterwards with test/live/cleanup.js.
 */
import axios from 'axios';

import { createApiClient } from '@/api/client';
import type { AppNotification, AuthResponse, ChatSession, JournalEntry, MoodInsights, Paginated, SendMessageResult, UserProfile } from '@/types';

const URL = process.env.LIVE_API_URL;
const suite = URL ? describe : describe.skip;

suite('live API contract (the same client the app uses)', () => {
  jest.setTimeout(180_000);

  let access: string | null = null;
  let refresh: string | null = null;
  const expired = jest.fn();
  const email = `smoketest-mobile+${Date.now()}@gmail.com`;
  const password = 'Smoke#12345';

  const api = createApiClient({
    baseURL: URL!,
    getAccessToken: () => access,
    getRefreshToken: () => refresh,
    onTokens: (a, r) => {
      access = a;
      refresh = r;
    },
    onSessionExpired: expired,
  });

  it('signup then signin returns the AuthResponse the app expects', async () => {
    await api.post('/auth/signup', { name: 'Mobile Smoke', email, password });
    const { data } = await api.post<AuthResponse>('/auth/signin', { email, password });
    expect(data).toMatchObject({ id: expect.any(String), name: 'Mobile Smoke', role: 'PATIENT' });
    expect(data.accessToken.split('.')).toHaveLength(3);
    expect(data.refreshToken.split('.')).toHaveLength(3);
    access = data.accessToken;
    refresh = data.refreshToken;
  });

  it('a wrong password is a plain 401 (no refresh attempt, no sign-out)', async () => {
    await expect(api.post('/auth/signin', { email, password: 'Wrong#12345' })).rejects.toMatchObject({ response: { status: 401 } });
    expect(expired).not.toHaveBeenCalled();
  });

  it('profile: GET shape and PATCH round-trip (including the patient sub-profile)', async () => {
    const before = (await api.get<UserProfile>('/user/profile')).data;
    expect(before).toMatchObject({ email, role: 'PATIENT', isActive: true });
    // PATCH answers with the base user fields only; a bare date of birth is accepted.
    const patched = (
      await api.patch<UserProfile>('/user/profile', { name: 'Mobile Smoke Two', phone: '0300 1234567', patientProfile: { gender: 'Female', dateOfBirth: '2003-05-21' } })
    ).data;
    expect(patched.name).toBe('Mobile Smoke Two');
    const after = (await api.get<UserProfile>('/user/profile')).data;
    expect(after.name).toBe('Mobile Smoke Two');
    expect(after.phone).toBe('0300 1234567');
    expect(after.patientProfile?.gender).toBe('Female');
    expect(after.patientProfile?.dateOfBirth?.startsWith('2003-05-21')).toBe(true);
  });

  it('journal: create, list (paginated), get, patch, delete; crisis text is flagged', async () => {
    const created = (await api.post<JournalEntry>('/journal', { title: 'Smoke', content: 'I have been feeling calm and hopeful about my exams.' })).data;
    expect(created).toMatchObject({ id: expect.any(String), isCrisis: false, content: expect.any(String) });
    expect(typeof created.detectedEmotion).toBe('string');

    const list = (await api.get<Paginated<JournalEntry>>('/journal/my', { params: { page: 1, limit: 10 } })).data;
    expect(list).toMatchObject({ page: 1, total: expect.any(Number), totalPages: expect.any(Number) });
    expect(list.entries.map((e) => e.id)).toContain(created.id);

    expect((await api.get<JournalEntry>(`/journal/${created.id}`)).data.id).toBe(created.id);
    expect((await api.patch<JournalEntry>(`/journal/${created.id}`, { content: 'An edited entry, long enough.' })).data.content).toBe('An edited entry, long enough.');
    // No minimum length any more: a very short edit is fine, an empty one is not.
    expect((await api.patch<JournalEntry>(`/journal/${created.id}`, { content: 'ok' })).data.content).toBe('ok');
    await expect(api.patch(`/journal/${created.id}`, { content: '' })).rejects.toMatchObject({ response: { status: 400 } });
    await api.delete(`/journal/${created.id}`);
    await expect(api.get(`/journal/${created.id}`)).rejects.toMatchObject({ response: { status: 404 } });

    const crisis = (await api.post<JournalEntry>('/journal', { content: 'I feel hopeless and worthless lately.' })).data;
    expect(crisis.isCrisis).toBe(true);
    // ...and a single crisis word is accepted and flagged too (it used to be rejected as "too short").
    expect((await api.post<JournalEntry>('/journal', { content: 'suicide' })).data.isCrisis).toBe(true);
  });

  it('mood: log and 7-day insights shape', async () => {
    const log = (await api.post('/mood', { mood: 'joy', intensity: 7, note: 'smoke' })).data;
    expect(log).toMatchObject({ mood: 'joy', intensity: 7 });
    const ins = (await api.get<MoodInsights>('/mood/insights')).data;
    expect(ins.totalLogs).toBeGreaterThanOrEqual(1);
    expect(typeof ins.averageIntensity).toBe('number');
    expect(ins.dailyAverages[0]).toMatchObject({ date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), averageIntensity: expect.any(Number), logCount: expect.any(Number) });
  });

  it('chat: session lifecycle, a normal reply, and the crisis reply', async () => {
    const session = (await api.post<ChatSession>('/chatbot/session')).data;
    expect(session.id).toEqual(expect.any(String));
    expect((await api.get<ChatSession>(`/chatbot/session/${session.id}`)).data.messages).toEqual([]);

    const normal = (await api.post<SendMessageResult>('/chatbot/message', { sessionId: session.id, content: 'Hello, I had a busy day.' })).data;
    expect(normal).toMatchObject({ reply: expect.any(String), isCrisis: false });
    if (normal.reply.startsWith("I'm here for you. Could you tell me a little more")) {
      // The backend's canned fallback: Claude was NOT reached (usually an invalid CLAUDE_API_KEY).
      console.warn('[live] chatbot returned the FALLBACK reply, not a real AI answer. Check CLAUDE_API_KEY on the backend.');
    }

    const crisis = (await api.post<SendMessageResult>('/chatbot/message', { sessionId: session.id, content: 'I want to die' })).data;
    expect(crisis.isCrisis).toBe(true);
    expect(crisis.reply).toMatch(/0317-4288665/);

    const full = (await api.get<ChatSession>(`/chatbot/session/${session.id}`)).data;
    expect(full.messages).toHaveLength(4);
    expect(full.messages!.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
    expect(full.messages![3]!.isCrisis).toBe(true);

    expect((await api.get<ChatSession[]>('/chatbot/sessions')).data.map((s) => s.id)).toContain(session.id);
    await api.delete(`/chatbot/session/${session.id}`);
  });

  it('care: therapists, exercises, appointments respond with arrays of the expected shape', async () => {
    const therapists = (await api.get<unknown[]>('/therapist')).data;
    expect(Array.isArray(therapists)).toBe(true);
    if (therapists.length) expect(therapists[0]).toMatchObject({ id: expect.any(String), user: { id: expect.any(String), name: expect.any(String) }, specializations: expect.any(Array) });

    const exercises = (await api.get<{ steps: string[] }[]>('/cbt')).data;
    expect(Array.isArray(exercises)).toBe(true);
    if (exercises.length) expect(Array.isArray(exercises[0]!.steps)).toBe(true);

    expect(Array.isArray((await api.get('/appointment/my')).data)).toBe(true);
    expect(Array.isArray((await api.get('/cbt/completions/my')).data)).toBe(true);
  });

  it('notifications: the crisis events created a notification, and marking it read sticks', async () => {
    const list = (await api.get<AppNotification[]>('/notification/my')).data;
    const crisis = list.find((n) => n.type === 'CRISIS_DETECTED');
    expect(crisis).toBeDefined();
    expect(crisis!.isRead).toBe(false);
    await api.patch(`/notification/${crisis!.id}/read`);
    const after = (await api.get<AppNotification[]>('/notification/my')).data.find((n) => n.id === crisis!.id);
    expect(after!.isRead).toBe(true);
  });

  it('silent refresh: a bad access token is replaced transparently, tokens rotate, and the OLD refresh token dies', async () => {
    const oldRefresh = refresh!;
    access = 'this.is.not-a-valid-token';

    const profile = (await api.get<UserProfile>('/user/profile')).data; // 401 -> refresh (body field) -> retry
    expect(profile.email).toBe(email);
    expect(access).not.toBe('this.is.not-a-valid-token');
    expect(refresh).not.toBe(oldRefresh);
    expect(expired).not.toHaveBeenCalled();

    // Rotation is real: the previous refresh token is no longer accepted.
    await expect(axios.post(`${URL}/auth/refresh`, { refresh: oldRefresh })).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('concurrent requests with an expired token trigger one refresh and all succeed', async () => {
    const before = refresh;
    access = 'expired.expired.expired';
    const results = await Promise.all([api.get('/user/profile'), api.get('/notification/my'), api.get('/mood/insights'), api.get('/chatbot/sessions')]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    expect(refresh).not.toBe(before); // rotated exactly once and every request reused it
    expect(expired).not.toHaveBeenCalled();
  });

  it('sign out invalidates the refresh token server-side; the app then ends the session', async () => {
    await api.post('/auth/signout');
    const lastRefresh = refresh!;
    await expect(axios.post(`${URL}/auth/refresh`, { refresh: lastRefresh })).rejects.toMatchObject({ response: { status: 401 } });

    access = 'stale.stale.stale';
    await expect(api.get('/user/profile')).rejects.toMatchObject({ response: { status: 401 } });
    expect(expired).toHaveBeenCalledTimes(1);
  });
});
