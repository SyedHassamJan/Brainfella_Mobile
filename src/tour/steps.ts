/**
 * The first-run guided tour, in order. Each step points at one element on one
 * screen (a TourTarget with the same `target` id).
 *
 * - `route` is where the step lives; the tour navigates there when the step starts.
 * - `action` steps wait for the person to actually do the thing (the screen calls
 *   tour.notify(action)); the highlighted element stays tappable. Everything else
 *   is read-and-tap-Next.
 * - Steps without a target are centred cards (welcome, finish).
 */
export type TourAction = 'checkin' | 'journal';

export interface TourStep {
  id: string;
  title: string;
  body: string;
  route?: { pathname: string; params?: Record<string, string> };
  target?: string;
  action?: TourAction;
  /** Shown under an action step's text, telling the person what to do. */
  hint?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Hello, and welcome',
    body: "BrainHealth is a calm space to check in with yourself and find support. Let's take a short walk through it together. You can skip at any time.",
  },
  {
    id: 'checkin',
    route: { pathname: '/home' },
    target: 'home.checkin',
    action: 'checkin',
    title: 'Your daily check-in',
    body: 'Pick how you feel, how strongly, and add a few words if you like. There are no wrong answers.',
    hint: 'Try your first check-in now.',
  },
  {
    id: 'checkin-review',
    route: { pathname: '/home' },
    target: 'home.checkin',
    title: 'Here is what you logged',
    body: 'We show the mood you chose and how your note reads. You can check in again whenever you like, as often as you like.',
  },
  {
    id: 'week',
    route: { pathname: '/home' },
    target: 'home.week',
    title: 'Your week at a glance',
    body: 'Every check-in adds to this view, so you can notice patterns in how your week is going.',
  },
  {
    id: 'journal',
    route: { pathname: '/journal' },
    target: 'journal.new',
    action: 'journal',
    title: 'Your private journal',
    body: 'Writing a few lines can help sort out how you feel. Only you can read it, unless you choose to share it with a therapist.',
    hint: 'Tap here to write your first entry.',
  },
  {
    id: 'journal-review',
    route: { pathname: '/journal' },
    target: 'journal.list',
    title: 'Your entries live here',
    body: 'Each entry is gently tagged with the feeling it carries. Tap one to read it again or make changes.',
  },
  {
    id: 'care-sessions',
    route: { pathname: '/care', params: { tab: 'sessions' } },
    target: 'care.segments',
    title: 'Care: people and practices that help',
    body: 'Sessions shows the sessions you have booked with a therapist, and their status.',
  },
  {
    id: 'care-therapists',
    route: { pathname: '/care', params: { tab: 'therapists' } },
    target: 'care.content',
    title: 'Verified therapists',
    body: 'Every therapist here was checked by our team. Open one to read about them, book a session, chat on WhatsApp, or choose to share your records.',
  },
  {
    id: 'care-exercises',
    route: { pathname: '/care', params: { tab: 'exercises' } },
    target: 'care.content',
    title: 'CBT exercises',
    body: 'Short guided exercises you can do on your own, whenever you need a moment.',
  },
  {
    id: 'screening-questionnaire',
    route: { pathname: '/screening' },
    target: 'screening.questionnaire',
    title: 'Screening questionnaires',
    body: 'Short, well-known questionnaires about mood, worry and stress. They take a few minutes.',
  },
  {
    id: 'screening-camera',
    route: { pathname: '/screening' },
    target: 'screening.camera',
    title: 'Camera check',
    body: 'Take one photo and the app reads your facial expression. The photo itself is never saved.',
  },
  {
    id: 'screening-voice',
    route: { pathname: '/screening' },
    target: 'screening.voice',
    title: 'Voice check',
    body: 'Record a short clip about your day. The words are analysed; the recording itself is never saved.',
  },
  {
    id: 'screening-results',
    route: { pathname: '/screening' },
    target: 'screening.results',
    title: 'Your risk indicator',
    body: 'Brings together whichever inputs you gave into one screening result. It helps you notice how you are doing; it is not a diagnosis.',
  },
  {
    id: 'profile',
    route: { pathname: '/profile' },
    target: 'profile.settings',
    title: 'Your details and settings',
    body: 'Update your details, add a guardian who can receive a weekly summary, and see your notifications.',
  },
  {
    id: 'help',
    route: { pathname: '/profile' },
    target: 'profile.help',
    title: 'Help is always here',
    body: 'If things ever feel too heavy, you can call the Umang helpline straight from here, at any time.',
  },
  {
    id: 'done',
    title: "You're all set",
    body: 'Take things at your own pace. You can replay this tour from your Profile whenever you like.',
  },
];
