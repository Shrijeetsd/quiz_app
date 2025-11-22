import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TestsState, Test, TestSession, TestResult, TestFilters } from '../../types';

// Initial state
const initialState: TestsState = {
  tests: [],
  currentTest: null,
  testSession: null,
  results: [],
  isLoading: false,
  error: null,
  filters: {},
};

// Tests slice
const testsSlice = createSlice({
  name: 'tests',
  initialState,
  reducers: {
    setTests: (state, action: PayloadAction<Test[]>) => {
      state.tests = action.payload;
    },
    addTest: (state, action: PayloadAction<Test>) => {
      const exists = state.tests.find(test => test._id === action.payload._id);
      if (!exists) {
        state.tests.push(action.payload);
      }
    },
    updateTest: (state, action: PayloadAction<Test>) => {
      const index = state.tests.findIndex(test => test._id === action.payload._id);
      if (index !== -1) {
        state.tests[index] = action.payload;
      }
    },
    removeTest: (state, action: PayloadAction<string>) => {
      state.tests = state.tests.filter(test => test._id !== action.payload);
    },
    setCurrentTest: (state, action: PayloadAction<Test | null>) => {
      state.currentTest = action.payload;
    },
    startTestSession: (state, action: PayloadAction<{ testId: string; timeRemaining: number }>) => {
      state.testSession = {
        testId: action.payload.testId,
        startTime: new Date().toISOString(),
        timeRemaining: action.payload.timeRemaining,
        currentQuestion: 0,
        responses: {},
        flags: [],
        isSubmitted: false,
      };
    },
    updateTestSession: (state, action: PayloadAction<Partial<TestSession>>) => {
      if (state.testSession) {
        state.testSession = { ...state.testSession, ...action.payload };
      }
    },
    submitTestResponse: (state, action: PayloadAction<{ questionId: string; response: string[] }>) => {
      if (state.testSession) {
        state.testSession.responses[action.payload.questionId] = action.payload.response;
      }
    },
    nextQuestion: (state) => {
      if (state.testSession) {
        state.testSession.currentQuestion += 1;
      }
    },
    previousQuestion: (state) => {
      if (state.testSession && state.testSession.currentQuestion > 0) {
        state.testSession.currentQuestion -= 1;
      }
    },
    goToQuestion: (state, action: PayloadAction<number>) => {
      if (state.testSession) {
        state.testSession.currentQuestion = action.payload;
      }
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      if (state.testSession) {
        state.testSession.timeRemaining = action.payload;
      }
    },
    addFlag: (state, action: PayloadAction<string>) => {
      if (state.testSession && !state.testSession.flags.includes(action.payload)) {
        state.testSession.flags.push(action.payload);
      }
    },
    removeFlag: (state, action: PayloadAction<string>) => {
      if (state.testSession) {
        state.testSession.flags = state.testSession.flags.filter(flag => flag !== action.payload);
      }
    },
    submitTest: (state) => {
      if (state.testSession) {
        state.testSession.isSubmitted = true;
      }
    },
    endTestSession: (state) => {
      state.testSession = null;
    },
    setResults: (state, action: PayloadAction<TestResult[]>) => {
      state.results = action.payload;
    },
    addResult: (state, action: PayloadAction<TestResult>) => {
      const exists = state.results.find(result => result._id === action.payload._id);
      if (!exists) {
        state.results.unshift(action.payload); // Add to beginning for recent results
      }
    },
    updateResult: (state, action: PayloadAction<TestResult>) => {
      const index = state.results.findIndex(result => result._id === action.payload._id);
      if (index !== -1) {
        state.results[index] = action.payload;
      }
    },
    setFilters: (state, action: PayloadAction<TestFilters>) => {
      state.filters = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<TestFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
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
    clearTests: (state) => {
      state.tests = [];
      state.currentTest = null;
      state.error = null;
    },
    clearTestSession: (state) => {
      state.testSession = null;
    },
  },
});

// Export actions
export const {
  setTests,
  addTest,
  updateTest,
  removeTest,
  setCurrentTest,
  startTestSession,
  updateTestSession,
  submitTestResponse,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  updateTimeRemaining,
  addFlag,
  removeFlag,
  submitTest,
  endTestSession,
  setResults,
  addResult,
  updateResult,
  setFilters,
  updateFilters,
  clearFilters,
  setLoading,
  setError,
  clearError,
  clearTests,
  clearTestSession,
} = testsSlice.actions;

// Selectors
export const selectTests = (state: { tests: TestsState }) => state.tests;
export const selectAllTests = (state: { tests: TestsState }) => state.tests.tests;
export const selectCurrentTest = (state: { tests: TestsState }) => state.tests.currentTest;
export const selectTestSession = (state: { tests: TestsState }) => state.tests.testSession;
export const selectTestResults = (state: { tests: TestsState }) => state.tests.results;
export const selectTestFilters = (state: { tests: TestsState }) => state.tests.filters;
export const selectTestsLoading = (state: { tests: TestsState }) => state.tests.isLoading;
export const selectTestsError = (state: { tests: TestsState }) => state.tests.error;

export const selectTestById = (testId: string) => (state: { tests: TestsState }) =>
  state.tests.tests.find(test => test._id === testId);

export const selectIsTestInProgress = (state: { tests: TestsState }) => 
  state.tests.testSession !== null && !state.tests.testSession.isSubmitted;

export const selectCurrentQuestionIndex = (state: { tests: TestsState }) =>
  state.tests.testSession?.currentQuestion || 0;

export const selectCurrentQuestionResponse = (questionId: string) => (state: { tests: TestsState }) =>
  state.tests.testSession?.responses[questionId] || [];

export const selectAnsweredQuestionsCount = (state: { tests: TestsState }) =>
  Object.keys(state.tests.testSession?.responses || {}).length;

export const selectFlaggedQuestions = (state: { tests: TestsState }) =>
  state.tests.testSession?.flags || [];

export const selectIsQuestionFlagged = (questionIndex: number) => (state: { tests: TestsState }) =>
  state.tests.testSession?.flags.includes(questionIndex.toString()) || false;

export const selectFilteredTests = (state: { tests: TestsState }) => {
  const { tests, filters } = state.tests;
  
  return tests.filter(test => {
    // Filter by category
    if (filters.category && test.category !== filters.category) {
      return false;
    }
    
    // Filter by type
    if (filters.type && test.type !== filters.type) {
      return false;
    }
    
    // Filter by difficulty
    if (filters.difficulty) {
      // Assuming difficulty is calculated based on test analytics
      const difficulty = test.analytics.difficultyIndex > 0.7 ? 'hard' : 
                        test.analytics.difficultyIndex > 0.4 ? 'medium' : 'easy';
      if (difficulty !== filters.difficulty) {
        return false;
      }
    }
    
    // Filter by status
    if (filters.status && test.status !== filters.status) {
      return false;
    }
    
    return true;
  });
};

export const selectTestsByCategory = (category: string) => (state: { tests: TestsState }) =>
  state.tests.tests.filter(test => test.category === category);

export const selectTestsByType = (type: string) => (state: { tests: TestsState }) =>
  state.tests.tests.filter(test => test.type === type);

export const selectRecentResults = (limit: number = 5) => (state: { tests: TestsState }) =>
  state.tests.results.slice(0, limit);

export const selectResultByTestId = (testId: string) => (state: { tests: TestsState }) =>
  state.tests.results.find(result => result.test === testId);

export const selectTestProgress = (state: { tests: TestsState }) => {
  if (!state.tests.testSession || !state.tests.currentTest) {
    return 0;
  }
  
  const totalQuestions = state.tests.currentTest.questionsCount;
  const answeredQuestions = Object.keys(state.tests.testSession.responses).length;
  
  return (answeredQuestions / totalQuestions) * 100;
};

export const selectTestTimeProgress = (state: { tests: TestsState }) => {
  if (!state.tests.testSession || !state.tests.currentTest) {
    return 0;
  }
  
  const totalTime = state.tests.currentTest.timeLimit * 60 * 1000; // Convert to milliseconds
  const remainingTime = state.tests.testSession.timeRemaining;
  const elapsedTime = totalTime - remainingTime;
  
  return (elapsedTime / totalTime) * 100;
};

// Export reducer
export default testsSlice.reducer;