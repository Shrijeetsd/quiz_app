import { apiService } from './apiService';
import { storageService } from './storageService';
import { Question, TestAttempt, QuestionAnswer, ApiPaginatedResponse } from '../types';

export interface TestSearchParams {
  query?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  testType?: 'practice' | 'mock' | 'exam' | 'quiz';
  duration?: number;
  questionCount?: number;
  courseId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'difficulty' | 'popularity' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface TestAttemptData {
  testId: string;
  answers: QuestionAnswer[];
  timeSpent: number;
  startedAt: Date;
  completedAt?: Date;
  isSubmitted: boolean;
}

export interface QuestionResponse {
  questionId: string;
  selectedOptions: string[];
  textAnswer?: string;
  timeSpent: number;
  isCorrect?: boolean;
  explanation?: string;
}

export interface TestProgress {
  testId: string;
  currentQuestionIndex: number;
  answers: Map<string, QuestionResponse>;
  timeRemaining: number;
  startTime: Date;
  isSubmitted: boolean;
  isPaused: boolean;
}

export interface TestSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showTimer: boolean;
  allowReview: boolean;
  strictMode: boolean;
  autoSubmit: boolean;
  showResults: boolean;
  playSound: boolean;
}

export interface TestStats {
  totalTests: number;
  completedTests: number;
  averageScore: number;
  bestScore: number;
  totalTimeSpent: number;
  strongCategories: string[];
  weakCategories: string[];
  recentResults: any[];
}

class TestService {
  private readonly CACHE_KEYS = {
    TESTS: 'tests_cache',
    TEST_DETAIL: 'test_detail_',
    TEST_ATTEMPTS: 'test_attempts',
    TEST_RESULTS: 'test_results',
    TEST_PROGRESS: 'test_progress_',
    OFFLINE_TESTS: 'offline_tests',
    TEST_STATS: 'test_stats',
    TEST_SETTINGS: 'test_settings',
    QUESTION_BANK: 'question_bank_'
  };

  private readonly CACHE_DURATION = {
    TESTS: 30 * 60 * 1000, // 30 minutes
    TEST_DETAIL: 60 * 60 * 1000, // 1 hour
    ATTEMPTS: 24 * 60 * 60 * 1000, // 24 hours
    RESULTS: 24 * 60 * 60 * 1000, // 24 hours
    PROGRESS: 60 * 1000, // 1 minute (frequent updates)
    STATS: 30 * 60 * 1000, // 30 minutes
    QUESTIONS: 60 * 60 * 1000 // 1 hour
  };

  private activeSession: any | null = null;
  private progressTimer: any | null = null;

  // Test browsing and search
  async searchTests(params: TestSearchParams = {}): Promise<ApiPaginatedResponse<any>> {
    try {
      const cacheKey = `${this.CACHE_KEYS.TESTS}_${JSON.stringify(params)}`;
      
      // Try cache first
      const cachedData = await storageService.getCachedItem<any>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await apiService.get<ApiPaginatedResponse<any>>('/api/tests');
      
      // Cache the results
      await storageService.setCachedItem(cacheKey, response, this.CACHE_DURATION.TESTS);
      
      return response;
    } catch (error) {
      console.error('Error searching tests:', error);
      // Try to return cached data on error
      const cacheKey = `${this.CACHE_KEYS.TESTS}_${JSON.stringify(params)}`;
      const cachedData = await storageService.getItem<any>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      throw error;
    }
  }

  async getTestById(testId: string, forceRefresh: boolean = false): Promise<any> {
    try {
      const cacheKey = `${this.CACHE_KEYS.TEST_DETAIL}${testId}`;
      
      if (!forceRefresh) {
        const cachedTest = await storageService.getCachedItem<any>(cacheKey);
        if (cachedTest) {
          return cachedTest;
        }
      }

      const test = await apiService.get<any>(`/api/tests/${testId}`);
      
      // Cache the test detail
      await storageService.setCachedItem(cacheKey, test, this.CACHE_DURATION.TEST_DETAIL);
      
      return test;
    } catch (error) {
      console.error('Error getting test:', error);
      // Try to return cached data on error
      const cacheKey = `${this.CACHE_KEYS.TEST_DETAIL}${testId}`;
      const cachedTest = await storageService.getItem<any>(cacheKey);
      if (cachedTest) {
        return cachedTest;
      }
      throw error;
    }
  }

