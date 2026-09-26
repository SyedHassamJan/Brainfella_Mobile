import { isAxiosError } from 'axios';

import type { ApiErrorBody } from '@/types';

/** Thrown at sign-in when the account is not a patient: this app is patient-only for now. */
export class NotPatientError extends Error {
  constructor() {
    super('This app is for patients at the moment. Please sign in on the BrainHealth website instead.');
    this.name = 'NotPatientError';
  }
}

export const NETWORK_MESSAGE =
  "We couldn't reach BrainHealth just now. Please check your connection and try again in a moment.";

/** True when the request never got an answer (offline, server down, timeout). */
export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

/**
 * A calm, human message for any error. Prefers the API's own message (NestJS
 * validation errors arrive as string[]), falls back to a gentle default, and
 * never shows a raw stack or status code to the user.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof NotPatientError) return error.message;
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return NETWORK_MESSAGE;
    const status = error.response.status;
    const raw = error.response.data?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    if (status >= 500) return 'BrainHealth is having a moment. Please try again shortly.';
    if (typeof message === 'string' && message.length > 0) return sentence(message);
    if (status === 401) return 'Your session has ended. Please sign in again.';
    if (status === 403) return "You don't have access to that.";
    if (status === 404) return "We couldn't find that.";
    return fallback;
  }
  return fallback;
}

/** "email must be an email" -> "Email must be an email." */
function sentence(text: string): string {
  const t = text.trim();
  return (t.charAt(0).toUpperCase() + t.slice(1)).replace(/([^.!?])$/, '$1.');
}
