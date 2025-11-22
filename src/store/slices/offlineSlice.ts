import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OfflineQueue, OfflineAction } from '../../types';

// Initial state
const initialState: OfflineQueue = {
  actions: [],
  isProcessing: false,
  lastSync: null,
};

// Offline slice
const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    addOfflineAction: (state, action: PayloadAction<Omit<OfflineAction, 'timestamp' | 'retryCount'>>) => {
      const offlineAction: OfflineAction = {
        ...action.payload,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: action.payload.maxRetries || 3,
      };
      
      state.actions.push(offlineAction);
    },
    removeOfflineAction: (state, action: PayloadAction<number>) => {
      state.actions.splice(action.payload, 1);
    },
    incrementRetryCount: (state, action: PayloadAction<number>) => {
      const action_item = state.actions[action.payload];
      if (action_item) {
        action_item.retryCount += 1;
      }
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
    clearOfflineActions: (state) => {
      state.actions = [];
    },
    clearFailedActions: (state) => {
      state.actions = state.actions.filter(
        action => action.retryCount < action.maxRetries
      );
    },
  },
});

// Export actions
export const {
  addOfflineAction,
  removeOfflineAction,
  incrementRetryCount,
  setProcessing,
  setLastSync,
  clearOfflineActions,
  clearFailedActions,
} = offlineSlice.actions;

// Selectors
export const selectOfflineQueue = (state: { offline: OfflineQueue }) => state.offline;
export const selectOfflineActions = (state: { offline: OfflineQueue }) => state.offline.actions;
export const selectIsProcessingOffline = (state: { offline: OfflineQueue }) => state.offline.isProcessing;
export const selectLastSync = (state: { offline: OfflineQueue }) => state.offline.lastSync;
export const selectPendingActionsCount = (state: { offline: OfflineQueue }) => state.offline.actions.length;
export const selectFailedActions = (state: { offline: OfflineQueue }) =>
  state.offline.actions.filter(action => action.retryCount >= action.maxRetries);

// Export reducer
export default offlineSlice.reducer;