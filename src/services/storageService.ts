// Storage Service for Commerce Gate App
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS, CACHE_CONFIG } from '../constants';
import type { User, UserPreferences } from '../types';

interface SecureCredentials {
  username: string;
  password: string;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class StorageService {
  private keychain = {
    service: 'CommerceGateApp',
    accessGroup: 'group.commercegateeapp',
  };

  /**
   * Store data securely in Keychain (for sensitive data)
   */
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        key,
        key,
        value,
        this.keychain
      );
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error);
      throw new Error(`Failed to store secure data: ${key}`);
    }
  }

  /**
   * Get data securely from Keychain
   */
  async getSecureItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key, this.keychain);
      
      if (credentials && typeof credentials === 'object' && 'password' in credentials) {
        return (credentials as SecureCredentials).password;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get secure item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from Keychain
   */
  async removeSecureItem(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials({ service: key });
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
    }
  }

  /**
   * Check if secure item exists
   */
  async hasSecureItem(key: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(key, this.keychain);
      return credentials !== false;
    } catch {
      return false;
    }
  }

  /**
   * Store data in AsyncStorage
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Failed to store item ${key}:`, error);
      throw new Error(`Failed to store data: ${key}`);
    }
  }

  /**
   * Get data from AsyncStorage
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      
      if (value === null) {
        return null;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }

  /**
   * Check if item exists in AsyncStorage
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear all data from AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear AsyncStorage:', error);
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return [...await AsyncStorage.getAllKeys()];
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  /**
   * Get multiple items from AsyncStorage
   */
  async getMultiple(keys: string[]): Promise<Record<string, any>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, any> = {};
      
      pairs.forEach(([key, value]) => {
        if (value !== null) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Failed to get multiple items:', error);
      return {};
    }
  }

  /**
   * Set multiple items in AsyncStorage
   */
  async setMultiple(data: Record<string, any>): Promise<void> {
    try {
      const pairs: [string, string][] = Object.entries(data).map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Failed to set multiple items:', error);
      throw new Error('Failed to store multiple items');
    }
  }

  /**
   * Cache data with TTL (Time To Live)
   */
  async setCachedItem<T>(key: string, data: T, ttlMinutes?: number): Promise<void> {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : CACHE_CONFIG.DEFAULT_TTL;
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    await this.setItem(`${CACHE_CONFIG.PREFIX}${key}`, cacheItem);
  }

  /**
   * Get cached data (returns null if expired)
   */
  async getCachedItem<T>(key: string): Promise<T | null> {
    try {
      const cacheItem = await this.getItem<CacheItem<T>>(`${CACHE_CONFIG.PREFIX}${key}`);
      
      if (!cacheItem) {
        return null;
      }
      
      const now = Date.now();
      const isExpired = (now - cacheItem.timestamp) > cacheItem.ttl;
      
      if (isExpired) {
        await this.removeItem(`${CACHE_CONFIG.PREFIX}${key}`);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error(`Failed to get cached item ${key}:`, error);
      return null;
    }
  }

  /**
   * Clear expired cache items
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.PREFIX));
      const now = Date.now();
      
      for (const key of cacheKeys) {
        const cacheItem = await this.getItem<CacheItem<any>>(key);
        if (cacheItem && (now - cacheItem.timestamp) > cacheItem.ttl) {
          await this.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  /**
   * Clear all cache items
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_CONFIG.PREFIX));
      
      for (const key of cacheKeys) {
        await this.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  // Authentication specific methods
  
  /**
   * Store authentication tokens securely
   */
  async storeAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      this.setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  }

  /**
   * Get authentication tokens
   */
  async getAuthTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.getSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
    
    return { accessToken, refreshToken };
  }

  /**
   * Clear authentication tokens
   */
  async clearAuthTokens(): Promise<void> {
    await Promise.all([
      this.removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
      this.removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  }

  /**
   * Store user data
   */
  async storeUserData(user: User): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_DATA, user);
  }

  /**
   * Get user data
   */
  async getUserData(): Promise<User | null> {
    return this.getItem<User>(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Clear user data
   */
  async clearUserData(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Store user preferences
   */
  async storeUserPreferences(preferences: UserPreferences): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<UserPreferences | null> {
    return this.getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
  }

  /**
   * Store biometric preference
   */
  async storeBiometricEnabled(enabled: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled);
  }

  /**
   * Get biometric preference
   */
  async getBiometricEnabled(): Promise<boolean> {
    const enabled = await this.getItem<boolean>(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return enabled ?? false;
  }

  /**
   * Store remember me preference
   */
  async storeRememberMe(remember: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.REMEMBER_ME, remember);
  }

  /**
   * Get remember me preference
   */
  async getRememberMe(): Promise<boolean> {
    const remember = await this.getItem<boolean>(STORAGE_KEYS.REMEMBER_ME);
    return remember ?? false;
  }

  /**
   * Store theme preference
   */
  async storeThemePreference(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.setItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
  }

  /**
   * Get theme preference
   */
  async getThemePreference(): Promise<'light' | 'dark' | 'system'> {
    const theme = await this.getItem<'light' | 'dark' | 'system'>(STORAGE_KEYS.THEME_PREFERENCE);
    return theme ?? 'system';
  }

  /**
   * Store language preference
   */
  async storeLanguagePreference(language: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.LANGUAGE_PREFERENCE, language);
  }

  /**
   * Get language preference
   */
  async getLanguagePreference(): Promise<string> {
    const language = await this.getItem<string>(STORAGE_KEYS.LANGUAGE_PREFERENCE);
    return language ?? 'en';
  }

  /**
   * Store offline data
   */
  async storeOfflineData(key: string, data: any): Promise<void> {
    const fullKey = `${STORAGE_KEYS.OFFLINE_DATA}.${key}`;
    await this.setItem(fullKey, data);
  }

  /**
   * Get offline data
   */
  async getOfflineData<T>(key: string): Promise<T | null> {
    const fullKey = `${STORAGE_KEYS.OFFLINE_DATA}.${key}`;
    return this.getItem<T>(fullKey);
  }

  /**
   * Clear offline data
   */
  async clearOfflineData(key?: string): Promise<void> {
    if (key) {
      const fullKey = `${STORAGE_KEYS.OFFLINE_DATA}.${key}`;
      await this.removeItem(fullKey);
    } else {
      // Clear all offline data
      const keys = await this.getAllKeys();
      const offlineKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.OFFLINE_DATA));
      
      for (const offlineKey of offlineKeys) {
        await this.removeItem(offlineKey);
      }
    }
  }

  /**
   * Get storage size (approximate)
   */
  async getStorageSize(): Promise<{ total: number; items: number }> {
    try {
      const keys = await this.getAllKeys();
      const data = await this.getMultiple(keys);
      
      let totalSize = 0;
      Object.values(data).forEach(value => {
        totalSize += JSON.stringify(value).length;
      });
      
      return {
        total: totalSize,
        items: keys.length,
      };
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return { total: 0, items: 0 };
    }
  }

  /**
   * Export all data (for backup)
   */
  async exportData(): Promise<Record<string, any>> {
    try {
      const keys = await this.getAllKeys();
      return this.getMultiple(keys);
    } catch (error) {
      console.error('Failed to export data:', error);
      return {};
    }
  }

  /**
   * Import data (from backup)
   */
  async importData(data: Record<string, any>): Promise<void> {
    try {
      await this.setMultiple(data);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import data');
    }
  }
}

// Create singleton instance
export const storageService = new StorageService();

// Export class for testing or custom instances
export default StorageService;