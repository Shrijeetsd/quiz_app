import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UIState, Notification } from '../../types';

// Initial state
const initialState: UIState = {
  theme: 'light',
  language: 'en',
  notifications: [],
  isOnline: true,
  loading: {},
  errors: {},
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add new notification at the beginning
      state.notifications.unshift(action.payload);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      if (action.payload.loading) {
        state.loading[action.payload.key] = true;
      } else {
        delete state.loading[action.payload.key];
      }
    },
    setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
      if (action.payload.error) {
        state.errors[action.payload.key] = action.payload.error;
      } else {
        delete state.errors[action.payload.key];
      }
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },
    clearAllLoading: (state) => {
      state.loading = {};
    },
    showToast: (state, action: PayloadAction<{
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
      duration?: number;
    }>) => {
      // Create a notification-like toast
      const toast: Notification = {
        id: Date.now().toString(),
        title: '',
        message: action.payload.message,
        type: action.payload.type,
        read: false,
        createdAt: new Date().toISOString(),
      };
      
      state.notifications.unshift(toast);
    },
  },
});

// Export actions
export const {
  setTheme,
  setLanguage,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  setOnlineStatus,
  setLoading,
  setError,
  clearError,
  clearAllErrors,
  clearAllLoading,
  showToast,
} = uiSlice.actions;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectLanguage = (state: { ui: UIState }) => state.ui.language;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectUnreadNotifications = (state: { ui: UIState }) => 
  state.ui.notifications.filter(notification => !notification.read);
export const selectUnreadNotificationsCount = (state: { ui: UIState }) =>
  state.ui.notifications.filter(notification => !notification.read).length;
export const selectIsOnline = (state: { ui: UIState }) => state.ui.isOnline;
export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectErrors = (state: { ui: UIState }) => state.ui.errors;

export const selectIsLoading = (key: string) => (state: { ui: UIState }) =>
  Boolean(state.ui.loading[key]);

export const selectError = (key: string) => (state: { ui: UIState }) =>
  state.ui.errors[key] || null;

export const selectHasAnyLoading = (state: { ui: UIState }) =>
  Object.keys(state.ui.loading).length > 0;

export const selectHasAnyErrors = (state: { ui: UIState }) =>
  Object.keys(state.ui.errors).length > 0;

// Loading keys constants
export const LOADING_KEYS = {
  AUTH_LOGIN: 'auth_login',
  AUTH_REGISTER: 'auth_register',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_REFRESH: 'auth_refresh',
  COURSES_FETCH: 'courses_fetch',
  COURSES_ENROLL: 'courses_enroll',
  TESTS_FETCH: 'tests_fetch',
  TEST_SUBMIT: 'test_submit',
  USER_UPDATE: 'user_update',
  PAYMENT_PROCESS: 'payment_process',
  FILE_UPLOAD: 'file_upload',
} as const;

// Error keys constants
export const ERROR_KEYS = {
  AUTH: 'auth',
  COURSES: 'courses',
  TESTS: 'tests',
  USER: 'user',
  PAYMENT: 'payment',
  NETWORK: 'network',
  VALIDATION: 'validation',
} as const;

// Export reducer
export default uiSlice.reducer;