import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import RNFS from 'react-native-fs';
import { apiService } from './apiService';

// Offline data types
export interface OfflineData {
  id: string;
  type: 'course' | 'test' | 'progress' | 'result' | 'user_action';
  data: any;
  timestamp: number;
  action: 'create' | 'update' | 'delete';
  synced: boolean;
  retryCount: number;
  lastError?: string;
}

export interface OfflineContent {
  id: string;
  type: 'course' | 'lesson' | 'test' | 'media';
  title: string;
  size: number;
  downloadedSize: number;
  filePath: string;
  downloadDate: string;
  expiryDate?: string;
  isDownloaded: boolean;
  checksum?: string;
  metadata: Record<string, any>;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: string;
  pendingUploads: number;
  pendingDownloads: number;
  totalOfflineData: number;
  syncProgress: number;
  errors: string[];
}

export interface OfflineSettings {
  autoSync: boolean;
  syncOnWiFiOnly: boolean;
  autoDownloadCourses: boolean;
  maxOfflineStorage: number; // MB
  keepOfflineContentDays: number;
  syncFrequency: 'immediate' | 'hourly' | 'daily' | 'manual';
  compressContent: boolean;
}

class OfflineService {
  private isInitialized: boolean = false;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncQueue: OfflineData[] = [];
  private downloadQueue: OfflineContent[] = [];
  private netInfoUnsubscribe: (() => void) | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize offline service
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Set up network monitoring
      await this.setupNetworkMonitoring();

      // Load offline data
      await this.loadOfflineData();

      // Set up sync intervals
      await this.setupSyncScheduling();

      // Clean expired content
      await this.cleanExpiredContent();

