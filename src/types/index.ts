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
  /** International digits only (e.g. 923001234567), for wa.me links. */
  whatsappNumber?: string | null;
  /** API path of the approved therapist's photo (e.g. /therapist/<id>/photo), or null. */
  photoUrl?: string | null;
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
  /** Set once the guided tour is finished or skipped; it is not shown again. */
  onboardingCompletedAt?: string | null;
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
  /** The note matched the shared crisis check. */
  isCrisis?: boolean;
  /** Helpline text, present only when isCrisis. */
  crisisSupport?: string;
  /** Tone of the note from the emotion model. Null: no note, or the model was unavailable. Never replaces `mood`. */
  detectedEmotion?: EmotionLabel | null;
  emotionScore?: number | null;
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

// ---- Screening: questionnaires, face/voice/text analysis, fused risk indicator
export type QuestionnaireType = 'PHQ9' | 'GAD7' | 'OCIR' | 'DASS21';

export interface QuestionnaireDefinition {
  type: QuestionnaireType;
  name: string;
  measures: string;
  instructions: string;
  options: { value: number; label: string }[];
  items: string[];
}

export interface QuestionnaireResponse {
  id: string;
  userId: string;
  type: QuestionnaireType;
  answers: number[];
  score: number;
  severityLabel: string;
  subscores?: Record<string, number> | null;
  createdAt: string;
  /** Present only on the response to a submit (PHQ-9 item 9 or an equivalent crisis item). */
  crisisFlag?: boolean;
  crisisSupport?: string;
  disclaimer?: string;
}

export interface TextAnalysisResult {
  available: boolean;
  reason?: 'non_english' | 'empty_text' | 'model_unavailable';
  sentiment: { label: 'positive' | 'neutral' | 'negative'; score: number } | null;
  emotionalTone: { emotion: EmotionLabel; score: number; scores: Record<string, number> } | null;
  depressionLanguageScore: number | null;
  anxietyLanguageScore: number | null;
  stressLanguageScore: number | null;
  unavailableSignals: string[];
  crisisFlag: boolean;
  crisisSupport?: string;
  models: Record<string, string>;
  note: string;
}

export interface VoiceAnalysisResult {
  transcript: string;
  duration: number;
  language: string;
  languageProbability: number;
  speakingRate: number;
  pauseCount: number;
  models: Record<string, string>;
  note: string;
  textAnalysis: TextAnalysisResult;
}

export interface FaceAnalysisResult {
  emotion: string;
  emotionScores: Record<string, number>;
  eyeContact: boolean;
  blinkRate: number | null;
  headPose: { yaw: number; pitch: number; roll: number };
  models: Record<string, string>;
  note: string;
}

export interface RiskRecommendation {
  id: string;
  priority: 'urgent' | 'high' | 'normal';
  text: string;
  /** In-app feature this points to, when there is one. */
  action?: 'helpline' | 'book_therapist' | 'cbt_exercises' | 'questionnaire';
}

export type RiskSource = 'questionnaire' | 'text' | 'facial';
export type RiskCondition = 'depression' | 'anxiety' | 'stress' | 'ocd';

export interface RiskSourceContribution {
  source: RiskSource;
  /** 0-100 score this source gives this condition. */
  score: number;
  /** Weight after renormalizing over the sources actually present. */
  weight: number;
  detail: string;
}

export interface RiskConditionResult {
  risk: number;
  level: 'Low' | 'Mild' | 'Moderate' | 'High';
  confidence: 'high' | 'low';
  capped: boolean;
  sources: RiskSourceContribution[];
}

export interface RiskBreakdown {
  method: string;
  weights: { questionnaire: number; text: number; facial: number };
  noQuestionnaireCap: number;
  conditions: Partial<Record<RiskCondition, RiskConditionResult>>;
  questionnairesUsed: { type: QuestionnaireType; score: number; takenAt: string }[];
  recordedNotScored: {
    voice?: { speakingRate: number; pauseCount: number; duration: number; language: string };
    facial?: { eyeContact: boolean; headPose: { yaw: number; pitch: number; roll: number } };
  };
  recommendations: RiskRecommendation[];
}

/** A 0-100 risk indicator per condition; null means "not enough recent input", never a fake 0. */
export interface RiskAssessment {
  id: string;
  userId: string;
  depressionRisk: number | null;
  anxietyRisk: number | null;
  stressRisk: number | null;
  ocdRisk: number | null;
  crisisFlag: boolean;
  confidence: 'low' | 'high';
  /** Modes that contributed to the numbers ("voice" = its transcript, via text analysis). */
  inputsUsed: ('questionnaire' | 'text' | 'voice' | 'facial')[];
  breakdown: RiskBreakdown;
  computedAt: string;
  /** Present when this came straight from POST /screening/assess (not from history). */
  disclaimer?: string;
}

// ---- API errors (GlobalExceptionFilter shape)
export interface ApiErrorBody {
  statusCode: number;
  timestamp?: string;
  path?: string;
  message: string | string[];
}

// ---- Sharing with a therapist (patient side)
/** The patient's state with one therapist. A WhatsApp tap (contactedAt) grants no access; sharing does. */
export interface SharingState {
  contactedAt: string | null;
  sharedAt: string | null;
  sharing: boolean;
}

export interface TherapistConnection {
  therapistProfileId: string;
  name: string;
  specializations: string[];
  photoUrl: string | null;
  contactedAt: string | null;
  sharedAt: string | null;
}