  async getTestQuestions(testId: string): Promise<Question[]> {
    try {
      const cacheKey = `${this.CACHE_KEYS.QUESTION_BANK}${testId}`;
      
      // Try cache first
      const cachedQuestions = await storageService.getCachedItem<Question[]>(cacheKey);
      if (cachedQuestions) {
        return cachedQuestions;
      }

      const questions = await apiService.get<Question[]>(`/api/tests/${testId}/questions`);
      
      // Cache questions
      await storageService.setCachedItem(cacheKey, questions, this.CACHE_DURATION.QUESTIONS);
      
      return questions;
    } catch (error) {
      console.error('Error getting test questions:', error);
      // Try to return cached data
      const cacheKey = `${this.CACHE_KEYS.QUESTION_BANK}${testId}`;
      const cachedQuestions = await storageService.getItem<Question[]>(cacheKey);
      if (cachedQuestions) {
        return cachedQuestions;
      }
      throw error;
    }
  }

  // Test Session Management
  async startTestSession(testId: string): Promise<any> {
    try {
      // End any existing session
      if (this.activeSession) {
        await this.endTestSession();
      }

      const test = await this.getTestById(testId);
      const questions = await this.getTestQuestions(testId);
      const settings = await this.getTestSettings();

      // Shuffle questions if enabled
      const shuffledQuestions = settings.shuffleQuestions 
        ? this.shuffleArray([...questions]) 
        : questions;

      // Shuffle options for each question if enabled
      if (settings.shuffleOptions) {
        shuffledQuestions.forEach(question => {
          if (question.type === 'mcq' || question.type === 'multiple_select') {
            question.options = this.shuffleArray([...(question.options || [])]);
          }
        });
      }

      const session: any = {
        id: `session_${Date.now()}`,
        testId,
        test,
        questions: shuffledQuestions,
        currentQuestionIndex: 0,
        answers: new Map(),
        timeRemaining: test.duration * 60, // Convert minutes to seconds
        startTime: new Date(),
        isSubmitted: false,
        isPaused: false,
        settings
      };

      this.activeSession = session;
      
      // Save session to storage for recovery
      await this.saveSessionProgress();
      
      // Start progress timer
      this.startProgressTimer();
      
      return session;
    } catch (error) {
      console.error('Error starting test session:', error);
      throw error;
    }
  }

  async resumeTestSession(testId: string): Promise<any | null> {
    try {
      const progressKey = `${this.CACHE_KEYS.TEST_PROGRESS}_${testId}`;
      const savedProgress = await storageService.getItem<any>(progressKey);
      
      if (!savedProgress || savedProgress.isSubmitted) {
        return null;
      }

      const test = await this.getTestById(testId);
      const questions = await this.getTestQuestions(testId);
      
      // Reconstruct session from saved progress
      const session: any = {
        ...savedProgress,
        test,
        questions,
        answers: new Map(savedProgress.answers)
      };

      this.activeSession = session;
      
      // Calculate remaining time
      const elapsed = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
      session.timeRemaining = Math.max(0, (test.duration * 60) - elapsed);
      
      // Start progress timer if not completed
      if (!session.isSubmitted && session.timeRemaining > 0) {
        this.startProgressTimer();
      }
      
      return session;
    } catch (error) {
      console.error('Error resuming test session:', error);
      return null;
    }
  }

  async getCurrentSession(): Promise<any | null> {
    return this.activeSession;
  }

  async pauseTestSession(): Promise<void> {
    if (this.activeSession && !this.activeSession.isPaused) {
      this.activeSession.isPaused = true;
      this.stopProgressTimer();
      await this.saveSessionProgress();
    }
  }

  async resumeSession(): Promise<void> {
    if (this.activeSession && this.activeSession.isPaused) {
      this.activeSession.isPaused = false;
      this.startProgressTimer();
      await this.saveSessionProgress();
    }
  }

