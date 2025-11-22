// Network Service for Commerce Gate App
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { NETWORK_CONFIG } from '../constants';

export interface NetworkStatus {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
  details: any;
}

export interface NetworkListener {
  unsubscribe: () => void;
}

class NetworkService {
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus | null = null;
  private unsubscribe: (() => void) | null = null;

  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    try {
      // Configure NetInfo
      NetInfo.configure({
        reachabilityUrl: NETWORK_CONFIG.REACHABILITY_URL,
        reachabilityTest: async (response: Response) => Promise.resolve(response.status === 200),
        reachabilityLongTimeout: NETWORK_CONFIG.REACHABILITY_LONG_TIMEOUT,
        reachabilityShortTimeout: NETWORK_CONFIG.REACHABILITY_SHORT_TIMEOUT,
        reachabilityRequestTimeout: NETWORK_CONFIG.REACHABILITY_REQUEST_TIMEOUT,
        reachabilityShouldRun: () => true,
        shouldFetchWiFiSSID: true,
        useNativeReachability: false,
      });

      // Get initial network state
      const initialState = await NetInfo.fetch();
      this.currentStatus = this.parseNetworkState(initialState);

      // Subscribe to network state changes
      this.unsubscribe = NetInfo.addEventListener((state) => {
        const status = this.parseNetworkState(state);
        this.currentStatus = status;
        this.notifyListeners(status);
      });

    } catch (error) {
      console.error('Network service initialization error:', error);
    }
  }

  /**
   * Get current network status
   */
  async getCurrentStatus(): Promise<NetworkStatus> {
    try {
      if (this.currentStatus) {
        return this.currentStatus;
      }

      const state = await NetInfo.fetch();
      return this.parseNetworkState(state);
    } catch (error) {
      console.error('Get network status error:', error);
      return {
        isConnected: false,
        type: null,
        isInternetReachable: false,
        details: null,
      };
    }
  }

  /**
   * Check if device is connected to internet
   */
  async isConnected(): Promise<boolean> {
    try {
      const status = await this.getCurrentStatus();
      return status.isConnected && status.isInternetReachable !== false;
    } catch {
      return false;
    }
  }

  /**
   * Check if device has wifi connection
   */
  async isWifiConnected(): Promise<boolean> {
    try {
      const status = await this.getCurrentStatus();
      return status.isConnected && status.type === 'wifi';
    } catch {
      return false;
    }
  }

  /**
   * Check if device is on cellular connection
   */
  async isCellularConnected(): Promise<boolean> {
    try {
      const status = await this.getCurrentStatus();
      return status.isConnected && status.type === 'cellular';
    } catch {
      return false;
    }
  }

  /**
   * Get connection type
   */
  async getConnectionType(): Promise<string | null> {
    try {
      const status = await this.getCurrentStatus();
      return status.type;
    } catch {
      return null;
    }
  }

  /**
   * Get WiFi SSID (if available and connected to WiFi)
   */
  async getWifiSSID(): Promise<string | null> {
    try {
      const status = await this.getCurrentStatus();
      
      if (status.type === 'wifi' && status.details && status.details.ssid) {
        return status.details.ssid;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get signal strength (if available)
   */
  async getSignalStrength(): Promise<number | null> {
    try {
      const status = await this.getCurrentStatus();
      
      if (status.details && typeof status.details.strength === 'number') {
        return status.details.strength;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Add network status listener
   */
  addNetworkListener(callback: (status: NetworkStatus) => void): NetworkListener {
    this.listeners.push(callback);

    // Call immediately with current status
    if (this.currentStatus) {
      callback(this.currentStatus);
    }

    return {
      unsubscribe: () => {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
          this.listeners.splice(index, 1);
        }
      },
    };
  }

  /**
   * Remove network status listener
   */
  removeNetworkListener(callback: (status: NetworkStatus) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners = [];
  }

  /**
   * Test internet connectivity
   */
  async testInternetConnectivity(): Promise<boolean> {
    try {
      // Force a fresh network check
      const state = await NetInfo.fetch(NETWORK_CONFIG.REACHABILITY_URL);
      return state.isConnected === true && state.isInternetReachable === true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for internet connection
   */
  async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConnection = async () => {
        const isConnected = await this.isConnected();
        
        if (isConnected) {
          resolve(true);
          return;
        }
        
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeoutMs) {
          resolve(false);
          return;
        }
        
        setTimeout(checkConnection, 1000);
      };
      
      checkConnection();
    });
  }

  /**
   * Get network performance info
   */
  async getNetworkPerformanceInfo(): Promise<{
    type: string | null;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }> {
    try {
      const status = await this.getCurrentStatus();
      
      const info: any = {
        type: status.type,
      };

      // Add performance metrics if available
      if (status.details) {
        if ('effectiveType' in status.details) {
          info.effectiveType = status.details.effectiveType;
        }
        if ('downlink' in status.details) {
          info.downlink = status.details.downlink;
        }
        if ('rtt' in status.details) {
          info.rtt = status.details.rtt;
        }
      }

      return info;
    } catch (error) {
      console.error('Get network performance info error:', error);
      return { type: null };
    }
  }

  /**
   * Check if connection is metered (cellular or limited WiFi)
   */
  async isConnectionMetered(): Promise<boolean> {
    try {
      const status = await this.getCurrentStatus();
      
      // Cellular connections are always considered metered
      if (status.type === 'cellular') {
        return true;
      }
      
      // Check if WiFi connection is metered (if this info is available)
      if (status.details && 'isConnectionExpensive' in status.details) {
        return Boolean(status.details.isConnectionExpensive);
      }
      
      return false;
    } catch {
      return true; // Default to true for safety
    }
  }

  /**
   * Get connection quality indicator
   */
  async getConnectionQuality(): Promise<'excellent' | 'good' | 'fair' | 'poor' | 'unknown'> {
    try {
      const status = await this.getCurrentStatus();
      
      if (!status.isConnected || status.isInternetReachable === false) {
        return 'poor';
      }
      
      const signalStrength = await this.getSignalStrength();
      
      if (signalStrength !== null) {
        if (signalStrength > 75) return 'excellent';
        if (signalStrength > 50) return 'good';
        if (signalStrength > 25) return 'fair';
        return 'poor';
      }
      
      // Fallback based on connection type
      switch (status.type) {
        case 'wifi':
          return 'good';
        case 'cellular':
          return 'fair';
        default:
          return 'unknown';
      }
    } catch {
      return 'unknown';
    }
  }

  /**
   * Parse NetInfo state to our NetworkStatus format
   */
  private parseNetworkState(state: NetInfoState): NetworkStatus {
    return {
      isConnected: state.isConnected ?? false,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
      details: state.details,
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.removeAllListeners();
    this.currentStatus = null;
  }

  /**
   * Get network stats for debugging
   */
  async getNetworkStats(): Promise<{
    currentStatus: NetworkStatus | null;
    listenerCount: number;
    isMonitoring: boolean;
  }> {
    return {
      currentStatus: this.currentStatus,
      listenerCount: this.listeners.length,
      isMonitoring: this.unsubscribe !== null,
    };
  }
}

// Create singleton instance
export const networkService = new NetworkService();

// Export class for testing or custom instances
export default NetworkService;