      this.isInitialized = true;
      console.log('Offline service initialized');
    } catch (error) {
      console.error('Failed to initialize offline service:', error);
    }
  }

  /**
   * Setup network monitoring
   */
  private async setupNetworkMonitoring(): Promise<void> {
    // Get initial network state
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected === true;

    // Subscribe to network changes
    this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true;

      console.log('Network state changed:', { wasOnline, isOnline: this.isOnline });

      if (!wasOnline && this.isOnline) {
        // Came back online - trigger sync
        this.handleNetworkReconnect();
      } else if (wasOnline && !this.isOnline) {
        // Went offline
        this.handleNetworkDisconnect();
      }
    });
  }

  /**
   * Handle network reconnection
   */
  private async handleNetworkReconnect(): Promise<void> {
    console.log('Network reconnected - starting sync');
    
    // Get sync settings
    const settings = await this.getOfflineSettings();
    
    if (settings.autoSync) {
      // Wait a bit for connection to stabilize
      setTimeout(() => {
        this.syncAll();
      }, 2000);
    }
  }

  /**
   * Handle network disconnection
   */
  private handleNetworkDisconnect(): void {
    console.log('Network disconnected - offline mode enabled');
    this.isSyncing = false;
  }

  /**
   * Load offline data from storage
   */
  private async loadOfflineData(): Promise<void> {
    try {
      // Load sync queue
      const syncQueueData = await AsyncStorage.getItem('offline_sync_queue');
      if (syncQueueData) {
        this.syncQueue = JSON.parse(syncQueueData);
      }

      // Load download queue
      const downloadQueueData = await AsyncStorage.getItem('offline_download_queue');
      if (downloadQueueData) {
        this.downloadQueue = JSON.parse(downloadQueueData);
      }

      console.log(`Loaded offline data: ${this.syncQueue.length} sync items, ${this.downloadQueue.length} download items`);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  /**
   * Save offline data to storage
   */
  private async saveOfflineData(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_sync_queue', JSON.stringify(this.syncQueue));
      await AsyncStorage.setItem('offline_download_queue', JSON.stringify(this.downloadQueue));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  /**
   * Setup sync scheduling
   */
  private async setupSyncScheduling(): Promise<void> {
    const settings = await this.getOfflineSettings();

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (settings.syncFrequency !== 'manual' && settings.autoSync) {
      let intervalMs: number;

      switch (settings.syncFrequency) {
        case 'immediate':
          intervalMs = 30000; // 30 seconds
          break;
        case 'hourly':
          intervalMs = 3600000; // 1 hour
          break;
        case 'daily':
          intervalMs = 86400000; // 24 hours
          break;
        default:
          return;
      }

      this.syncInterval = setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.syncAll();
        }
      }, intervalMs);
    }
  }

  /**
   * Get offline settings
   */
  async getOfflineSettings(): Promise<OfflineSettings> {
    try {
      const stored = await AsyncStorage.getItem('offline_settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get offline settings:', error);
    }

    // Default settings
    return {
      autoSync: true,
      syncOnWiFiOnly: false,
      autoDownloadCourses: false,
      maxOfflineStorage: 1024, // 1GB
      keepOfflineContentDays: 30,
      syncFrequency: 'hourly',
      compressContent: true,
    };
  }

  /**
   * Update offline settings
   */
  async updateOfflineSettings(settings: Partial<OfflineSettings>): Promise<void> {
    try {
      const current = await this.getOfflineSettings();
      const updated = { ...current, ...settings };
      
      await AsyncStorage.setItem('offline_settings', JSON.stringify(updated));
      
      // Restart sync scheduling if frequency changed
      if (settings.syncFrequency || settings.autoSync !== undefined) {
        await this.setupSyncScheduling();
      }
    } catch (error) {
      console.error('Failed to update offline settings:', error);
    }
  }

  /**
   * Add data to offline queue
   */
  async addToOfflineQueue(
    type: OfflineData['type'],
    data: any,
    action: OfflineData['action']
  ): Promise<void> {
    const offlineItem: OfflineData = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      action,
      synced: false,
      retryCount: 0,
    };

    this.syncQueue.push(offlineItem);
    await this.saveOfflineData();

    console.log('Added to offline queue:', offlineItem.id);

    // Try immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      const settings = await this.getOfflineSettings();
      if (settings.syncFrequency === 'immediate') {
        this.syncItem(offlineItem);
      }
    }
  }

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      console.log('Cannot sync: offline or already syncing');
      return;
    }

    this.isSyncing = true;
    console.log('Starting full sync...');

    try {
      const settings = await this.getOfflineSettings();
      
      // Check if should sync only on WiFi
      if (settings.syncOnWiFiOnly) {
        const netInfo = await NetInfo.fetch();
        if (netInfo.type !== 'wifi') {
          console.log('Sync cancelled: WiFi only setting enabled');
          this.isSyncing = false;
          return;
        }
      }

      // Sync pending items
      const unsyncedItems = this.syncQueue.filter(item => !item.synced);
      
      for (const item of unsyncedItems) {
        if (!this.isOnline) break; // Check if still online
        await this.syncItem(item);
      }

      // Process download queue
      await this.processDownloadQueue();

      // Update last sync time
      await AsyncStorage.setItem('last_sync_time', new Date().toISOString());
      
      console.log('Sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: OfflineData): Promise<void> {
    try {
      let endpoint: string;
      let method: string;
      let payload: any;

      // Determine API endpoint and method based on item type and action
      switch (item.type) {
        case 'course':
          endpoint = item.action === 'create' ? '/courses' : `/courses/${item.data.id}`;
          method = item.action === 'create' ? 'POST' : item.action === 'update' ? 'PUT' : 'DELETE';
          payload = item.action === 'delete' ? undefined : item.data;
          break;
        case 'test':
          endpoint = item.action === 'create' ? '/tests' : `/tests/${item.data.id}`;
          method = item.action === 'create' ? 'POST' : item.action === 'update' ? 'PUT' : 'DELETE';
          payload = item.action === 'delete' ? undefined : item.data;
          break;
        case 'progress':
          endpoint = `/progress/${item.data.id}`;
          method = 'PUT';
          payload = item.data;
          break;
        case 'result':
          endpoint = item.action === 'create' ? '/results' : `/results/${item.data.id}`;
          method = item.action === 'create' ? 'POST' : 'PUT';
          payload = item.data;
          break;
        case 'user_action':
          endpoint = `/users/actions`;
          method = 'POST';
          payload = item.data;
          break;
        default:
          throw new Error(`Unknown item type: ${item.type}`);
      }

      // Make API call
      switch (method) {
        case 'POST':
          await apiService.post(endpoint, payload);
          break;
        case 'PUT':
          await apiService.put(endpoint, payload);
          break;
        case 'DELETE':
          await apiService.delete(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      // Mark as synced
      item.synced = true;
      item.retryCount = 0;
      delete item.lastError;

      console.log(`Synced item: ${item.id}`);
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
      
      item.retryCount++;
      item.lastError = error instanceof Error ? error.message : 'Unknown error';

      // Remove item if too many retries
      if (item.retryCount >= 5) {
        console.log(`Removing item after ${item.retryCount} retries: ${item.id}`);
        this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
      }
    }

    await this.saveOfflineData();
  }

  /**
   * Download content for offline use
   */
  async downloadContent(
    contentId: string,
    type: OfflineContent['type'],
    title: string,
    url: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const settings = await this.getOfflineSettings();
      
      // Check storage limits
      const currentUsage = await this.getOfflineStorageUsage();
      if (currentUsage >= settings.maxOfflineStorage * 1024 * 1024) {
        throw new Error('Offline storage limit exceeded');
      }

      // Create content entry
      const content: OfflineContent = {
        id: contentId,
        type,
        title,
        size: 0,
        downloadedSize: 0,
        filePath: '',
        downloadDate: new Date().toISOString(),
        isDownloaded: false,
        metadata,
      };

      // Add expiry date if specified
      if (settings.keepOfflineContentDays > 0) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + settings.keepOfflineContentDays);
        content.expiryDate = expiryDate.toISOString();
      }

      // Add to download queue
      this.downloadQueue.push(content);
      await this.saveOfflineData();

      // Start download if online
      if (this.isOnline) {
        await this.downloadContentFile(content, url);
      }

      return true;
    } catch (error) {
      console.error('Failed to download content:', error);
      return false;
    }
  }

  /**
   * Download content file
   */
  private async downloadContentFile(content: OfflineContent, url: string): Promise<void> {
    const fileName = `${content.id}_${content.type}`;
    const filePath = `${RNFS.DocumentDirectoryPath}/offline/${fileName}`;
    
    try {
      // Ensure offline directory exists
      await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/offline`);

      // Download file
      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: filePath,
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          content.downloadedSize = res.bytesWritten;
          content.size = res.contentLength;
          console.log(`Download progress: ${progress.toFixed(2)}%`);
        },
      }).promise;

      if (downloadResult.statusCode === 200) {
        content.isDownloaded = true;
        content.filePath = filePath;
        
        // Calculate checksum for integrity
        const fileContent = await RNFS.readFile(filePath, 'base64');
        content.checksum = this.calculateChecksum(fileContent);
        
        console.log(`Downloaded content: ${content.id}`);
      } else {
        throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
      }
    } catch (error) {
      console.error('Failed to download content file:', error);
      // Clean up partial download
      if (await RNFS.exists(filePath)) {
        await RNFS.unlink(filePath);
      }
      throw error;
    }

    await this.saveOfflineData();
  }

  /**
   * Process download queue
   */
  private async processDownloadQueue(): Promise<void> {
    const pendingDownloads = this.downloadQueue.filter(item => !item.isDownloaded);
    
    for (const content of pendingDownloads) {
      if (!this.isOnline) break;
      
      try {
        // Get download URL from server
        const response: any = await apiService.get(`/content/${content.id}/download-url`);
        const downloadUrl = response.data.url;
        
        await this.downloadContentFile(content, downloadUrl);
      } catch (error) {
        console.error(`Failed to process download for ${content.id}:`, error);
      }
    }
  }

  /**
   * Get offline content
   */
  async getOfflineContent(contentId: string): Promise<OfflineContent | null> {
    const content = this.downloadQueue.find(item => item.id === contentId);
    
    if (content && content.isDownloaded) {
      // Check if file still exists
      const exists = await RNFS.exists(content.filePath);
      if (!exists) {
        content.isDownloaded = false;
        await this.saveOfflineData();
        return null;
      }
      
      return content;
    }
    
    return null;
  }

  /**
   * Read offline content file
   */
  async readOfflineContent(contentId: string): Promise<string | null> {
    const content = await this.getOfflineContent(contentId);
    
    if (content && content.filePath) {
      try {
        return await RNFS.readFile(content.filePath, 'utf8');
      } catch (error) {
        console.error('Failed to read offline content:', error);
      }
    }
    
    return null;
  }

  /**
   * Delete offline content
   */
  async deleteOfflineContent(contentId: string): Promise<boolean> {
    try {
      const contentIndex = this.downloadQueue.findIndex(item => item.id === contentId);
      
      if (contentIndex >= 0) {
        const content = this.downloadQueue[contentIndex];
        
        // Delete file if exists
        if (content.filePath && await RNFS.exists(content.filePath)) {
          await RNFS.unlink(content.filePath);
        }
        
        // Remove from queue
        this.downloadQueue.splice(contentIndex, 1);
        await this.saveOfflineData();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete offline content:', error);
      return false;
    }
  }

  /**
   * Get all downloaded content
   */
  async getDownloadedContent(): Promise<OfflineContent[]> {
    return this.downloadQueue.filter(item => item.isDownloaded);
  }

  /**
   * Clean expired content
   */
  async cleanExpiredContent(): Promise<void> {
    const now = new Date();
    const expiredContent = this.downloadQueue.filter(item => {
      if (!item.expiryDate) return false;
      return new Date(item.expiryDate) < now;
    });

    for (const content of expiredContent) {
      await this.deleteOfflineContent(content.id);
    }

    if (expiredContent.length > 0) {
      console.log(`Cleaned ${expiredContent.length} expired content items`);
    }
  }

  /**
   * Get offline storage usage
   */
  async getOfflineStorageUsage(): Promise<number> {
    try {
      const offlineDir = `${RNFS.DocumentDirectoryPath}/offline`;
      
      if (await RNFS.exists(offlineDir)) {
        const files = await RNFS.readDir(offlineDir);
        let totalSize = 0;
        
        for (const file of files) {
          totalSize += file.size;
        }
        
        return totalSize;
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return 0;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const lastSyncTime = await AsyncStorage.getItem('last_sync_time');
    const pendingUploads = this.syncQueue.filter(item => !item.synced).length;
    const pendingDownloads = this.downloadQueue.filter(item => !item.isDownloaded).length;
    const errors = this.syncQueue
      .filter(item => item.lastError)
      .map(item => item.lastError!)
      .slice(0, 5); // Show last 5 errors

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: lastSyncTime || undefined,
      pendingUploads,
      pendingDownloads,
      totalOfflineData: this.syncQueue.length + this.downloadQueue.length,
      syncProgress: this.isSyncing ? 50 : 100, // Mock progress
      errors,
    };
  }

  /**
   * Force sync now
   */
  async forceSyncNow(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.syncAll();
  }

  /**
   * Clear all offline data
   */
  async clearAllOfflineData(): Promise<void> {
    try {
      // Clear sync queue
      this.syncQueue = [];
      
      // Delete all downloaded content
      for (const content of this.downloadQueue) {
        if (content.filePath && await RNFS.exists(content.filePath)) {
          await RNFS.unlink(content.filePath);
        }
      }
      this.downloadQueue = [];
      
      // Clear offline directory
      const offlineDir = `${RNFS.DocumentDirectoryPath}/offline`;
      if (await RNFS.exists(offlineDir)) {
        await RNFS.unlink(offlineDir);
      }
      
      await this.saveOfflineData();
      
      console.log('Cleared all offline data');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  /**
   * Calculate simple checksum for file integrity
   */
  private calculateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash = ((hash << 5) - hash) + char;
      // eslint-disable-next-line no-bitwise
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Cleanup on service destruction
   */
  cleanup(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const offlineService = new OfflineService();