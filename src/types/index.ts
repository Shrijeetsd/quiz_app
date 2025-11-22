// TypeScript type definitions for Commerce Gate App

export interface User {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin';
  isVerified: boolean;
  preferences: UserPreferences;
  profile: UserProfile;
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showProgress: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    screenReader: boolean;
  };
  language: string;
  timezone: string;
}

export interface UserProfile {
  bio?: string;
  location?: string;
  website?: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  education?: string;
  experience?: string;
  interests: string[];
  skills: string[];
}

export interface Subscription {
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  features: string[];
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: User;
  category: string;
  subcategory: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  price: number;
  discount?: {
    percentage: number;
    validUntil: string;
  };
  thumbnail: string;
  media: CourseMedia[];
  syllabus: CourseSyllabus[];
  requirements: string[];
  learningOutcomes: string[];
  tags: string[];
  rating: {
    average: number;
    count: number;
    distribution: { [key: number]: number };
  };
  enrollment: {
    current: number;
    maximum?: number;
  };
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: string;
  updatedAt: string;
}

export interface CourseMedia {
  type: 'video' | 'audio' | 'document' | 'image';
  title: string;
  url: string;
  duration?: number;
  size: number;
  order: number;
}

export interface CourseSyllabus {
  title: string;
  description: string;
  order: number;
  duration: number;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  content: string;
  duration: number;
  order: number;
  isPreview: boolean;
}

