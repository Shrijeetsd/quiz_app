import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notificationService';
import { paymentService } from './paymentService';
import { socialService } from './socialService';
import { offlineService } from './offlineService';
import { analyticsService } from './analyticsService';
import { mobileOptimizationService } from './mobileOptimizationService';
import { authService } from './authService';

// Service initialization status
export interface ServiceStatus {
  name: string;
  initialized: boolean;
  error?: string;
  initTime?: number;
}

export interface AppServicesStatus {
  services: ServiceStatus[];
  totalInitTime: number;
  allInitialized: boolean;
  hasErrors: boolean;
}

class AppServices {
  private isInitialized: boolean = false;
  private servicesStatus: ServiceStatus[] = [];
  private initStartTime: number = 0;

  /**
   * Initialize all app services
   */
  async initializeAll(): Promise<AppServicesStatus> {
    if (this.isInitialized) {
      return this.getServicesStatus();
    }

    this.initStartTime = Date.now();
    this.servicesStatus = [];
    
    console.log('🚀 Starting app services initialization...');

    try {
      // Core services (required for app functionality)
      await this.initializeService('Analytics Service', () => analyticsService.initialize());
      await this.initializeService('Mobile Optimization Service', () => mobileOptimizationService.initialize());

      // Feature services (can fail gracefully)
      await this.initializeService('Offline Service', () => offlineService.initialize());
      await this.initializeService('Social Service', () => socialService.initialize());
      await this.initializeService('Notification Service', () => notificationService.initialize());
      await this.initializeService('Payment Service', () => paymentService.initialize());

      // Mark as initialized
      this.isInitialized = true;

      const status = this.getServicesStatus();
      console.log(`✅ App services initialized in ${status.totalInitTime}ms`);

      // Show initialization summary
      this.logInitializationSummary(status);

      return status;
    } catch (error) {
      console.error('❌ Failed to initialize app services:', error);
      const status = this.getServicesStatus();
      return status;
    }
  }

  /**
   * Initialize individual service with error handling
   */
  private async initializeService(serviceName: string, initFunction: () => Promise<void>): Promise<void> {
    const serviceStartTime = Date.now();
    
    try {
      console.log(`🔄 Initializing ${serviceName}...`);
      await initFunction();
      
      const initTime = Date.now() - serviceStartTime;
      this.servicesStatus.push({
        name: serviceName,
        initialized: true,
        initTime,
      });
      
      console.log(`✅ ${serviceName} initialized in ${initTime}ms`);
    } catch (error) {
      const initTime = Date.now() - serviceStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.servicesStatus.push({
        name: serviceName,
        initialized: false,
        error: errorMessage,
        initTime,
      });
      
      console.error(`❌ ${serviceName} failed to initialize:`, errorMessage);
      
      // Show user-friendly error for critical services
      if (serviceName.includes('Auth') || serviceName.includes('Analytics')) {
        Alert.alert(
          'Service Error',
          `${serviceName} failed to initialize. Some features may not work properly.`,
          [{ text: 'OK' }]
        );
      }
    }
  }

  /**
   * Get services status
   */
  getServicesStatus(): AppServicesStatus {
    const totalInitTime = Date.now() - this.initStartTime;
    const allInitialized = this.servicesStatus.every(service => service.initialized);
    const hasErrors = this.servicesStatus.some(service => !service.initialized);

    return {
      services: [...this.servicesStatus],
      totalInitTime,
      allInitialized,
      hasErrors,
    };
  }

  /**
   * Log initialization summary
   */
  private logInitializationSummary(status: AppServicesStatus): void {
    console.log('\n📊 Service Initialization Summary:');
    console.log('=====================================');
    
    status.services.forEach(service => {
      const icon = service.initialized ? '✅' : '❌';
      const time = service.initTime ? `${service.initTime}ms` : 'N/A';
      const error = service.error ? ` (${service.error})` : '';
      console.log(`${icon} ${service.name}: ${time}${error}`);
    });
    
    console.log('=====================================');
    console.log(`🏁 Total initialization time: ${status.totalInitTime}ms`);
    console.log(`📈 Success rate: ${status.services.filter(s => s.initialized).length}/${status.services.length} services`);
    
    if (status.hasErrors) {
      console.log('⚠️  Some services failed to initialize. App functionality may be limited.');
    } else {
      console.log('🎉 All services initialized successfully!');
    }
    console.log('');
  }

