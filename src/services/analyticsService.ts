import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { apiService } from './apiService';

// Analytics event types
export interface AnalyticsEvent {
  id: string;
  name: string;
  category: 'user' | 'course' | 'test' | 'performance' | 'error' | 'engagement';
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceId: string;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  deviceInfo: any; // DeviceInfo type
  appVersion: string;
  events: AnalyticsEvent[];
  crashed: boolean;
}

export interface PerformanceMetric {
  id: string;
  type: 'app_launch' | 'screen_load' | 'api_response' | 'memory_usage' | 'crash';
  value: number;
  unit: 'ms' | 'mb' | 'count' | 'percentage';
  timestamp: number;
  context: Record<string, any>;
  sessionId: string;
}

export interface LearningAnalytics {
  userId: string;
  courseProgress: CourseProgressAnalytics[];
  testPerformance: TestPerformanceAnalytics[];
  learningPatterns: LearningPattern[];
  engagementMetrics: EngagementMetrics;
  recommendations: LearningRecommendation[];
}

export interface CourseProgressAnalytics {
  courseId: string;
  courseName: string;
  startDate: string;
  completionDate?: string;
  progressPercentage: number;
  timeSpent: number; // minutes
  lessonsCompleted: number;
  totalLessons: number;
  averageSessionDuration: number;
  completionRate: number;
  dropOffPoints: string[];
}

export interface TestPerformanceAnalytics {
  testId: string;
  testName: string;
  courseId: string;
  attempts: TestAttemptAnalytics[];
  bestScore: number;
  averageScore: number;
  timeSpent: number;
  difficultyRating: number;
  strongTopics: string[];
  weakTopics: string[];
}

export interface TestAttemptAnalytics {
  attemptId: string;
  startTime: string;
  endTime: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  questionAnalytics: QuestionAnalytics[];
}

export interface QuestionAnalytics {
  questionId: string;
  isCorrect: boolean;
  timeSpent: number;
  attempts: number;
  difficulty: number;
  topic: string;
  userAnswer: string;
  correctAnswer: string;
}

export interface LearningPattern {
  type: 'peak_hours' | 'session_duration' | 'learning_style' | 'content_preference';
  pattern: Record<string, any>;
  confidence: number;
  insights: string[];
}

export interface EngagementMetrics {
  dailyActiveTime: number[];
  weeklyStreak: number;
  sessionFrequency: number;
  averageSessionDuration: number;
  contentInteractionRate: number;
  socialInteractionRate: number;
  completionRate: number;
  retentionRate: number;
}

export interface LearningRecommendation {
  id: string;
  type: 'course' | 'topic' | 'study_time' | 'difficulty' | 'content_type';
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export interface CrashReport {
  id: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  appVersion: string;
  deviceInfo: any;
  error: {
    message: string;
    stack: string;
    type: string;
  };
  breadcrumbs: string[];
  context: Record<string, any>;
}

export interface AppPerformanceReport {
  appLaunchTime: number;
  memoryUsage: {
    average: number;
    peak: number;
    current: number;
  };
  screenLoadTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  crashCount: number;
  errorCount: number;
  batteryUsage: number;
  networkUsage: {
    bytesReceived: number;
    bytesSent: number;
  };
}

class AnalyticsService {
  private isInitialized: boolean = false;
  private currentSession: UserSession | null = null;
  private deviceId: string = '';
  private eventQueue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private appStartTime: number = Date.now();
  private currentScreen: string = '';
  private breadcrumbs: string[] = [];

  /**
   * Initialize analytics service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Get or generate device ID
      this.deviceId = await this.getDeviceId();

      // Start user session
      await this.startSession();

      // Set up app state monitoring
      this.setupAppStateMonitoring();

      // Set up error handling
      this.setupErrorHandling();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Start background sync
      this.startBackgroundSync();

      this.isInitialized = true;
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
    }
  }

  /**
   * Get or generate device ID
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      
      if (!deviceId) {
        deviceId = await DeviceInfo.getUniqueId();
        await AsyncStorage.setItem('device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Failed to get device ID:', error);
      return 'unknown';
    }
  }

  /**
   * Start user session
   */
  private async startSession(): Promise<void> {
    try {
      // Get device info
      const deviceInfo = {
        brand: await DeviceInfo.getBrand(),
        model: await DeviceInfo.getModel(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
        bundleId: await DeviceInfo.getBundleId(),
        version: await DeviceInfo.getVersion(),
        readableVersion: await DeviceInfo.getReadableVersion(),
        deviceType: await DeviceInfo.getDeviceType(),
        isTablet: await DeviceInfo.isTablet(),
        totalMemory: await DeviceInfo.getTotalMemory(),
        usedMemory: await DeviceInfo.getUsedMemory(),
      };

      // Create new session
      this.currentSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        deviceInfo,
        appVersion: deviceInfo.version,
        events: [],
        crashed: false,
      };

      // Get user ID from storage
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        this.currentSession.userId = user.id;
      }

      // Track session start
      await this.trackEvent('session_start', 'user', {
        sessionId: this.currentSession.id,
        deviceInfo: this.currentSession.deviceInfo,
      });

      console.log('Session started:', this.currentSession.id);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  /**
   * End user session
   */
  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const endTime = Date.now();
      this.currentSession.endTime = endTime;
      this.currentSession.duration = endTime - this.currentSession.startTime;

      // Track session end
      await this.trackEvent('session_end', 'user', {
        sessionDuration: this.currentSession.duration,
        eventCount: this.currentSession.events.length,
      });

      // Save session data
      await this.saveSession(this.currentSession);

      console.log('Session ended:', this.currentSession.id, 'Duration:', this.currentSession.duration);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Setup app state monitoring
   */
  private setupAppStateMonitoring(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.handleAppStateChange(nextAppState);
    });
  }