export interface Question {
  _id: string;
  title: string;
  content: string;
  type: 'mcq' | 'multiple_select' | 'true_false' | 'fill_blank' | 'essay' | 'matching' | 'ordering';
  category: string;
  subcategory: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit?: number;
  options?: QuestionOption[];
  correctAnswers: string[];
  explanation?: string;
  hints: string[];
  media?: {
    type: 'image' | 'audio' | 'video';
    url: string;
  };
  tags: string[];
  metadata: {
    bloom_taxonomy?: string;
    cognitive_level?: string;
    learning_objective?: string;
  };
  analytics: {
    totalAttempts: number;
    correctAttempts: number;
    averageTime: number;
    difficulty_index: number;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Test {
  _id: string;
  title: string;
  description: string;
  course?: string;
  category: string;
  type: 'practice' | 'assessment' | 'mock' | 'final';
  timeLimit: number;
  totalMarks: number;
  passingMarks: number;
  questionsCount: number;
  questions: TestQuestion[];
  settings: TestSettings;
  schedule?: TestSchedule;
  instructions: string[];
  status: 'draft' | 'published' | 'archived';
  analytics: TestAnalytics;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestQuestion {
  question: string;
  marks: number;
  order: number;
  isOptional: boolean;
}

export interface TestSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: 'immediate' | 'after_submission' | 'scheduled' | 'never';
  allowReview: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  securityMode: 'none' | 'basic' | 'strict';
  proctoring: boolean;
  negativeMark: number;
}

export interface TestSchedule {
  startTime: string;
  endTime: string;
  timezone: string;
  buffer: number; // minutes before and after
}

export interface TestAnalytics {
  totalAttempts: number;
  averageScore: number;
  averageTime: number;
  passRate: number;
  difficultyIndex: number;
  discrimination: number;
}

export interface TestResult {
  _id: string;
  test: string;
  student: string;
  attempt: number;
  responses: TestResponse[];
  score: {
    obtained: number;
    total: number;
    percentage: number;
  };
  timeSpent: number;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'abandoned';
  startedAt: string;
  submittedAt?: string;
  feedback?: ResultFeedback;
  analytics: ResponseAnalytics;
  proctoring?: ProctoringData;
  createdAt: string;
}

export interface TestResponse {
  question: string;
  response: string[];
  isCorrect: boolean;
  marks: number;
  timeSpent: number;
  attempts: number;
}

export interface ResultFeedback {
  overall: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  nextSteps: string[];
}

export interface ResponseAnalytics {
  accuracyByCategory: { [category: string]: number };
  timeByCategory: { [category: string]: number };
  difficultyPerformance: { [level: string]: number };
  skillAnalysis: SkillAnalysis[];
}

export interface SkillAnalysis {
  skill: string;
  level: number;
  confidence: number;
  recommendations: string[];
}

export interface ProctoringData {
  violations: ProctoringViolation[];
  screenshots: string[];
  audioFlags: AudioFlag[];
  behaviorScore: number;
}

export interface ProctoringViolation {
  type: 'tab_switch' | 'window_blur' | 'multiple_faces' | 'no_face' | 'suspicious_movement';
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface AudioFlag {
  timestamp: string;
  type: 'multiple_voices' | 'background_noise' | 'silence';
  confidence: number;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  CourseSelection: undefined;
  LevelSelection: { courseId: string };
  MCQTest: { testId: string; resumeData?: any };
  Results: { resultId: string };
  CourseBrowsing: undefined;
  CourseDetail: { courseId: string };
  TestBrowsing: undefined;
  TestTaking: { testId: string; testTitle?: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Explore: undefined;
  Community: undefined;
  Profile: undefined;
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: { [key: string]: string };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  phone?: string;
  agreeToTerms: boolean;
  subscribeToNewsletter?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  user?: User;
  tokens?: {
    access: string;
    refresh: string;
  };
  access?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// State Management Types
export interface RootState {
  auth: AuthState;
  courses: CoursesState;
  tests: TestsState;
  user: UserState;
  ui: UIState;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: {
    access: string | null;
    refresh: string | null;
    expiresAt: string | null;
  };
  isLoading: boolean;
  error: string | null;
}

export interface CoursesState {
  courses: Course[];
  enrolledCourses: Course[];
  currentCourse: Course | null;
  categories: string[];
  isLoading: boolean;
  error: string | null;
  filters: CourseFilters;
  pagination: {
    page: number;
    hasMore: boolean;
  };
}

export interface CourseFilters {
  category?: string;
  level?: string;
  price?: 'free' | 'paid';
  rating?: number;
  duration?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface TestsState {
  tests: Test[];
  currentTest: Test | null;
  testSession: TestSession | null;
  results: TestResult[];
  isLoading: boolean;
  error: string | null;
  filters: TestFilters;
}

export interface TestFilters {
  category?: string;
  type?: string;
  difficulty?: string;
  status?: string;
}

export interface TestSession {
  testId: string;
  startTime: string;
  timeRemaining: number;
  currentQuestion: number;
  responses: { [questionId: string]: string[] };
  flags: string[];
  isSubmitted: boolean;
}

export interface UserState {
  profile: User | null;
  preferences: UserPreferences | null;
  progress: CourseProgress[];
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;
}

export interface CourseProgress {
  courseId: string;
  progress: number;
  completedLessons: string[];
  currentLesson?: string;
  timeSpent: number;
  lastAccessed: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'course' | 'test' | 'streak' | 'social';
  criteria: AchievementCriteria;
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
  };
}

export interface AchievementCriteria {
  type: 'course_completion' | 'test_score' | 'login_streak' | 'social_interaction';
  value: number;
  operator: 'gte' | 'lte' | 'eq';
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: Notification[];
  isOnline: boolean;
  loading: { [key: string]: boolean };
  errors: { [key: string]: string | null };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Hook Types
export interface UseApiOptions<T> {
  initialData?: T;
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseApiResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Component Props Types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  icon?: string;
  secure?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  image?: string;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

// Utility Types
export type AsyncThunkConfig = {
  state: RootState;
  rejectValue: string;
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;

// Storage Types
export interface StorageKeys {
  USER_TOKEN: string;
  USER_DATA: string;
  COURSE_PROGRESS: string;
  TEST_RESPONSES: string;
  APP_SETTINGS: string;
  OFFLINE_DATA: string;
}

// Network Types
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

// Error Types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  parameters?: { [key: string]: any };
  timestamp?: string;
}

export interface UserAnalytics {
  sessionDuration: number;
  screensViewed: string[];
  actionsPerformed: AnalyticsEvent[];
  coursesAccessed: string[];
  testsAttempted: string[];
}

// Offline Types
export interface OfflineAction {
  type: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineQueue {
  actions: OfflineAction[];
  isProcessing: boolean;
  lastSync: string | null;
}

// Push Notification Types
export interface PushNotificationData {
  title: string;
  body: string;
  data?: { [key: string]: string };
  imageUrl?: string;
  actionUrl?: string;
}

// Biometric Types
export interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'voice';
  fallbackToPassword: boolean;
}

// Payment Types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'bank' | 'upi';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  description: string;
  metadata: { [key: string]: string };
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
}

// Social Features Types
export interface SocialPost {
  id: string;
  author: User;
  content: string;
  media?: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
}

export interface SocialComment {
  id: string;
  author: User;
  content: string;
  likes: number;
  replies: SocialComment[];
  createdAt: string;
}

// Search Types
export interface SearchResult {
  type: 'course' | 'test' | 'question' | 'user';
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  metadata: { [key: string]: any };
  relevanceScore: number;
}

export interface SearchFilters {
  types?: string[];
  categories?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'relevance' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// Course and Test Service Types
export interface CourseProgress {
  id: string;
  userId: string;
  courseId: string;
  progress: number; // 0-100
  completedLessons: string[];
  currentLessonId?: string;
  timeSpent: number; // in seconds
  lastAccessedAt: Date;
  completedAt?: Date;
  notes?: string;
  bookmarks: CourseBookmark[];
}

export interface CourseBookmark {
  lessonId: string;
  timestamp: number;
  note?: string;
  createdAt: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  enrolledAt: Date;
  completedAt?: Date;
  paymentId?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  accessLevel: 'basic' | 'premium' | 'lifetime';
  expiresAt?: Date;
}

export interface CourseFilter {
  categories: string[];
  difficulties: string[];
  levels: string[];
  priceRange: [number, number];
  rating: number;
  duration: string;
  language: string;
  features: string[];
}

export interface TestEntity {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  testType: 'practice' | 'mock' | 'exam' | 'quiz';
  duration: number; // in minutes
  questionCount: number;
  totalMarks: number;
  passingScore: number;
  courseId?: string;
  instructions: string[];
  tags: string[];
  isPublished: boolean;
  isFree: boolean;
  price?: number;
  attempts: number;
  maxAttempts?: number;
  showResults: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
  image?: string;
}

export interface QuestionAnswer {
  questionId: string;
  selectedOptions: string[];
  textAnswer?: string;
  timeSpent: number;
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  answers: QuestionAnswer[];
  score: number;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  timeSpent: number;
  startedAt: Date;
  completedAt: Date;
  isSubmitted: boolean;
  status: 'in-progress' | 'completed' | 'abandoned' | 'expired';
}

export interface TestResultEntity {
  id: string;
  attemptId: string;
  userId: string;
  testId: string;
  testData: TestEntity;
  scoreData: {
    obtained: number;
    total: number;
    percentage: number;
  };
  grade: string;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedQuestions: number;
  timeSpent: number;
  categoryWiseScore: CategoryScore[];
  detailedResults: QuestionResult[];
  rank?: number;
  percentile?: number;
  completedAt: string;
}

export interface CategoryScore {
  category: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percentage: number;
}

export interface QuestionResult {
  questionId: string;
  question: Question;
  userAnswer: QuestionAnswer;
  isCorrect: boolean;
  marksAwarded: number;
  totalMarks: number;
  timeSpent: number;
}

export interface TestSessionEntity {
  id: string;
  testId: string;
  testData: TestEntity;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, any>;
  timeRemaining: number;
  startTime: string;
  completedAt?: string;
  isSubmitted: boolean;
  isPaused: boolean;
  settings: any;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Export all types
export default {};