  async endTestSession(): Promise<void> {
    if (this.activeSession) {
      this.stopProgressTimer();
      
      // Clear progress from storage
      const progressKey = `${this.CACHE_KEYS.TEST_PROGRESS}${this.activeSession.testId}`;
      await storageService.removeItem(progressKey);
      
      this.activeSession = null;
    }
  }

  // Question answering
  async answerQuestion(questionId: string, response: Omit<QuestionResponse, 'questionId'>): Promise<void> {
    if (!this.activeSession) {
      throw new Error('No active test session');
    }

    const questionResponse: QuestionResponse = {
      questionId,
      ...response
    };

    this.activeSession.answers.set(questionId, questionResponse);
    await this.saveSessionProgress();
  }

  async getQuestionAnswer(questionId: string): Promise<QuestionResponse | null> {
    if (!this.activeSession) {
      return null;
    }

    return this.activeSession.answers.get(questionId) || null;
  }

  async navigateToQuestion(questionIndex: number): Promise<boolean> {
    if (!this.activeSession || questionIndex < 0 || questionIndex >= this.activeSession.questions.length) {
      return false;
    }

    this.activeSession.currentQuestionIndex = questionIndex;
    await this.saveSessionProgress();
    return true;
  }

  async navigateNext(): Promise<boolean> {
    if (!this.activeSession) {
      return false;
    }

    const nextIndex = this.activeSession.currentQuestionIndex + 1;
    return await this.navigateToQuestion(nextIndex);
  }

  async navigatePrevious(): Promise<boolean> {
    if (!this.activeSession) {
      return false;
    }

    const prevIndex = this.activeSession.currentQuestionIndex - 1;
    return await this.navigateToQuestion(prevIndex);
  }

  // Test submission and results
  async submitTest(): Promise<any> {
    if (!this.activeSession) {
      throw new Error('No active test session');
    }

    try {
      this.activeSession.isSubmitted = true;
      this.activeSession.completedAt = new Date();
      this.stopProgressTimer();

      // Prepare submission data
      const answers = Array.from(this.activeSession.answers.values());
      const attemptData: TestAttemptData = {
        testId: this.activeSession.testId,
        answers: answers.map((ans: any) => ({
          questionId: ans.questionId,
          selectedOptions: ans.selectedOptions,
          textAnswer: ans.textAnswer,
          timeSpent: ans.timeSpent
        })),
        timeSpent: Math.floor((Date.now() - new Date(this.activeSession.startTime).getTime()) / 1000),
        startedAt: this.activeSession.startTime,
        completedAt: this.activeSession.completedAt,
        isSubmitted: true
      };

      // Submit to server
      const result = await apiService.post<any>('/api/test-attempts', attemptData);
      
      // Cache the result
      await this.cacheTestResult(result);
      
      // Clear session
      await this.endTestSession();
      
      return result;
    } catch (error) {
      console.error('Error submitting test:', error);
      
      // Store submission for offline sync
      await this.storeOfflineSubmission();
      
      throw error;
    }
  }

  async getTestResults(testId?: string): Promise<any[]> {
    try {
      const endpoint = testId ? `/api/test-results?testId=${testId}` : '/api/test-results';
      const results = await apiService.get<any[]>(endpoint);
      
      // Cache results
      await storageService.setCachedItem(
        this.CACHE_KEYS.TEST_RESULTS,
        results,
        this.CACHE_DURATION.RESULTS
      );
      
      return results;
    } catch (error) {
      console.error('Error getting test results:', error);
      // Try to return cached results
      const cachedResults = await storageService.getItem<any[]>(this.CACHE_KEYS.TEST_RESULTS);
      return cachedResults || [];
    }
  }