  /**
   * Handle app state changes
   */
  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    switch (nextAppState) {
      case 'active':
        await this.trackEvent('app_foreground', 'user', {
          timestamp: Date.now(),
        });
        break;
      case 'background':
        await this.trackEvent('app_background', 'user', {
          timestamp: Date.now(),
        });
        // Sync pending data
        await this.syncAnalyticsData();
        break;
      case 'inactive':
        await this.trackEvent('app_inactive', 'user', {
          timestamp: Date.now(),
        });
        break;
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Global error handler
    const originalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      this.reportCrash(error, isFatal || false);
      
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // Promise rejection handler
    const rejectionHandler = (event: any) => {
      this.reportError(new Error(event.reason || 'Promise rejection'), 'promise_rejection');
    };

    // Add event listener for unhandled promise rejections
    if (typeof globalThis !== 'undefined') {
      // React Native uses globalThis
      (globalThis as any).addEventListener?.('unhandledrejection', rejectionHandler);
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Track app launch time
    this.trackPerformance('app_launch', Date.now() - this.appStartTime, 'ms', {
      deviceInfo: this.currentSession?.deviceInfo,
    });

    // Monitor memory usage periodically
    setInterval(async () => {
      try {
        const usedMemory = await DeviceInfo.getUsedMemory();
        this.trackPerformance('memory_usage', usedMemory, 'mb', {
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Failed to get memory usage:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Track analytics event
   */
  async trackEvent(
    name: string,
    category: AnalyticsEvent['category'],
    properties: Record<string, any> = {}
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        category,
        properties,
        timestamp: Date.now(),
        sessionId: this.currentSession?.id || 'unknown',
        userId: this.currentSession?.userId,
        deviceId: this.deviceId,
      };

      // Add to queue
      this.eventQueue.push(event);

      // Add to current session
      if (this.currentSession) {
        this.currentSession.events.push(event);
      }

      // Add to breadcrumbs for debugging
      this.addBreadcrumb(`Event: ${name} (${category})`);

      console.log('Analytics event tracked:', name, category);

      // Auto-sync if queue is full or for important events
      if (this.eventQueue.length >= 50 || category === 'error') {
        await this.syncAnalyticsData();
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track performance metric
   */
  async trackPerformance(
    type: PerformanceMetric['type'],
    value: number,
    unit: PerformanceMetric['unit'],
    context: Record<string, any> = {}
  ): Promise<void> {
    try {
      const metric: PerformanceMetric = {
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        value,
        unit,
        timestamp: Date.now(),
        context,
        sessionId: this.currentSession?.id || 'unknown',
      };

      this.performanceQueue.push(metric);

      console.log('Performance metric tracked:', type, value, unit);
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreen(screenName: string, properties: Record<string, any> = {}): Promise<void> {
    const screenLoadStart = Date.now();
    
    // Track previous screen time if exists
    if (this.currentScreen) {
      await this.trackEvent('screen_exit', 'user', {
        screenName: this.currentScreen,
        timeSpent: screenLoadStart - (properties.screenEnterTime || screenLoadStart),
      });
    }

    this.currentScreen = screenName;

    await this.trackEvent('screen_view', 'user', {
      screenName,
      ...properties,
    });

    // Track screen load time when provided
    if (properties.loadTime) {
      await this.trackPerformance('screen_load', properties.loadTime, 'ms', {
        screenName,
      });
    }
  }

  /**
   * Track course interaction
   */
  async trackCourseInteraction(
    action: string,
    courseId: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(`course_${action}`, 'course', {
      courseId,
      ...properties,
    });
  }

  /**
   * Track test interaction
   */
  async trackTestInteraction(
    action: string,
    testId: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(`test_${action}`, 'test', {
      testId,
      ...properties,
    });
  }

  /**
   * Track learning progress
   */
  async trackLearningProgress(
    type: 'lesson_complete' | 'course_complete' | 'test_complete' | 'achievement_earned',
    itemId: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.trackEvent(type, 'course', {
      itemId,
      ...properties,
    });
  }

  /**
   * Report error
   */
  async reportError(error: Error, context: string = 'unknown'): Promise<void> {
    await this.trackEvent('error_occurred', 'error', {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      breadcrumbs: [...this.breadcrumbs],
    });
  }

  /**
   * Report crash
   */
  async reportCrash(error: Error, isFatal: boolean): Promise<void> {
    try {
      const crashReport: CrashReport = {
        id: `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        sessionId: this.currentSession?.id || 'unknown',
        userId: this.currentSession?.userId,
        appVersion: this.currentSession?.appVersion || 'unknown',
        deviceInfo: this.currentSession?.deviceInfo,
        error: {
          message: error.message,
          stack: error.stack || 'No stack trace',
          type: error.constructor.name,
        },
        breadcrumbs: [...this.breadcrumbs],
        context: {
          isFatal,
          currentScreen: this.currentScreen,
          eventQueueLength: this.eventQueue.length,
        },
      };

      // Mark current session as crashed
      if (this.currentSession) {
        this.currentSession.crashed = true;
      }

      // Store crash report
      await AsyncStorage.setItem('pending_crash_report', JSON.stringify(crashReport));

      // Track crash event
      await this.trackEvent('app_crash', 'error', {
        isFatal,
        errorMessage: error.message,
        crashId: crashReport.id,
      });

      // Try to sync immediately
      await this.syncAnalyticsData();

      console.error('Crash reported:', crashReport.id);
    } catch (syncError) {
      console.error('Failed to report crash:', syncError);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  private addBreadcrumb(message: string): void {
    const timestamp = new Date().toISOString();
    this.breadcrumbs.push(`${timestamp}: ${message}`);
    
    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50);
    }
  }

  /**
   * Get learning analytics for user
   */
  async getLearningAnalytics(userId?: string): Promise<LearningAnalytics | null> {
    try {
      const targetUserId = userId || this.currentSession?.userId;
      if (!targetUserId) return null;

      const response = await apiService.get(`/analytics/learning/${targetUserId}`);
      return (response as any).data.analytics;
    } catch (error) {
      console.error('Failed to get learning analytics:', error);
      return null;
    }
  }

  /**
   * Get app performance report
   */
  async getAppPerformanceReport(): Promise<AppPerformanceReport | null> {
    try {
      const response = await apiService.get('/analytics/performance');
      return (response as any).data.report;
    } catch (error) {
      console.error('Failed to get performance report:', error);
      return null;
    }
  }

  /**
   * Sync analytics data with server
   */
  async syncAnalyticsData(): Promise<void> {
    try {
      if (this.eventQueue.length === 0 && this.performanceQueue.length === 0) {
        return;
      }

      // Send events
      if (this.eventQueue.length > 0) {
        await apiService.post('/analytics/events', {
          events: this.eventQueue,
        });
        
        console.log(`Synced ${this.eventQueue.length} analytics events`);
        this.eventQueue = [];
      }

      // Send performance metrics
      if (this.performanceQueue.length > 0) {
        await apiService.post('/analytics/performance', {
          metrics: this.performanceQueue,
        });
        
        console.log(`Synced ${this.performanceQueue.length} performance metrics`);
        this.performanceQueue = [];
      }

      // Send crash report if exists
      const pendingCrashReport = await AsyncStorage.getItem('pending_crash_report');
      if (pendingCrashReport) {
        const crashReport = JSON.parse(pendingCrashReport);
        await apiService.post('/analytics/crashes', crashReport);
        await AsyncStorage.removeItem('pending_crash_report');
        console.log('Synced crash report');
      }
    } catch (error) {
      console.error('Failed to sync analytics data:', error);
    }
  }

  /**
   * Save session data
   */
  private async saveSession(session: UserSession): Promise<void> {
    try {
      const sessions = await this.getSavedSessions();
      sessions.push(session);
      
      // Keep only last 10 sessions
      const recentSessions = sessions.slice(-10);
      
      await AsyncStorage.setItem('analytics_sessions', JSON.stringify(recentSessions));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Get saved sessions
   */
  async getSavedSessions(): Promise<UserSession[]> {
    try {
      const stored = await AsyncStorage.getItem('analytics_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get saved sessions:', error);
      return [];
    }
  }

  /**
   * Start background sync
   */
  private startBackgroundSync(): void {
    // Sync every 5 minutes
    setInterval(() => {
      this.syncAnalyticsData();
    }, 300000);
  }

  /**
   * Get current session info
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(): Promise<any> {
    return {
      currentSession: this.currentSession,
      pendingEvents: this.eventQueue.length,
      pendingMetrics: this.performanceQueue.length,
      breadcrumbs: this.breadcrumbs.slice(-10),
      deviceId: this.deviceId,
      currentScreen: this.currentScreen,
    };
  }

  /**
   * Clear analytics data
   */
  async clearAnalyticsData(): Promise<void> {
    try {
      this.eventQueue = [];
      this.performanceQueue = [];
      this.breadcrumbs = [];
      
      await AsyncStorage.multiRemove([
        'analytics_sessions',
        'pending_crash_report',
      ]);
      
      console.log('Analytics data cleared');
    } catch (error) {
      console.error('Failed to clear analytics data:', error);
    }
  }

  /**
   * Cleanup on service destruction
   */
  async cleanup(): Promise<void> {
    await this.endSession();
    await this.syncAnalyticsData();
  }
}

export const analyticsService = new AnalyticsService();