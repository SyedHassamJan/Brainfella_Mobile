import { Linking } from 'react-native';

import { API_URL } from '@/lib/config';

/** wa.me link for an international digits-only number, with a gentle opening message. */
export function whatsappLink(number: string, therapistName: string) {
  const text = `Hello ${therapistName}, I found you on BrainHealth and would like to talk about a session.`;
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

/** Opens the chat in WhatsApp (or WhatsApp Web in the browser if the app is not installed). */
export function openWhatsapp(number: string, therapistName: string) {
  return Linking.openURL(whatsappLink(number, therapistName));
}

/** The API serves photos at a relative path; images need the full URL. */
export const absoluteApiUrl = (path?: string | null) => (path ? `${API_URL}${path}` : null);
