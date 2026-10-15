/**
 * @jest-environment node
 *
 * LIVE contract test for the screening feature: drives the app's real API
 * client against a running BrainHealth backend (which in turn calls the ML
 * service for face/voice). Skipped unless LIVE_API_URL is set, e.g.
 *
 *   LIVE_API_URL=http://localhost:8001 npx jest test/live
 *
 * Face/voice tests additionally need the ML service running on ML_SERVICE_URL
 * (default http://127.0.0.1:8002) with a key matching the backend's
 * ML_SERVICE_KEY; they are skipped (not failed) if it isn't reachable, same
 * as the rest of this suite skips when LIVE_API_URL isn't set.
 *
 * This suite exists because the mobile screening screens shipped with four
 * bugs a plain type-check/unit-test pass did not catch (wrong route-param
 * timing, missing busy/error states, a missing record-prepare call) — each
 * one is a real request through the same api client the screens use, the
 * same way contract.live.test.ts already does for journal/chat.
 *
 * It creates a throwaway user (email starts with "smoketest-mobile+"); delete
 * it afterwards with test/live/cleanup.js.
 */
/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

import { createApiClient } from '@/api/client';
import type {
  AuthResponse,
  FaceAnalysisResult,
  QuestionnaireDefinition,
  QuestionnaireResponse,
  QuestionnaireType,
  RiskAssessment,
  TextAnalysisResult,
  VoiceAnalysisResult,
} from '@/types';

const URL = process.env.LIVE_API_URL;
const suite = URL ? describe : describe.skip;

const ML_DIR = path.resolve(__dirname, '../../../brainhealth-ml-service');
const base64Of = (p: string) => fs.readFileSync(p).toString('base64');

