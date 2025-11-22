import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import coursesReducer from './slices/coursesSlice';
import testsReducer from './slices/testsSlice';
import uiReducer from './slices/uiSlice';
import offlineReducer from './slices/offlineSlice';

// Auth slice persist config
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['isAuthenticated', 'user', 'tokens'],
};

// User slice persist config
const userPersistConfig = {
  key: 'user',
  storage: AsyncStorage,
  whitelist: ['profile', 'preferences', 'progress'],
};

// Courses slice persist config
const coursesPersistConfig = {
  key: 'courses',
  storage: AsyncStorage,
  whitelist: ['enrolledCourses'],
  blacklist: ['courses', 'currentCourse'], // Don't persist course list to avoid stale data
};

// Configure root reducer
const rootReducer = {
  auth: persistReducer(authPersistConfig, authReducer),
  user: persistReducer(userPersistConfig, userReducer),
  courses: persistReducer(coursesPersistConfig, coursesReducer),
  tests: testsReducer,
  ui: uiReducer,
  offline: offlineReducer,
};

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__, // Only enable Redux DevTools in development
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store and persistor
export default { store, persistor };