  async getTestAttempts(testId?: string): Promise<TestAttempt[]> {
    try {
      const endpoint = testId ? `/api/test-attempts/test/${testId}` : '/api/test-attempts/user';
      const attempts = await apiService.get<TestAttempt[]>(endpoint);
      
      // Cache attempts
      await storageService.setCachedItem(
        this.CACHE_KEYS.TEST_ATTEMPTS,
        attempts,
        this.CACHE_DURATION.ATTEMPTS
      );
      
      return attempts;
    } catch (error) {
      console.error('Error getting test attempts:', error);
      // Try to return cached attempts
      const cachedAttempts = await storageService.getItem<any[]>(this.CACHE_KEYS.TEST_ATTEMPTS);
      return cachedAttempts || [];
    }
  }

  // Test settings
  async getTestSettings(): Promise<TestSettings> {
    try {
      const settings = await storageService.getItem<any>(this.CACHE_KEYS.TEST_SETTINGS);
      if (settings) {
        return settings;
      }

      // Default settings
      const defaultSettings: TestSettings = {
        shuffleQuestions: false,
        shuffleOptions: false,
        showTimer: true,
        allowReview: true,
        strictMode: false,
        autoSubmit: true,
        showResults: true,
        playSound: true
      };

      await this.updateTestSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error('Error getting test settings:', error);
      // Return default settings on error
      return {
        shuffleQuestions: false,
        shuffleOptions: false,
        showTimer: true,
        allowReview: true,
        strictMode: false,
        autoSubmit: true,
        showResults: true,
        playSound: true
      };
    }
  }

  async updateTestSettings(settings: Partial<TestSettings>): Promise<void> {
    try {
      const currentSettings = await this.getTestSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await storageService.setItem(this.CACHE_KEYS.TEST_SETTINGS, updatedSettings);
    } catch (error) {
      console.error('Error updating test settings:', error);
      throw error;
    }
  }

  // Statistics
  async getTestStats(): Promise<TestStats> {
    try {
      const cachedStats = await storageService.getCachedItem<any>(this.CACHE_KEYS.TEST_STATS);
      if (cachedStats) {
        return cachedStats;
      }

      const stats = await apiService.get<TestStats>('/api/tests/stats');
      
      // Cache stats
      await storageService.setCachedItem(
        this.CACHE_KEYS.TEST_STATS,
        stats,
        this.CACHE_DURATION.STATS
      );
      
      return stats;
    } catch (error) {
      console.error('Error getting test stats:', error);
      // Return default stats
      return {
        totalTests: 0,
        completedTests: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeSpent: 0,
        strongCategories: [],
        weakCategories: [],
        recentResults: []
      };
    }
  }

  // Offline support
  async downloadTestForOffline(testId: string): Promise<void> {
    try {
      const test = await this.getTestById(testId);
      const questions = await this.getTestQuestions(testId);
      
      const offlineTests = await storageService.getItem<any[]>(this.CACHE_KEYS.OFFLINE_TESTS) || [];
      const offlineTest = {
        test,
        questions,
        downloadedAt: new Date(),
        lastAccessed: new Date()
      };
      
      // Update or add offline test
      const existingIndex = offlineTests.findIndex((ot: any) => ot.test.id === testId);
      if (existingIndex >= 0) {
        offlineTests[existingIndex] = offlineTest;
      } else {
        offlineTests.push(offlineTest);
      }
      
      await storageService.setItem(this.CACHE_KEYS.OFFLINE_TESTS, offlineTests);
    } catch (error) {
      console.error('Error downloading test for offline:', error);
      throw error;
    }
  }

  async getOfflineTests(): Promise<any[]> {
    try {
      return await storageService.getItem<any[]>(this.CACHE_KEYS.OFFLINE_TESTS) || [];
    } catch (error) {
      console.error('Error getting offline tests:', error);
      return [];
    }
  }

  async removeOfflineTest(testId: string): Promise<void> {
    try {
      const offlineTests = await this.getOfflineTests();
      const updatedTests = offlineTests.filter((ot: any) => ot.test.id !== testId);
      await storageService.setItem(this.CACHE_KEYS.OFFLINE_TESTS, updatedTests);
    } catch (error) {
      console.error('Error removing offline test:', error);
      throw error;
    }
  }