  /**
   * Reinitialize failed services
   */
  async reinitializeFailedServices(): Promise<void> {
    const failedServices = this.servicesStatus.filter(service => !service.initialized);
    
    if (failedServices.length === 0) {
      console.log('No failed services to reinitialize');
      return;
    }

    console.log(`🔄 Reinitializing ${failedServices.length} failed services...`);
    
    for (const failedService of failedServices) {
      // Remove from status array
      this.servicesStatus = this.servicesStatus.filter(s => s.name !== failedService.name);
      
      // Reinitialize
      switch (failedService.name) {
        case 'Auth Service':
          // Auth service initialization skipped - no initialize method
          break;
        case 'Analytics Service':
          await this.initializeService('Analytics Service', () => analyticsService.initialize());
          break;
        case 'Mobile Optimization Service':
          await this.initializeService('Mobile Optimization Service', () => mobileOptimizationService.initialize());
          break;
        case 'Offline Service':
          await this.initializeService('Offline Service', () => offlineService.initialize());
          break;
        case 'Social Service':
          await this.initializeService('Social Service', () => socialService.initialize());
          break;
        case 'Notification Service':
          await this.initializeService('Notification Service', () => notificationService.initialize());
          break;
        case 'Payment Service':
          await this.initializeService('Payment Service', () => paymentService.initialize());
          break;
      }
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};

    try {
      // Auth service health
      health.auth = {
        initialized: true, // AuthService is always available
        loggedIn: await authService.getCurrentUser() !== null,
      };

      // Analytics service health
      health.analytics = {
        initialized: true, // Assume initialized if no error
        currentSession: analyticsService.getCurrentSession()?.id,
      };

      // Notification service health
      health.notifications = {
        initialized: true, // Check if FCM token exists
        hasToken: await AsyncStorage.getItem('fcm_token') !== null,
      };

      // Payment service health
      health.payments = {
        initialized: true,
        supportedMethods: paymentService.getSupportedMethods(),
      };

      // Social service health
      health.social = {
        initialized: true,
        hasProfile: await socialService.getCachedUserProfile() !== null,
      };

      // Offline service health
      health.offline = {
        initialized: true,
        syncStatus: await offlineService.getSyncStatus(),
      };

      // Mobile optimization health
      health.optimization = {
        initialized: true,
        status: mobileOptimizationService.getOptimizationStatus(),
      };
    } catch (error) {
      console.error('Failed to get service health:', error);
    }

    return health;
  }

  /**
   * Cleanup all services
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up app services...');

    try {
      // Cleanup services that need it
      await analyticsService.cleanup();
      mobileOptimizationService.cleanup();
      offlineService.cleanup();
      
      console.log('✅ App services cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup app services:', error);
    }
  }

  /**
   * Reset all services (for logout, etc.)
   */
  async resetAll(): Promise<void> {
    console.log('🔄 Resetting all app services...');

    try {
      // Clear stored data
      await offlineService.clearAllOfflineData();
      await analyticsService.clearAnalyticsData();
      
      // Reset flags
      this.isInitialized = false;
      this.servicesStatus = [];
      
      console.log('✅ All services reset');
    } catch (error) {
      console.error('❌ Failed to reset services:', error);
    }
  }

  /**
   * Get app configuration for debugging
   */
  async getAppConfiguration(): Promise<any> {
    const health = await this.getServiceHealth();
    const status = this.getServicesStatus();
    
    return {
      version: '1.0.0',
      buildNumber: '1',
      environment: __DEV__ ? 'development' : 'production',
      services: {
        status: status,
        health: health,
      },
      device: mobileOptimizationService.getOptimizationStatus().device,
      recommendations: mobileOptimizationService.getOptimizationRecommendations(),
    };
  }

  /**
   * Check if all critical services are running
   */
  areServicesHealthy(): boolean {
    const criticalServices = ['Auth Service', 'Analytics Service'];
    return criticalServices.every(serviceName => {
      const service = this.servicesStatus.find(s => s.name === serviceName);
      return service && service.initialized;
    });
  }

  /**
   * Get initialization progress (for splash screen)
   */
  getInitializationProgress(): { progress: number; currentService: string; isComplete: boolean } {
    const totalServices = 7; // Number of services to initialize
    const completedServices = this.servicesStatus.length;
    const progress = (completedServices / totalServices) * 100;
    
    const currentService = completedServices < totalServices 
      ? `Initializing services... (${completedServices}/${totalServices})`
      : 'Initialization complete';
    
    return {
      progress: Math.min(progress, 100),
      currentService,
      isComplete: this.isInitialized,
    };
  }

  /**
   * Get feature flags based on service status
   */
  getFeatureFlags(): Record<string, boolean> {
    const getServiceStatus = (name: string) => {
      const service = this.servicesStatus.find(s => s.name === name);
      return service?.initialized || false;
    };

    return {
      offlineMode: getServiceStatus('Offline Service'),
      pushNotifications: getServiceStatus('Notification Service'),
      payments: getServiceStatus('Payment Service'),
      socialFeatures: getServiceStatus('Social Service'),
      analytics: getServiceStatus('Analytics Service'),
      optimization: getServiceStatus('Mobile Optimization Service'),
    };
  }

  /**
   * Performance monitoring
   */
  async trackServicePerformance(serviceName: string, operation: string, duration: number): Promise<void> {
    try {
      await analyticsService.trackPerformance('app_launch', duration, 'ms', {
        serviceName,
        operation,
      });
    } catch (error) {
      console.error('Failed to track service performance:', error);
    }
  }
}

// Export singleton instance
export const appServices = new AppServices();

// Convenience exports for direct access to services
export {
  authService,
  analyticsService,
  notificationService,
  paymentService,
  socialService,
  offlineService,
  mobileOptimizationService,
};