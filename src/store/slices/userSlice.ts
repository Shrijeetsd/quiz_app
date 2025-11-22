import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserState, User, UserPreferences, CourseProgress, Achievement } from '../../types';

// Initial state
const initialState: UserState = {
  profile: null,
  preferences: null,
  progress: [],
  achievements: [],
  isLoading: false,
  error: null,
};

// User slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<User>) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setPreferences: (state, action: PayloadAction<UserPreferences>) => {
      state.preferences = action.payload;
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.preferences) {
        state.preferences = { ...state.preferences, ...action.payload };
      }
    },
    setProgress: (state, action: PayloadAction<CourseProgress[]>) => {
      state.progress = action.payload;
    },
    updateCourseProgress: (state, action: PayloadAction<CourseProgress>) => {
      const index = state.progress.findIndex(p => p.courseId === action.payload.courseId);
      if (index !== -1) {
        state.progress[index] = action.payload;
      } else {
        state.progress.push(action.payload);
      }
    },
    addAchievement: (state, action: PayloadAction<Achievement>) => {
      const exists = state.achievements.find(a => a.id === action.payload.id);
      if (!exists) {
        state.achievements.push(action.payload);
      }
    },
    setAchievements: (state, action: PayloadAction<Achievement[]>) => {
      state.achievements = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearUserData: (state) => {
      state.profile = null;
      state.preferences = null;
      state.progress = [];
      state.achievements = [];
      state.error = null;
    },
  },
});

// Export actions
export const {
  setProfile,
  updateProfile,
  setPreferences,
  updatePreferences,
  setProgress,
  updateCourseProgress,
  addAchievement,
  setAchievements,
  setLoading,
  setError,
  clearError,
  clearUserData,
} = userSlice.actions;

// Selectors
export const selectUser = (state: { user: UserState }) => state.user;
export const selectUserProfile = (state: { user: UserState }) => state.user.profile;
export const selectUserPreferences = (state: { user: UserState }) => state.user.preferences;
export const selectCourseProgress = (state: { user: UserState }) => state.user.progress;
export const selectUserAchievements = (state: { user: UserState }) => state.user.achievements;
export const selectUserLoading = (state: { user: UserState }) => state.user.isLoading;
export const selectUserError = (state: { user: UserState }) => state.user.error;

export const selectCourseProgressById = (courseId: string) => (state: { user: UserState }) =>
  state.user.progress.find(p => p.courseId === courseId);

export const selectUserLevel = (state: { user: UserState }) => {
  const totalPoints = state.user.achievements.reduce((sum, achievement) => {
    return sum + (achievement.progress?.current || 0);
  }, 0);
  
  if (totalPoints >= 25000) return 'Diamond';
  if (totalPoints >= 10000) return 'Platinum';
  if (totalPoints >= 5000) return 'Gold';
  if (totalPoints >= 1000) return 'Silver';
  return 'Bronze';
};

// Export reducer
export default userSlice.reducer;