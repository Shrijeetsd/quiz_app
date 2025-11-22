import { AppState, AppStateStatus, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';

// Mobile optimization types
export interface PerformanceSettings {
  enableAnimations: boolean;
  enableHapticFeedback: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  videoQuality: 'low' | 'medium' | 'high';
  cacheSize: number; // MB
  backgroundSync: boolean;
  dataSaver: boolean;
  batteryOptimization: boolean;
  memoryOptimization: boolean;
}

export interface BatteryOptimization {
  isLowPowerMode: boolean;
  batteryLevel: number;
  chargingState: 'charging' | 'unplugged' | 'full';
  adaptiveSettings: {
    reduceAnimations: boolean;
    lowerImageQuality: boolean;
    disableBackgroundSync: boolean;
    reducePushNotifications: boolean;
  };
}

export interface MemoryOptimization {
  totalMemory: number;
  usedMemory: number;
  availableMemory: number;
  memoryPressure: 'low' | 'medium' | 'high' | 'critical';
  cacheManagement: {
    imageCacheSize: number;
    videoCacheSize: number;
    apiCacheSize: number;
    maxCacheAge: number; // hours
  };
}

export interface NetworkOptimization {
  connectionType: string;
  isMetered: boolean;
  strength: 'weak' | 'fair' | 'good' | 'excellent';
  adaptiveSettings: {
    preloadContent: boolean;
    imageCompression: number;
    videoStreaming: boolean;
    backgroundDownloads: boolean;
  };
}

export interface DeviceCapabilities {
  screenSize: { width: number; height: number };
  pixelDensity: number;
  isTablet: boolean;
  hasNotch: boolean;
  supportsBiometrics: boolean;
  supportsNFC: boolean;
  hasCamera: boolean;
  processorCount: number;
  architecture: string;
  storageSpace: {
    total: number;
    free: number;
    used: number;
  };
}

export interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  cpuUsage: number;
  batteryUsage: number;
  networkUsage: {
    bytesReceived: number;
    bytesSent: number;
  };
  renderTime: number;
  appLaunchTime: number;
}

class MobileOptimizationService {
  private isInitialized: boolean = false;
  private performanceSettings: PerformanceSettings | null = null;
  private deviceCapabilities: DeviceCapabilities | null = null;
  private batteryOptimization: BatteryOptimization | null = null;
  private memoryOptimization: MemoryOptimization | null = null;
  private networkOptimization: NetworkOptimization | null = null;
  private performanceMonitoringInterval: ReturnType<typeof setInterval> | null = null;
  private memoryCleanupInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize mobile optimization service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Detect device capabilities
      await this.detectDeviceCapabilities();

      // Load performance settings
      await this.loadPerformanceSettings();

      // Initialize battery optimization
      await this.initializeBatteryOptimization();

      // Initialize memory optimization
      await this.initializeMemoryOptimization();

      // Initialize network optimization
      await this.initializeNetworkOptimization();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      // Setup app state handlers
      this.setupAppStateHandlers();

      // Apply initial optimizations
      await this.applyOptimizations();

