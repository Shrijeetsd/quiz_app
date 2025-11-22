// App constants and configuration

// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://10.0.2.2:3000/api' : 'https://api.commercegate.com',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: '@CommerceGate:userToken',
  ACCESS_TOKEN: '@CommerceGate:accessToken',
  REFRESH_TOKEN: '@CommerceGate:refreshToken',
  USER_DATA: '@CommerceGate:userData',
  COURSE_PROGRESS: '@CommerceGate:courseProgress',
  TEST_RESPONSES: '@CommerceGate:testResponses',
  APP_SETTINGS: '@CommerceGate:appSettings',
  OFFLINE_DATA: '@CommerceGate:offlineData',
  BIOMETRIC_ENABLED: '@CommerceGate:biometricEnabled',
  THEME_MODE: '@CommerceGate:themeMode',
  THEME_PREFERENCE: '@CommerceGate:themePreference',
  LANGUAGE: '@CommerceGate:language',
  LANGUAGE_PREFERENCE: '@CommerceGate:languagePreference',
  USER_PREFERENCES: '@CommerceGate:userPreferences',
  REMEMBER_ME: '@CommerceGate:rememberMe',
  ONBOARDING_COMPLETED: '@CommerceGate:onboardingCompleted',
} as const;

// Navigation Constants
export const NAVIGATION_KEYS = {
  SPLASH: 'Splash',
  AUTH: 'Auth',
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  VERIFY_EMAIL: 'VerifyEmail',
  RESET_PASSWORD: 'ResetPassword',
  MAIN: 'Main',
  HOME: 'Home',
  COURSES: 'Courses',
  TESTS: 'Tests',
  COMMUNITY: 'Community',
  PROFILE: 'Profile',
  COURSE_DETAILS: 'CourseDetails',
  TEST_INSTRUCTIONS: 'TestInstructions',
  TEST_SCREEN: 'TestScreen',
  TEST_RESULTS: 'TestResults',
  PAYMENT: 'Payment',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
  SEARCH: 'Search',
  FAVORITES: 'Favorites',
  DOWNLOADS: 'Downloads',
  HELP: 'Help',
  ABOUT: 'About',
} as const;

// Theme Colors
export const COLORS = {
  // Primary Colors
  PRIMARY: '#6366F1',
  PRIMARY_LIGHT: '#8B5CF6',
  PRIMARY_DARK: '#4F46E5',
  
  // Secondary Colors
  SECONDARY: '#EC4899',
  SECONDARY_LIGHT: '#F472B6',
  SECONDARY_DARK: '#DB2777',
  
  // Accent Colors
  ACCENT: '#10B981',
  ACCENT_LIGHT: '#34D399',
  ACCENT_DARK: '#059669',
  
  // Neutral Colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',
  
  // Status Colors
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  
  // Background Colors
  BACKGROUND_LIGHT: '#FFFFFF',
  BACKGROUND_DARK: '#1F2937',
  SURFACE_LIGHT: '#F9FAFB',
  SURFACE_DARK: '#374151',
  
  // Text Colors
  TEXT_PRIMARY_LIGHT: '#1F2937',
  TEXT_PRIMARY_DARK: '#F9FAFB',
  TEXT_SECONDARY_LIGHT: '#6B7280',
  TEXT_SECONDARY_DARK: '#9CA3AF',
  
  // Border Colors
  BORDER_LIGHT: '#E5E7EB',
  BORDER_DARK: '#4B5563',
  
  // Overlay
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
  OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.3)',

  // Structured Theme Colors for Navigation
  LIGHT: {
    PRIMARY: '#6366F1',
    BACKGROUND: '#FFFFFF',
    SURFACE: '#F9FAFB',
    TEXT: {
      PRIMARY: '#1F2937',
      SECONDARY: '#6B7280',
    },
    BORDER: '#E5E7EB',
  },
  
  DARK: {
    PRIMARY: '#8B5CF6',
    BACKGROUND: '#1F2937',
    SURFACE: '#374151',
    TEXT: {
      PRIMARY: '#F9FAFB',
      SECONDARY: '#9CA3AF',
    },
    BORDER: '#4B5563',
  },

  NEUTRAL: {
    GRAY_50: '#F9FAFB',
    GRAY_100: '#F3F4F6',
    GRAY_200: '#E5E7EB',
    GRAY_300: '#D1D5DB',
    GRAY_400: '#9CA3AF',
    GRAY_500: '#6B7280',
    GRAY_600: '#4B5563',
    GRAY_700: '#374151',
    GRAY_800: '#1F2937',
    GRAY_900: '#111827',
  },
} as const;

// Typography
export const FONTS = {
  REGULAR: 'System',
  MEDIUM: 'System',
  BOLD: 'System',
  LIGHT: 'System',
} as const;

