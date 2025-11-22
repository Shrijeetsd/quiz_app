import messaging from '@react-native-firebase/messaging';
// @ts-ignore - Type definitions not available
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { apiService } from './apiService';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'course_update' | 'test_reminder' | 'result_available' | 'achievement' | 'system' | 'community';
  data?: {
    courseId?: string;
    testId?: string;
    resultId?: string;
    achievementId?: string;
    communityPostId?: string;
    deepLink?: string;
  };
  timestamp: number;
  read: boolean;
  priority: 'high' | 'normal' | 'low';
}

export interface NotificationPreferences {
  courseUpdates: boolean;
  testReminders: boolean;
  results: boolean;
  achievements: boolean;
  community: boolean;
  systemAnnouncements: boolean;
  email: boolean;
  push: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;
  };
}

class NotificationService {
  private fcmToken: string | null = null;
  private notificationQueue: NotificationData[] = [];
  private isInitialized: boolean = false;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Request permissions
      const authStatus = await this.requestPermissions();
      if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED) {
        console.warn('Notification permissions not granted');
        return;
      }

      // Get FCM token
      await this.getFCMToken();

      // Configure push notifications
      this.configurePushNotifications();

      // Set up message handlers
      this.setupMessageHandlers();

      // Sync with server
      await this.syncNotificationsWithServer();

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<any> {
    try {
      const authStatus = await messaging().requestPermission();
      
      if (authStatus === 1) {
        console.log('User has notification permissions enabled');
      } else if (authStatus === 2) {
        console.log('User has provisional notification permissions');
      } else {
        console.log('User has notification permissions disabled');
      }

      return authStatus;
    } catch (error) {
      console.error('Permission request failed:', error);
      return messaging.AuthorizationStatus.DENIED;
    }
  }

  /**
   * Get FCM registration token
   */
  private async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Store token locally
      await AsyncStorage.setItem('fcm_token', token);
      
      // Register token with server
      await this.registerTokenWithServer(token);
      
      console.log('FCM Token obtained:', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with server
   */
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await apiService.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        appVersion: '1.0.0', // Get from package.json or config
      });
    } catch (error) {
      console.error('Failed to register token with server:', error);
    }
  }

  /**
   * Configure local push notifications
   */
  private configurePushNotifications(): void {
    PushNotification.configure({
      onRegister: (token: any) => {
        console.log('Local notification token:', token);
      },
      onNotification: (notification: any) => {
        this.handleLocalNotification(notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      this.createNotificationChannels();
    }
  }

  /**
   * Create notification channels for Android
   */
  private createNotificationChannels(): void {
    const channels = [
      {
        channelId: 'course_updates',
        channelName: 'Course Updates',
        channelDescription: 'Notifications about course content and updates',
        importance: 4,
      },
      {
        channelId: 'test_reminders',
        channelName: 'Test Reminders',
        channelDescription: 'Reminders for upcoming tests and deadlines',
        importance: 5,
      },
      {
        channelId: 'results',
        channelName: 'Results',
        channelDescription: 'Test results and performance updates',
        importance: 4,
      },
      {
        channelId: 'achievements',
        channelName: 'Achievements',
        channelDescription: 'Learning milestones and achievements',
        importance: 3,
      },
      {
        channelId: 'community',
        channelName: 'Community',
        channelDescription: 'Community posts and interactions',
        importance: 2,
      },
      {
        channelId: 'system',
        channelName: 'System',
        channelDescription: 'System announcements and updates',
        importance: 4,
      },
    ];

    channels.forEach(channel => {
      PushNotification.createChannel(channel, () => {
        console.log(`Created notification channel: ${channel.channelId}`);
      });
    });
  }

  /**
   * Set up Firebase message handlers
   */
  private setupMessageHandlers(): void {
    // Background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
      await this.processRemoteMessage(remoteMessage);
    });

    // Foreground message handler
    messaging().onMessage(async (remoteMessage) => {
      console.log('A new FCM message arrived!', remoteMessage);
      await this.handleForegroundMessage(remoteMessage);
    });

    // Notification opened app handler
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      this.handleNotificationAction(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationAction(remoteMessage);
        }
      });

    // Token refresh handler
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = token;
      await AsyncStorage.setItem('fcm_token', token);
      await this.registerTokenWithServer(token);
    });
  }

  /**
   * Process remote message
   */
  private async processRemoteMessage(remoteMessage: any): Promise<void> {
    const notification: NotificationData = {
      id: remoteMessage.messageId || Date.now().toString(),
      title: remoteMessage.notification?.title || 'New Notification',
      body: remoteMessage.notification?.body || '',
      type: remoteMessage.data?.type || 'system',
      data: remoteMessage.data,
      timestamp: Date.now(),
      read: false,
      priority: remoteMessage.data?.priority || 'normal',
    };

    // Store notification locally
    await this.storeNotification(notification);

    // Update badge count
    await this.updateBadgeCount();
  }

  /**
   * Handle foreground message
   */
  private async handleForegroundMessage(remoteMessage: any): Promise<void> {
    await this.processRemoteMessage(remoteMessage);

    // Show in-app notification or alert
    const preferences = await this.getNotificationPreferences();
    if (preferences.push && this.shouldShowNotification(remoteMessage.data?.type, preferences)) {
      Alert.alert(
        remoteMessage.notification?.title || 'New Notification',
        remoteMessage.notification?.body || '',
        [
          { text: 'Dismiss', style: 'cancel' },
          { 
            text: 'View', 
            onPress: () => this.handleNotificationAction(remoteMessage) 
          },
        ]
      );
    }
  }

  /**
   * Handle notification tap/action
   */
  private handleNotificationAction(remoteMessage: any): void {
    const data = remoteMessage.data;
    
    if (data?.deepLink) {
      // Handle deep linking
      this.handleDeepLink(data.deepLink);
    } else if (data?.courseId) {
      // Navigate to course details
      // Navigation will be handled by the navigation service
      console.log('Navigate to course:', data.courseId);
    } else if (data?.testId) {
      // Navigate to test
      console.log('Navigate to test:', data.testId);
    } else if (data?.resultId) {
      // Navigate to results
      console.log('Navigate to results:', data.resultId);
    }

    // Mark notification as read
    if (remoteMessage.messageId) {
      this.markNotificationAsRead(remoteMessage.messageId);
    }
  }

  /**
   * Handle deep links
   */
  private handleDeepLink(deepLink: string): void {
    console.log('Handling deep link:', deepLink);
    // Deep link handling will be implemented with navigation service
  }

  /**
   * Handle local notification
   */
  private handleLocalNotification(notification: any): void {
    console.log('Local notification:', notification);
    
    if (notification.userInteraction) {
      // User tapped on notification
      const data = notification.data;
      this.handleNotificationAction({ data });
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(notification: Partial<NotificationData>): Promise<void> {
    const preferences = await this.getNotificationPreferences();
    
    if (!preferences.push || !this.shouldShowNotification(notification.type, preferences)) {
      return;
    }

    // Check quiet hours
    if (this.isInQuietHours(preferences.quietHours)) {
      console.log('Notification suppressed due to quiet hours');
      return;
    }

    const channelId = this.getChannelIdForType(notification.type || 'system');
    
    PushNotification.localNotification({
      id: notification.id || Date.now().toString(),
      title: notification.title || 'New Notification',
      message: notification.body || '',
      channelId,
      priority: notification.priority === 'high' ? 'high' : 'default',
      vibrate: true,
      playSound: true,
      soundName: 'default',
      userInfo: notification.data || {},
    });
  }

  /**
   * Schedule local notification
   */
  async scheduleNotification(
    notification: Partial<NotificationData>,
    scheduleDate: Date
  ): Promise<void> {
    const channelId = this.getChannelIdForType(notification.type || 'system');
    
    PushNotification.localNotificationSchedule({
      id: notification.id || Date.now().toString(),
      title: notification.title || 'Scheduled Notification',
      message: notification.body || '',
      date: scheduleDate,
      channelId,
      userInfo: notification.data || {},
    });
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem('notification_preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
    }

    // Default preferences
    return {
      courseUpdates: true,
      testReminders: true,
      results: true,
      achievements: true,
      community: true,
      systemAnnouncements: true,
      email: true,
      push: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    };
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const current = await this.getNotificationPreferences();
      const updated = { ...current, ...preferences };
      
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(updated));
      
      // Sync with server
      await this.syncPreferencesWithServer(updated);
      
      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  /**
   * Get stored notifications
   */
  async getNotifications(limit: number = 50): Promise<NotificationData[]> {
    try {
      const stored = await AsyncStorage.getItem('stored_notifications');
      if (stored) {
        const notifications: NotificationData[] = JSON.parse(stored);
        return notifications
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
      }
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
    }
    return [];
  }

  /**
   * Store notification locally
   */
  private async storeNotification(notification: NotificationData): Promise<void> {
    try {
      const existing = await this.getNotifications(100);
      const updated = [notification, ...existing].slice(0, 100); // Keep last 100
      
      await AsyncStorage.setItem('stored_notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications(100);
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      await AsyncStorage.setItem('stored_notifications', JSON.stringify(updated));
      await this.updateBadgeCount();
      
      // Sync with server
      await apiService.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications(100);
      const updated = notifications.map(n => ({ ...n, read: true }));
      
      await AsyncStorage.setItem('stored_notifications', JSON.stringify(updated));
      await this.updateBadgeCount();
      
      // Sync with server
      await apiService.put('/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Update app badge count
   */
  private async updateBadgeCount(): Promise<void> {
    try {
      const unreadCount = await this.getUnreadCount();
      PushNotification.setApplicationIconBadgeNumber(unreadCount);
    } catch (error) {
      console.error('Failed to update badge count:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('stored_notifications');
      PushNotification.setApplicationIconBadgeNumber(0);
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  /**
   * Sync notifications with server
   */
  private async syncNotificationsWithServer(): Promise<void> {
    try {
      // Fetch latest notifications from server
      const response: any = await apiService.get('/notifications');
      if (response.data?.notifications) {
        // Merge with local notifications (server takes priority)
        const serverNotifications = response.data.notifications;
        await AsyncStorage.setItem('stored_notifications', JSON.stringify(serverNotifications));
      }
    } catch (error) {
      console.error('Failed to sync notifications with server:', error);
    }
  }

  /**
   * Sync preferences with server
   */
  private async syncPreferencesWithServer(preferences: NotificationPreferences): Promise<void> {
    try {
      await apiService.put('/notifications/preferences', preferences);
    } catch (error) {
      console.error('Failed to sync preferences with server:', error);
    }
  }

  /**
   * Check if should show notification based on preferences
   */
  private shouldShowNotification(type: string | undefined, preferences: NotificationPreferences): boolean {
    switch (type) {
      case 'course_update':
        return preferences.courseUpdates;
      case 'test_reminder':
        return preferences.testReminders;
      case 'result_available':
        return preferences.results;
      case 'achievement':
        return preferences.achievements;
      case 'community':
        return preferences.community;
      case 'system':
        return preferences.systemAnnouncements;
      default:
        return preferences.systemAnnouncements;
    }
  }

  /**
   * Check if in quiet hours
   */
  private isInQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = quietHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = quietHours.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Get notification channel ID for type
   */
  private getChannelIdForType(type: string): string {
    switch (type) {
      case 'course_update':
        return 'course_updates';
      case 'test_reminder':
        return 'test_reminders';
      case 'result_available':
        return 'results';
      case 'achievement':
        return 'achievements';
      case 'community':
        return 'community';
      default:
        return 'system';
    }
  }

  /**
   * Schedule test reminder
   */
  async scheduleTestReminder(testId: string, testTitle: string, reminderTime: Date): Promise<void> {
    await this.scheduleNotification({
      id: `test_reminder_${testId}`,
      title: 'Test Reminder',
      body: `Don't forget! ${testTitle} is coming up soon.`,
      type: 'test_reminder',
      data: { testId, deepLink: `/test/${testId}` },
      priority: 'high',
    }, reminderTime);
  }

  /**
   * Send achievement notification
   */
  async sendAchievementNotification(achievementTitle: string, description: string): Promise<void> {
    await this.sendLocalNotification({
      title: '🏆 Achievement Unlocked!',
      body: `${achievementTitle}: ${description}`,
      type: 'achievement',
      priority: 'normal',
    });
  }

  /**
   * Send course update notification
   */
  async sendCourseUpdateNotification(courseId: string, courseTitle: string, updateType: string): Promise<void> {
    await this.sendLocalNotification({
      title: 'Course Updated',
      body: `New ${updateType} available in ${courseTitle}`,
      type: 'course_update',
      data: { courseId, deepLink: `/course/${courseId}` },
      priority: 'normal',
    });
  }
}

export const notificationService = new NotificationService();