// Shapes returned by the NestJS API (see SYSTEM_DOCUMENTATION.md). Dates are ISO strings.

export type Role = 'PATIENT' | 'THERAPIST' | 'GUARDIAN' | 'ADMIN';

export interface GuardianLink {
  id: string;
  patientId: string;
  guardianEmail: string;
  guardianName?: string | null;
  guardianPhone?: string | null;
  relationship?: string | null;
  isConfirmed: boolean;
}

export interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  emergencyContact?: string | null;
  conditions: string[];
}

export interface TherapistProfile {
  id: string;
  userId: string;
  bio?: string | null;
  specializations: string[];
  qualifications: string[];
  experienceYears: number;
  consultationFee?: number | null;
  availableDays: string[];
  availableTimeFrom?: string | null;
  availableTimeTo?: string | null;
  rating?: number | null;
  totalReviews: number;
  isVerified: boolean;
}

/** The slim user the app keeps in its persisted auth state. */
export interface SessionUser {
  id: string;
  name: string;
  role: Role;
}

/** Full profile from GET /user/profile. */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  profileImage?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  patientProfile?: PatientProfile | null;
  therapistProfile?: TherapistProfile | null;
  guardianLink?: GuardianLink | null;
}

export interface AuthResponse {
  id: string;
  name: string;
  role: Role;
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  patientProfile?: {
    dateOfBirth?: string;
    gender?: string;
    emergencyContact?: string;
    conditions?: string[];
  };
}

export interface SetGuardianInput {
  guardianEmail: string;
  guardianName?: string;
  guardianPhone?: string;
  relationship?: string;
}

// ---- Emotions, journal, mood
export type EmotionLabel = 'joy' | 'sadness' | 'anger' | 'fear' | 'disgust' | 'surprise' | 'neutral';

export interface JournalEntry {
  id: string;
  userId: string;
  title?: string | null;
  content: string;
  detectedEmotion?: EmotionLabel | null;
  emotionScore?: number | null;
  isCrisis: boolean;
  therapistComment?: string | null;
  isReviewed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  entries: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MoodLog {
  id: string;
  userId: string;
  mood: EmotionLabel;
  intensity: number;
  note?: string | null;
  loggedAt: string;
}

export interface MoodInsights {
  totalLogs: number;
  dominantEmotion: EmotionLabel | null;
  averageIntensity: number;
  emotionBreakdown: Partial<Record<EmotionLabel, number>>;
  dailyAverages: { date: string; averageIntensity: number; logCount: number }[];
}

// ---- Chat
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  detectedEmotion?: EmotionLabel | null;
  isCrisis: boolean;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title?: string | null;
  createdAt: string;
  endedAt?: string | null;
  messages?: ChatMessage[];
}

export interface SendMessageResult {
  reply: string;
  detectedEmotion: EmotionLabel;
  emotionScore: number;
  isCrisis: boolean;
}

// ---- Care: appointments, therapists, CBT
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type SessionType = 'ONLINE' | 'IN_PERSON';

export interface PersonRef {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string;
  scheduledAt: string;
  duration: number;
  sessionType: SessionType;
  status: AppointmentStatus;
  notes?: string | null;
  therapistNotes?: string | null;
  meetingLink?: string | null;
  createdAt: string;
  therapist?: PersonRef;
  patient?: PersonRef;
}

export interface CreateAppointmentInput {
  therapistId: string; // the therapist's USER id (TherapistListItem.user.id)
  scheduledAt: string;
  duration?: number;
  sessionType?: SessionType;
  notes?: string;
}

export interface TherapistReview {
  id: string;
  therapistProfileId: string;
  patientId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

/** Item of GET /therapist. `id` is the PROFILE id (used for reviews); `user.id` is used to book. */
export interface TherapistListItem extends TherapistProfile {
  user: PersonRef;
}

export interface TherapistDetail extends TherapistListItem {
  reviews: TherapistReview[];
}

export interface CbtExercise {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: string[];
  duration?: number | null;
  difficulty: string;
  isActive: boolean;
}

export interface ExerciseCompletion {
  id: string;
  userId: string;
  exerciseId: string;
  completedAt: string;
  feedback?: string | null;
  rating?: number | null;
  exercise: CbtExercise;
}

// ---- Notifications
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// ---- API errors (GlobalExceptionFilter shape)
export interface ApiErrorBody {
  statusCode: number;
  timestamp?: string;
  path?: string;
  message: string | string[];
}