export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  DISPLAY: 48,
} as const;

export const FONT_WEIGHTS = {
  LIGHT: '300',
  REGULAR: '400',
  MEDIUM: '500',
  SEMIBOLD: '600',
  BOLD: '700',
  EXTRABOLD: '800',
} as const;

// Spacing
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
} as const;

// Border Radius
export const BORDER_RADIUS = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
  FULL: 9999,
} as const;

// Animation Duration
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  VERY_SLOW: 500,
} as const;

// Screen Dimensions
export const SCREEN_BREAKPOINTS = {
  PHONE: 428,
  TABLET: 768,
  DESKTOP: 1024,
} as const;

// Test Configuration
export const TEST_CONFIG = {
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  WARNING_TIME: 300000, // 5 minutes
  CRITICAL_TIME: 60000, // 1 minute
  MAX_QUESTION_TIME: 300, // 5 minutes per question
  PROCTORING_CHECK_INTERVAL: 5000, // 5 seconds
} as const;

// Course Configuration
export const COURSE_CONFIG = {
  VIDEO_QUALITY_OPTIONS: ['360p', '480p', '720p', '1080p'],
  DEFAULT_VIDEO_QUALITY: '720p',
  PROGRESS_SAVE_INTERVAL: 10000, // 10 seconds
  BOOKMARK_LIMIT: 50,
  DOWNLOAD_QUALITY: '720p',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  COURSE_UPDATE: 'course_update',
  TEST_REMINDER: 'test_reminder',
  RESULT_AVAILABLE: 'result_available',
  NEW_MESSAGE: 'new_message',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  SYSTEM_MAINTENANCE: 'system_maintenance',
} as const;

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  OFFLINE_ERROR: 'OFFLINE_ERROR',
  BIOMETRIC_ERROR: 'BIOMETRIC_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^[+]?[1-9][\d\s\-()]{7,15}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  NAME: /^[a-zA-Z\s]{2,50}$/,
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  IMAGE: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  VIDEO: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_TYPES: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
  },
  DOCUMENT: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  AUDIO: {
    MAX_SIZE: 20 * 1024 * 1024, // 20MB
    ALLOWED_TYPES: ['audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg'],
  },
} as const;

// Social Features
export const SOCIAL_CONFIG = {
  MAX_POST_LENGTH: 500,
  MAX_COMMENT_LENGTH: 200,
  MAX_HASHTAGS: 10,
  MAX_MENTIONS: 10,
  POST_LOAD_LIMIT: 20,
  COMMENT_LOAD_LIMIT: 10,
} as const;

// Gamification
export const GAMIFICATION_CONFIG = {
  POINTS: {
    COURSE_COMPLETION: 100,
    TEST_PASS: 50,
    PERFECT_SCORE: 25,
    DAILY_LOGIN: 5,
    SHARE_CONTENT: 10,
    HELP_COMMUNITY: 15,
  },
  BADGES: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert',
    HELPER: 'helper',
    ACHIEVER: 'achiever',
  },
  LEVELS: {
    BRONZE: { min: 0, max: 999 },
    SILVER: { min: 1000, max: 4999 },
    GOLD: { min: 5000, max: 9999 },
    PLATINUM: { min: 10000, max: 24999 },
    DIAMOND: { min: 25000, max: Infinity },
  },
} as const;

// Analytics Events
export const ANALYTICS_EVENTS = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  COURSE_VIEW: 'course_view',
  COURSE_ENROLL: 'course_enroll',
  COURSE_COMPLETE: 'course_complete',
  LESSON_START: 'lesson_start',
  LESSON_COMPLETE: 'lesson_complete',
  TEST_START: 'test_start',
  TEST_SUBMIT: 'test_submit',
  TEST_COMPLETE: 'test_complete',
  PAYMENT_INITIATE: 'payment_initiate',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  SEARCH_PERFORM: 'search_perform',
  CONTENT_SHARE: 'content_share',
  FEATURE_USE: 'feature_use',
  ERROR_OCCUR: 'error_occur',
} as const;

// Device Permissions
export const PERMISSIONS = {
  CAMERA: 'android.permission.CAMERA',
  MICROPHONE: 'android.permission.RECORD_AUDIO',
  STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
  NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
  BIOMETRIC: 'android.permission.USE_BIOMETRIC',
} as const;