  // Private utility methods
  private startProgressTimer(): void {
    this.stopProgressTimer();
    
    this.progressTimer = setInterval(async () => {
      if (this.activeSession && !this.activeSession.isPaused && this.activeSession.timeRemaining > 0) {
        this.activeSession.timeRemaining--;
        
        // Auto-submit when time runs out
        if (this.activeSession.timeRemaining <= 0) {
          const settings = await this.getTestSettings();
          if (settings.autoSubmit) {
            await this.submitTest();
          }
        }
        
        // Save progress every 30 seconds
        if (this.activeSession.timeRemaining % 30 === 0) {
          await this.saveSessionProgress();
        }
      }
    }, 1000);
  }

  private stopProgressTimer(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private async saveSessionProgress(): Promise<void> {
    if (!this.activeSession) {
      return;
    }

    try {
      const progressKey = `${this.CACHE_KEYS.TEST_PROGRESS}${this.activeSession.testId}`;
      const progressData = {
        ...this.activeSession,
        answers: Array.from(this.activeSession.answers.entries())
      };
      
      await storageService.setItem(progressKey, progressData);
    } catch (error) {
      console.error('Error saving session progress:', error);
    }
  }

  private async cacheTestResult(result: any): Promise<void> {
    try {
      const cachedResults = await storageService.getItem<any[]>(this.CACHE_KEYS.TEST_RESULTS) || [];
      cachedResults.unshift(result);
      
      // Keep only last 50 results
      const trimmedResults = cachedResults.slice(0, 50);
      
      await storageService.setCachedItem(
        this.CACHE_KEYS.TEST_RESULTS,
        trimmedResults,
        this.CACHE_DURATION.RESULTS
      );
      
      await storageService.setCachedItem(
        this.CACHE_KEYS.TEST_RESULTS,
        cachedResults,
        this.CACHE_DURATION.RESULTS
      );
    } catch (error) {
      console.error('Error caching test result:', error);
    }
  }

  private async storeOfflineSubmission(): Promise<void> {
    if (!this.activeSession) {
      return;
    }

    try {
      const offlineSubmissionsKey = 'offline_submissions_queue';
      const queue = await storageService.getItem<any[]>(offlineSubmissionsKey) || [];
      
      const answers = Array.from(this.activeSession.answers.values());
      const submission = {
        testId: this.activeSession.testId,
        answers: answers.map((ans: any) => ({
          questionId: ans.questionId,
          selectedOptions: ans.selectedOptions,
          textAnswer: ans.textAnswer,
          timeSpent: ans.timeSpent
        })),
        timeSpent: Math.floor((Date.now() - new Date(this.activeSession.startTime).getTime()) / 1000),
        startedAt: this.activeSession.startTime,
        completedAt: new Date(),
        isSubmitted: true,
        timestamp: new Date()
      };
      
      queue.push(submission);
      await storageService.setItem(offlineSubmissionsKey, queue);
    } catch (error) {
      console.error('Error storing offline submission:', error);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Sync methods
  async syncOfflineSubmissions(): Promise<void> {
    try {
      const offlineSubmissionsKey = 'offline_submissions_queue';
      const queue = await storageService.getItem<any[]>(offlineSubmissionsKey) || [];
      
      if (queue.length === 0) {
        return;
      }

      const syncPromises = queue.map(async (submission: any) => {
        try {
          await apiService.post('/api/test-attempts', submission);
          return true;
        } catch (error) {
          console.error('Error syncing submission:', error);
          return false;
        }
      });

      const results = await Promise.all(syncPromises);
      
      // Remove successfully synced items
      const failedItems = queue.filter((_: any, index: number) => !results[index]);
      await storageService.setItem(offlineSubmissionsKey, failedItems);
      
      console.log(`Synced ${results.filter(Boolean).length} test submissions`);
    } catch (error) {
      console.error('Error syncing offline submissions:', error);
    }
  }

  // Cache management
  async clearTestCache(): Promise<void> {
    try {
      const keys = Object.values(this.CACHE_KEYS);
      await Promise.all(keys.map(key => storageService.removeItem(key)));
    } catch (error) {
      console.error('Error clearing test cache:', error);
    }
  }
}

export const testService = new TestService();