suite('live screening contract (the same client the mobile app uses)', () => {
  jest.setTimeout(180_000);

  let access: string | null = null;
  let refresh: string | null = null;
  let mlAvailable = false;
  const email = `smoketest-mobile+screening-${Date.now()}@gmail.com`;
  const password = 'Smoke#12345';

  const api = createApiClient({
    baseURL: URL!,
    getAccessToken: () => access,
    getRefreshToken: () => refresh,
    onTokens: (a, r) => {
      access = a;
      refresh = r;
    },
    onSessionExpired: () => {},
  });

  it('setup: signup + signin, and check whether the ML service is up (face/voice tests need it)', async () => {
    await api.post('/auth/signup', { name: 'Mobile Screening Smoke', email, password });
    const { data } = await api.post<AuthResponse>('/auth/signin', { email, password });
    expect(data.accessToken.split('.')).toHaveLength(3);
    access = data.accessToken;
    refresh = data.refreshToken;

    try {
      const res = await fetch(`${process.env.ML_SERVICE_URL || 'http://127.0.0.1:8002'}/health`);
      const body = (await res.json()) as { modelsLoaded?: boolean };
      mlAvailable = res.ok && !!body.modelsLoaded;
    } catch {
      mlAvailable = false;
    }
    if (!mlAvailable) {
      console.warn('[live] ML service is not reachable/ready — camera/voice tests will be skipped.');
    }
  });

  const TYPES: QuestionnaireType[] = ['PHQ9', 'GAD7', 'OCIR', 'DASS21'];
  it.each(TYPES)('questionnaire %s: GET the definition and its type field round-trips into a valid POST :type/submit path', async (type) => {
    const def = (await api.get<QuestionnaireDefinition>(`/questionnaire/${type}`)).data;
    expect(def.type).toBe(type);
    expect(def.items.length).toBeGreaterThan(0);
    expect(def.options.length).toBeGreaterThan(0);

    // Exactly what the mobile screen sends: def.type used verbatim as the :type param.
    const answers = def.items.map(() => def.options[0]!.value);
    const submitted = (await api.post<QuestionnaireResponse>(`/questionnaire/${def.type}/submit`, { answers })).data;
    expect(submitted).toMatchObject({ type, score: expect.any(Number), severityLabel: expect.any(String) });
  });

  it('questionnaire: an undefined :type (the actual bug reported from the phone) fails with a 400, not a crash', async () => {
    await expect(api.get('/questionnaire/undefined')).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('questionnaire: PHQ-9 item 9 (self-harm) sets crisisFlag and crisisSupport on the submit response', async () => {
    const def = (await api.get<QuestionnaireDefinition>('/questionnaire/PHQ9')).data;
    const answers = def.items.map((_item, i) => (i === def.items.length - 1 ? def.options[1]!.value : 0));
    const submitted = (await api.post<QuestionnaireResponse>('/questionnaire/PHQ9/submit', { answers })).data;
    expect(submitted.crisisFlag).toBe(true);
    expect(submitted.crisisSupport).toMatch(/0317-4288665/);
  });

  it('text analysis: analyzes ordinary text and flags crisis language, matching the shape TextCheckIn renders', async () => {
    const calm = (await api.post<TextAnalysisResult>('/screening/analyze-text', { text: 'Today was a pretty good day, I felt relaxed.' })).data;
    expect(calm.crisisFlag).toBe(false);

    const crisis = (await api.post<TextAnalysisResult>('/screening/analyze-text', { text: 'I want to end my life, there is no point anymore.' })).data;
    expect(crisis.crisisFlag).toBe(true);
    expect(crisis.crisisSupport).toMatch(/0317-4288665/);
  });

  it('face analysis: a real frontal face returns an emotion and a face-mesh derived eyeContact flag', async () => {
    if (!mlAvailable) return;
    const image = base64Of(path.join(ML_DIR, 'test_images', 'frontal_1.jpg'));
    const result = (await api.post<FaceAnalysisResult>('/screening/analyze-face', { image })).data;
    expect(typeof result.emotion).toBe('string');
    expect(typeof result.eyeContact).toBe('boolean');
    expect(result.headPose).toMatchObject({ yaw: expect.any(Number), pitch: expect.any(Number), roll: expect.any(Number) });
  });

  it('face analysis: an image with no face is a readable 422, not a silent failure', async () => {
    if (!mlAvailable) return;
    const image = base64Of(path.join(ML_DIR, 'test_images', 'noface_1.jpg'));
    await expect(api.post('/screening/analyze-face', { image })).rejects.toMatchObject({
      response: { status: 422, data: { message: expect.stringMatching(/face/i) } },
    });
  });

  it('voice analysis: a real short speech clip is transcribed and carries language signals, matching what voice.tsx shows', async () => {
    if (!mlAvailable) return;
    const audio = base64Of(path.join(ML_DIR, 'test_audio', 'real_nasa_bullpen_a.wav'));
    const result = (await api.post<VoiceAnalysisResult>('/screening/analyze-voice', { audio }, { timeout: 150_000 })).data;
    expect(result.transcript.length).toBeGreaterThan(0);
    expect(result.textAnalysis).toMatchObject({ crisisFlag: expect.any(Boolean) });
  });

  it('voice analysis: silence is a readable error, not a hang or a silent failure', async () => {
    if (!mlAvailable) return;
    const audio = base64Of(path.join(ML_DIR, 'test_audio', 'silence.wav'));
    await expect(api.post('/screening/analyze-voice', { audio }, { timeout: 150_000 })).rejects.toMatchObject({
      response: { status: 422 },
    });
  });

  it('assess: fuses the questionnaire already submitted above into a risk indicator with recommendations', async () => {
    const result = (await api.post<RiskAssessment>('/screening/assess')).data;
    expect(result.depressionRisk).not.toBeNull();
    expect(result.confidence).toMatch(/^(low|high)$/);
    expect(result.inputsUsed).toContain('questionnaire');
    expect(Array.isArray(result.breakdown.recommendations)).toBe(true);
    expect(typeof result.disclaimer).toBe('string');
  });

  it('assess: after the face and voice analyses above, inputsUsed lists facial and voice too (what the results screen shows as "Included")', async () => {
    if (!mlAvailable) return; // the face/voice tests above were skipped, so nothing to assert here either
    const { data } = await api.post<RiskAssessment>('/screening/assess');
    expect(data.inputsUsed).toEqual(expect.arrayContaining(['questionnaire', 'text', 'voice', 'facial']));
    expect(data.breakdown.recordedNotScored.voice).toMatchObject({ duration: expect.any(Number) });
    expect(data.breakdown.recordedNotScored.facial).toMatchObject({ eyeContact: expect.any(Boolean) });
  });

  it('history: returns the assessment above, oldest first, in the shape progress.tsx charts', async () => {
    const history = (await api.get<RiskAssessment[]>('/screening/history')).data;
    expect(history.length).toBeGreaterThan(0);
    expect(Date.parse(history[0]!.computedAt)).toBeLessThanOrEqual(Date.parse(history[history.length - 1]!.computedAt));
    const last = history[history.length - 1]!;
    expect(last).toMatchObject({ id: expect.any(String), depressionRisk: expect.anything() });
  });

  it('assess: with no fresh input (a brand-new user) is a readable 422, matching the results screen empty state', async () => {
    const freshEmail = `smoketest-mobile+screening-empty-${Date.now()}@gmail.com`;
    let freshAccess: string | null = null;
    let freshRefresh: string | null = null;
    const fresh = createApiClient({
      baseURL: URL!,
      getAccessToken: () => freshAccess,
      getRefreshToken: () => freshRefresh,
      onTokens: (a, r) => {
        freshAccess = a;
        freshRefresh = r;
      },
      onSessionExpired: () => {},
    });
    await fresh.post('/auth/signup', { name: 'Fresh Smoke', email: freshEmail, password });
    const { data } = await fresh.post<AuthResponse>('/auth/signin', { email: freshEmail, password });
    freshAccess = data.accessToken;
    freshRefresh = data.refreshToken;
    await expect(fresh.post('/screening/assess')).rejects.toMatchObject({
      response: { status: 422, data: { message: expect.stringMatching(/screening data/i) } },
    });
  });
});