      this.isInitialized = true;
      console.log('Mobile optimization service initialized');
    } catch (error) {
      console.error('Failed to initialize mobile optimization service:', error);
    }
  }

  /**
   * Detect device capabilities
   */
  private async detectDeviceCapabilities(): Promise<void> {
    try {
      const screenData = Dimensions.get('screen');
      const windowData = Dimensions.get('window');

      this.deviceCapabilities = {
        screenSize: {
          width: screenData.width,
          height: screenData.height,
        },
        pixelDensity: screenData.scale,
        isTablet: await DeviceInfo.isTablet(),
        hasNotch: screenData.height !== windowData.height,
        supportsBiometrics: await DeviceInfo.supportedAbis().then(() => true).catch(() => false),
        supportsNFC: Platform.OS === 'android', // Simplified check
        hasCamera: await DeviceInfo.hasSystemFeature('android.hardware.camera').catch(() => true),
        processorCount: 1, // Default processor count
        architecture: await DeviceInfo.supportedAbis().then(abis => abis[0]).catch(() => 'unknown'),
        storageSpace: {
          total: await DeviceInfo.getTotalDiskCapacity().catch(() => 0),
          free: await DeviceInfo.getFreeDiskStorage().catch(() => 0),
          used: 0, // Will be calculated
        },
      };

      // Calculate used storage
      this.deviceCapabilities.storageSpace.used = 
        this.deviceCapabilities.storageSpace.total - this.deviceCapabilities.storageSpace.free;

      console.log('Device capabilities detected:', this.deviceCapabilities);
    } catch (error) {
      console.error('Failed to detect device capabilities:', error);
    }
  }

  /**
   * Load performance settings
   */
  private async loadPerformanceSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('performance_settings');
      if (stored) {
        this.performanceSettings = JSON.parse(stored);
      } else {
        // Default settings based on device capabilities
        this.performanceSettings = await this.generateOptimalSettings();
        await this.savePerformanceSettings();
      }
    } catch (error) {
      console.error('Failed to load performance settings:', error);
      this.performanceSettings = await this.generateOptimalSettings();
    }
  }

  /**
   * Generate optimal settings based on device
   */
  private async generateOptimalSettings(): Promise<PerformanceSettings> {
    const totalMemory = await DeviceInfo.getTotalMemory().catch(() => 2 * 1024 * 1024 * 1024); // Default 2GB
    const isLowEndDevice = totalMemory < 3 * 1024 * 1024 * 1024; // Less than 3GB RAM

    return {
      enableAnimations: !isLowEndDevice,
      enableHapticFeedback: true,
      imageQuality: isLowEndDevice ? 'medium' : 'high',
      videoQuality: isLowEndDevice ? 'medium' : 'high',
      cacheSize: isLowEndDevice ? 50 : 200, // MB
      backgroundSync: !isLowEndDevice,
      dataSaver: false,
      batteryOptimization: true,
      memoryOptimization: isLowEndDevice,
    };
  }

  /**
   * Save performance settings
   */
  private async savePerformanceSettings(): Promise<void> {
    if (!this.performanceSettings) return;

    try {
      await AsyncStorage.setItem('performance_settings', JSON.stringify(this.performanceSettings));
    } catch (error) {
      console.error('Failed to save performance settings:', error);
    }
  }

  /**
   * Initialize battery optimization
   */
  private async initializeBatteryOptimization(): Promise<void> {
    try {
      const batteryLevel = await DeviceInfo.getBatteryLevel();
      const isLowPowerMode = false; // Power save mode detection not available

      this.batteryOptimization = {
        isLowPowerMode,
        batteryLevel: batteryLevel * 100, // Convert to percentage
        chargingState: 'unplugged', // Will be updated by monitoring
        adaptiveSettings: {
          reduceAnimations: isLowPowerMode || batteryLevel < 0.2,
          lowerImageQuality: isLowPowerMode || batteryLevel < 0.15,
          disableBackgroundSync: isLowPowerMode || batteryLevel < 0.1,
          reducePushNotifications: batteryLevel < 0.05,
        },
      };

      // Monitor battery changes
      DeviceInfo.getBatteryLevel().then(level => {
        this.updateBatteryOptimization(level * 100);
      });

    } catch (error) {
      console.error('Failed to initialize battery optimization:', error);
    }
  }

  /**
   * Initialize memory optimization
   */
  private async initializeMemoryOptimization(): Promise<void> {
    try {
      const totalMemory = await DeviceInfo.getTotalMemory();
      const usedMemory = await DeviceInfo.getUsedMemory();
      const availableMemory = totalMemory - usedMemory;
      
      const memoryUsageRatio = usedMemory / totalMemory;
      let memoryPressure: MemoryOptimization['memoryPressure'] = 'low';

      if (memoryUsageRatio > 0.9) {
        memoryPressure = 'critical';
      } else if (memoryUsageRatio > 0.8) {
        memoryPressure = 'high';
      } else if (memoryUsageRatio > 0.6) {
        memoryPressure = 'medium';
      }

      this.memoryOptimization = {
        totalMemory,
        usedMemory,
        availableMemory,
        memoryPressure,
        cacheManagement: {
          imageCacheSize: memoryPressure === 'high' ? 20 : 50, // MB
          videoCacheSize: memoryPressure === 'high' ? 10 : 30, // MB
          apiCacheSize: memoryPressure === 'high' ? 5 : 15, // MB
          maxCacheAge: memoryPressure === 'high' ? 1 : 24, // hours
        },
      };

      // Start memory cleanup interval
      this.startMemoryCleanup();

    } catch (error) {
      console.error('Failed to initialize memory optimization:', error);
    }
  }

  /**
   * Initialize network optimization
   */
  private async initializeNetworkOptimization(): Promise<void> {
    try {
      const netInfo = await NetInfo.fetch();
      const connectionType = netInfo.type || 'unknown';
      const isMetered = netInfo.details?.isConnectionExpensive || false;

      // Estimate connection strength (simplified)
      let strength: NetworkOptimization['strength'] = 'good';
      if (connectionType === 'cellular') {
        strength = 'fair'; // Conservative for cellular
      } else if (connectionType === 'wifi') {
        strength = 'excellent';
      }

      this.networkOptimization = {
        connectionType,
        isMetered,
        strength,
        adaptiveSettings: {
          preloadContent: (strength === 'excellent' || strength === 'good') && !isMetered,
          imageCompression: isMetered ? 80 : 90,
          videoStreaming: true,
          backgroundDownloads: !isMetered && (strength === 'excellent' || strength === 'good'),
        },
      };

      // Monitor network changes
      NetInfo.addEventListener(state => {
        this.updateNetworkOptimization(state);
      });

    } catch (error) {
      console.error('Failed to initialize network optimization:', error);
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (this.performanceMonitoringInterval) {
      clearInterval(this.performanceMonitoringInterval);
    }

    this.performanceMonitoringInterval = setInterval(async () => {
      await this.updatePerformanceMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Start memory cleanup
   */
  private startMemoryCleanup(): void {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
    }

    this.memoryCleanupInterval = setInterval(async () => {
      await this.performMemoryCleanup();
    }, 300000); // Every 5 minutes
  }

  /**
   * Setup app state handlers
   */
  private setupAppStateHandlers(): void {
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
        // App came to foreground
        await this.refreshOptimizations();
        break;
      case 'background':
        // App went to background
        await this.applyBackgroundOptimizations();
        break;
      case 'inactive':
        // App is transitioning
        break;
    }
  }

  /**
   * Apply optimizations based on current conditions
   */
  private async applyOptimizations(): Promise<void> {
    if (!this.performanceSettings) return;

    try {
      // Apply battery optimizations
      if (this.batteryOptimization) {
        await this.applyBatteryOptimizations();
      }

      // Apply memory optimizations
      if (this.memoryOptimization) {
        await this.applyMemoryOptimizations();
      }

      // Apply network optimizations
      if (this.networkOptimization) {
        await this.applyNetworkOptimizations();
      }

      console.log('Optimizations applied');
    } catch (error) {
      console.error('Failed to apply optimizations:', error);
    }
  }

  /**
   * Apply battery optimizations
   */
  private async applyBatteryOptimizations(): Promise<void> {
    if (!this.batteryOptimization || !this.performanceSettings) return;

    const { adaptiveSettings } = this.batteryOptimization;

    // Adjust settings based on battery state
    if (adaptiveSettings.reduceAnimations) {
      this.performanceSettings.enableAnimations = false;
    }

    if (adaptiveSettings.lowerImageQuality) {
      this.performanceSettings.imageQuality = 'low';
      this.performanceSettings.videoQuality = 'low';
    }

    if (adaptiveSettings.disableBackgroundSync) {
      this.performanceSettings.backgroundSync = false;
    }

    await this.savePerformanceSettings();
  }

  /**
   * Apply memory optimizations
   */
  private async applyMemoryOptimizations(): Promise<void> {
    if (!this.memoryOptimization) return;

    const { memoryPressure } = this.memoryOptimization;

    if (memoryPressure === 'high' || memoryPressure === 'critical') {
      // Aggressive memory cleanup
      await this.performMemoryCleanup();
      
      // Reduce cache sizes
      await this.reduceCacheSizes();
      
      // Disable memory-intensive features
      if (this.performanceSettings) {
        this.performanceSettings.enableAnimations = false;
        this.performanceSettings.cacheSize = Math.min(this.performanceSettings.cacheSize, 30);
        await this.savePerformanceSettings();
      }
    }
  }

  /**
   * Apply network optimizations
   */
  private async applyNetworkOptimizations(): Promise<void> {
    if (!this.networkOptimization || !this.performanceSettings) return;

    const { isMetered, strength } = this.networkOptimization;

    if (isMetered || strength === 'weak') {
      this.performanceSettings.dataSaver = true;
      this.performanceSettings.imageQuality = 'low';
      this.performanceSettings.videoQuality = 'low';
      this.performanceSettings.backgroundSync = false;
    }

    await this.savePerformanceSettings();
  }

  /**
   * Apply background optimizations
   */
  private async applyBackgroundOptimizations(): Promise<void> {
    // Reduce background activities to save battery
    if (this.batteryOptimization?.isLowPowerMode) {
      // Pause non-critical background tasks
      console.log('Applying background optimizations for low power mode');
    }
  }

  /**
   * Refresh optimizations
   */
  private async refreshOptimizations(): Promise<void> {
    // Update current conditions
    await this.updateBatteryStatus();
    await this.updateMemoryStatus();
    
    // Reapply optimizations
    await this.applyOptimizations();
  }

  /**
   * Update battery optimization
   */
  private async updateBatteryOptimization(batteryLevel: number): Promise<void> {
    if (!this.batteryOptimization) return;

    const wasLowPower = this.batteryOptimization.isLowPowerMode;
    this.batteryOptimization.batteryLevel = batteryLevel;
    this.batteryOptimization.isLowPowerMode = batteryLevel < 20;

    // Update adaptive settings
    this.batteryOptimization.adaptiveSettings = {
      reduceAnimations: batteryLevel < 20,
      lowerImageQuality: batteryLevel < 15,
      disableBackgroundSync: batteryLevel < 10,
      reducePushNotifications: batteryLevel < 5,
    };

    // Apply changes if battery state changed significantly
    if (wasLowPower !== this.batteryOptimization.isLowPowerMode) {
      await this.applyBatteryOptimizations();
    }
  }

  /**
   * Update network optimization
   */
  private async updateNetworkOptimization(netState: any): Promise<void> {
    if (!this.networkOptimization) return;

    const wasMetered = this.networkOptimization.isMetered;
    this.networkOptimization.connectionType = netState.type || 'unknown';
    this.networkOptimization.isMetered = netState.details?.isConnectionExpensive || false;

    // Update adaptive settings
    const isMetered = this.networkOptimization.isMetered;
    this.networkOptimization.adaptiveSettings = {
      preloadContent: !isMetered && netState.isConnected,
      imageCompression: isMetered ? 80 : 90,
      videoStreaming: netState.isConnected && !isMetered,
      backgroundDownloads: !isMetered && netState.isConnected,
    };

    // Apply changes if network state changed significantly
    if (wasMetered !== isMetered) {
      await this.applyNetworkOptimizations();
    }
  }

  /**
   * Update performance metrics
   */
  private async updatePerformanceMetrics(): Promise<void> {
    try {
      const usedMemory = await DeviceInfo.getUsedMemory();
      const totalMemory = await DeviceInfo.getTotalMemory();
      const batteryLevel = await DeviceInfo.getBatteryLevel();

      if (this.memoryOptimization) {
        this.memoryOptimization.usedMemory = usedMemory;
        this.memoryOptimization.availableMemory = totalMemory - usedMemory;
        
        const memoryUsageRatio = usedMemory / totalMemory;
        if (memoryUsageRatio > 0.9) {
          this.memoryOptimization.memoryPressure = 'critical';
        } else if (memoryUsageRatio > 0.8) {
          this.memoryOptimization.memoryPressure = 'high';
        } else if (memoryUsageRatio > 0.6) {
          this.memoryOptimization.memoryPressure = 'medium';
        } else {
          this.memoryOptimization.memoryPressure = 'low';
        }
      }

      if (this.batteryOptimization) {
        await this.updateBatteryOptimization(batteryLevel * 100);
      }
    } catch (error) {
      console.error('Failed to update performance metrics:', error);
    }
  }

  /**
   * Update battery status
   */
  private async updateBatteryStatus(): Promise<void> {
    try {
      const batteryLevel = await DeviceInfo.getBatteryLevel();
      const isLowPowerMode = false; // Power save mode detection not available
      
      if (this.batteryOptimization) {
        this.batteryOptimization.batteryLevel = batteryLevel * 100;
        this.batteryOptimization.isLowPowerMode = isLowPowerMode;
      }
    } catch (error) {
      console.error('Failed to update battery status:', error);
    }
  }

  /**
   * Update memory status
   */
  private async updateMemoryStatus(): Promise<void> {
    try {
      const totalMemory = await DeviceInfo.getTotalMemory();
      const usedMemory = await DeviceInfo.getUsedMemory();
      
      if (this.memoryOptimization) {
        this.memoryOptimization.totalMemory = totalMemory;
        this.memoryOptimization.usedMemory = usedMemory;
        this.memoryOptimization.availableMemory = totalMemory - usedMemory;
      }
    } catch (error) {
      console.error('Failed to update memory status:', error);
    }
  }

  /**
   * Perform memory cleanup
   */
  private async performMemoryCleanup(): Promise<void> {
    try {
      // Clear expired cache entries
      await this.clearExpiredCache();
      
      // Trigger garbage collection (not available in React Native)

      console.log('Memory cleanup performed');
    } catch (error) {
      console.error('Failed to perform memory cleanup:', error);
    }
  }

  /**
   * Clear expired cache
   */
  private async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        try {
          const item = await AsyncStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            const maxAge = this.memoryOptimization?.cacheManagement.maxCacheAge || 24;
            const ageHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
            
            if (ageHours > maxAge) {
              await AsyncStorage.removeItem(key);
            }
          }
        } catch {
          // Remove corrupted cache entry
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  /**
   * Reduce cache sizes
   */
  private async reduceCacheSizes(): Promise<void> {
    if (!this.memoryOptimization) return;

    // Implement cache size reduction logic
    const { cacheManagement } = this.memoryOptimization;
    
    // Reduce cache limits
    cacheManagement.imageCacheSize = Math.min(cacheManagement.imageCacheSize, 20);
    cacheManagement.videoCacheSize = Math.min(cacheManagement.videoCacheSize, 10);
    cacheManagement.apiCacheSize = Math.min(cacheManagement.apiCacheSize, 5);
    cacheManagement.maxCacheAge = 1; // 1 hour
  }

  /**
   * Get current optimization status
   */
  getOptimizationStatus(): {
    performance: PerformanceSettings | null;
    battery: BatteryOptimization | null;
    memory: MemoryOptimization | null;
    network: NetworkOptimization | null;
    device: DeviceCapabilities | null;
  } {
    return {
      performance: this.performanceSettings,
      battery: this.batteryOptimization,
      memory: this.memoryOptimization,
      network: this.networkOptimization,
      device: this.deviceCapabilities,
    };
  }

  /**
   * Update performance settings
   */
  async updatePerformanceSettings(settings: Partial<PerformanceSettings>): Promise<void> {
    if (!this.performanceSettings) return;

    this.performanceSettings = { ...this.performanceSettings, ...settings };
    await this.savePerformanceSettings();
    await this.applyOptimizations();
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.batteryOptimization?.batteryLevel && this.batteryOptimization.batteryLevel < 20) {
      recommendations.push('Enable battery saver mode to extend battery life');
    }

    if (this.memoryOptimization?.memoryPressure === 'high') {
      recommendations.push('Close unused apps to free up memory');
    }

    if (this.networkOptimization?.isMetered) {
      recommendations.push('Enable data saver mode to reduce data usage');
    }

    if (this.deviceCapabilities?.storageSpace.free && this.deviceCapabilities.storageSpace.free < 1024 * 1024 * 1024) {
      recommendations.push('Free up storage space for better performance');
    }

    return recommendations;
  }

  /**
   * Cleanup on service destruction
   */
  cleanup(): void {
    if (this.performanceMonitoringInterval) {
      clearInterval(this.performanceMonitoringInterval);
      this.performanceMonitoringInterval = null;
    }

    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
      this.memoryCleanupInterval = null;
    }
  }
}

export const mobileOptimizationService = new MobileOptimizationService();