// Deep Link Patterns
export const DEEP_LINKS = {
  COURSE: 'commercegate://course/:courseId',
  TEST: 'commercegate://test/:testId',
  PROFILE: 'commercegate://profile/:userId',
  PAYMENT: 'commercegate://payment/:type/:id',
  RESET_PASSWORD: 'commercegate://auth/reset/:token',
  VERIFY_EMAIL: 'commercegate://auth/verify/:token',
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  BIOMETRIC_AUTH: true,
  OFFLINE_MODE: true,
  PUSH_NOTIFICATIONS: true,
  ANALYTICS: true,
  CRASH_REPORTING: true,
  SOCIAL_FEATURES: true,
  GAMIFICATION: true,
  PROCTORING: true,
  LIVE_STREAMING: false,
  AI_RECOMMENDATIONS: true,
  DARK_THEME: true,
  MULTI_LANGUAGE: true,
} as const;

// Cache Keys
export const CACHE_KEYS = {
  COURSES: 'courses',
  TESTS: 'tests',
  CATEGORIES: 'categories',
  USER_PROFILE: 'user_profile',
  COURSE_PROGRESS: 'course_progress',
  TEST_RESULTS: 'test_results',
  NOTIFICATIONS: 'notifications',
  ACHIEVEMENTS: 'achievements',
} as const;

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 2 * 60 * 60 * 1000, // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  PREFIX: 'cache_',
  DEFAULT_TTL: CACHE_TTL.MEDIUM,
  MAX_SIZE: 100, // Maximum number of cached items
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes
  MEMORY_WARNING_THRESHOLD: 0.8, // 80% memory usage
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
  OFFLINE_RETRY_INTERVAL: 60000, // 1 minute
  BACKGROUND_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  REACHABILITY_URL: 'https://clients3.google.com/generate_204',
  REACHABILITY_LONG_TIMEOUT: 60000, // 60 seconds
  REACHABILITY_SHORT_TIMEOUT: 5000, // 5 seconds
  REACHABILITY_REQUEST_TIMEOUT: 15000, // 15 seconds
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  BIOMETRIC_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  PASSWORD_EXPIRY: 90 * 24 * 60 * 60 * 1000, // 90 days
} as const;

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['Basic courses', 'Limited tests', 'Community access'],
  },
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 999,
    features: ['All courses', 'Unlimited tests', 'Priority support', 'Offline downloads'],
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    features: ['All Basic features', 'Live sessions', 'Personal mentor', 'Certificate courses'],
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    features: ['All Premium features', 'Custom courses', 'Analytics dashboard', 'API access'],
  },
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  NET_BANKING: 'net_banking',
  UPI: 'upi',
  WALLET: 'wallet',
  EMI: 'emi',
} as const;

// Course Categories
export const COURSE_CATEGORIES = [
  'Technology',
  'Business',
  'Design',
  'Marketing',
  'Personal Development',
  'Photography',
  'Music',
  'Health & Fitness',
  'Teaching & Academics',
  'Language',
] as const;

// Test Categories
export const TEST_CATEGORIES = [
  'Programming',
  'Web Development',
  'Data Science',
  'Machine Learning',
  'Mobile Development',
  'DevOps',
  'Cybersecurity',
  'Database',
  'Cloud Computing',
  'UI/UX Design',
] as const;

// Question Types
export const QUESTION_TYPES = [
  'mcq',
  'multiple_select',
  'true_false',
  'fill_blank',
  'essay',
  'matching',
  'ordering',
] as const;

// Difficulty Levels
export const DIFFICULTY_LEVELS = [
  'easy',
  'medium',
  'hard',
] as const;

// Course Levels
export const COURSE_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
] as const;

// Default Configuration
export const DEFAULT_CONFIG = {
  THEME: 'light',
  LANGUAGE: 'en',
  NOTIFICATIONS_ENABLED: true,
  BIOMETRIC_ENABLED: false,
  AUTO_SYNC: true,
  VIDEO_QUALITY: '720p',
  DOWNLOAD_OVER_WIFI_ONLY: true,
} as const;

export default {
  API_CONFIG,
  STORAGE_KEYS,
  NAVIGATION_KEYS,
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
  BORDER_RADIUS,
  ANIMATION_DURATION,
  SCREEN_BREAKPOINTS,
  TEST_CONFIG,
  COURSE_CONFIG,
  NOTIFICATION_TYPES,
  ERROR_CODES,
  VALIDATION_RULES,
  FILE_LIMITS,
  SOCIAL_CONFIG,
  GAMIFICATION_CONFIG,
  ANALYTICS_EVENTS,
  PERMISSIONS,
  DEEP_LINKS,
  FEATURE_FLAGS,
  CACHE_KEYS,
  CACHE_TTL,
  CACHE_CONFIG,
  NETWORK_CONFIG,
  SECURITY_CONFIG,
  SUBSCRIPTION_PLANS,
  PAYMENT_METHODS,
  COURSE_CATEGORIES,
  TEST_CATEGORIES,
  QUESTION_TYPES,
  DIFFICULTY_LEVELS,
  COURSE_LEVELS,
  DEFAULT_CONFIG,
};