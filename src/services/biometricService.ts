// Biometric Authentication Service for Commerce Gate App
import * as Keychain from 'react-native-keychain';
import { storageService } from './storageService';

export interface BiometricType {
  isAvailable: boolean;
  biometryType?: 'TouchID' | 'FaceID' | 'Fingerprint' | 'Face' | 'Iris' | null;
  error?: string;
}

export interface BiometricCredentials {
  username: string;
  password: string;
}

class BiometricService {
  private serviceKey = 'CommerceGateApp_Biometric';

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<BiometricType> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      
      return {
        isAvailable: biometryType !== null,
        biometryType: biometryType as any,
      };
    } catch (error) {
      return {
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if biometric is enabled for the app
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      return await storageService.getBiometricEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometric(credentials: BiometricCredentials): Promise<boolean> {
    try {
      // Check if biometric is available
      const { isAvailable } = await this.isBiometricAvailable();
      
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available');
      }

      // Store credentials securely with biometric protection
      await Keychain.setInternetCredentials(
        this.serviceKey,
        credentials.username,
        credentials.password,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
          accessGroup: 'group.commercegateapp',
        }
      );

      // Mark biometric as enabled
      await storageService.storeBiometricEnabled(true);
      
      return true;
    } catch (error) {
      console.error('Enable biometric error:', error);
      throw error;
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    try {
      // Remove stored credentials
      await Keychain.resetInternetCredentials({ service: this.serviceKey });
      
      // Mark biometric as disabled
      await storageService.storeBiometricEnabled(false);
    } catch (error) {
      console.error('Disable biometric error:', error);
      throw error;
    }
  }

  /**
   * Authenticate with biometric
   */
  async authenticateWithBiometric(): Promise<BiometricCredentials | null> {
    try {
      // Check if biometric is enabled
      const isEnabled = await this.isBiometricEnabled();
      
      if (!isEnabled) {
        throw new Error('Biometric authentication is not enabled');
      }

      // Retrieve credentials with biometric authentication
      const credentials = await Keychain.getInternetCredentials(this.serviceKey);

      if (credentials && typeof credentials === 'object' && 'username' in credentials) {
        return {
          username: (credentials as any).username,
          password: (credentials as any).password,
        };
      }

      return null;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      
      if (error instanceof Error) {
        // Handle specific biometric errors
        if (error.message.includes('UserCancel')) {
          throw new Error('Authentication was cancelled');
        } else if (error.message.includes('UserFallback')) {
          throw new Error('User chose to use passcode');
        } else if (error.message.includes('BiometryNotAvailable')) {
          throw new Error('Biometric authentication is not available');
        } else if (error.message.includes('BiometryNotEnrolled')) {
          throw new Error('No biometric data is enrolled');
        } else if (error.message.includes('BiometryLockout')) {
          throw new Error('Biometric authentication is locked out');
        }
      }
      
      throw error;
    }
  }

  /**
   * Check if stored biometric credentials exist
   */
  async hasStoredCredentials(): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.serviceKey);
      return credentials !== false;
    } catch {
      return false;
    }
  }

  /**
   * Update stored biometric credentials
   */
  async updateBiometricCredentials(credentials: BiometricCredentials): Promise<void> {
    try {
      const isEnabled = await this.isBiometricEnabled();
      
      if (!isEnabled) {
        throw new Error('Biometric authentication is not enabled');
      }

      // Update credentials
      await Keychain.setInternetCredentials(
        this.serviceKey,
        credentials.username,
        credentials.password,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
          accessGroup: 'group.commercegateapp',
        }
      );
    } catch (error) {
      console.error('Update biometric credentials error:', error);
      throw error;
    }
  }

  /**
   * Get biometric type display name
   */
  getBiometricTypeName(biometryType: string | null): string {
    switch (biometryType) {
      case 'TouchID':
        return 'Touch ID';
      case 'FaceID':
        return 'Face ID';
      case 'Fingerprint':
        return 'Fingerprint';
      case 'Face':
        return 'Face Recognition';
      case 'Iris':
        return 'Iris Recognition';
      default:
        return 'Biometric Authentication';
    }
  }

  /**
   * Prompt for biometric setup
   */
  async promptBiometricSetup(): Promise<{
    shouldSetup: boolean;
    biometryType: string | null;
  }> {
    try {
      const { isAvailable, biometryType } = await this.isBiometricAvailable();
      
      if (!isAvailable) {
        return {
          shouldSetup: false,
          biometryType: null,
        };
      }

      // Check if already enabled
      const isEnabled = await this.isBiometricEnabled();
      
      return {
        shouldSetup: !isEnabled,
        biometryType: biometryType || null,
      };
    } catch {
      return {
        shouldSetup: false,
        biometryType: null,
      };
    }
  }

  /**
   * Clear all biometric data (for security purposes)
   */
  async clearBiometricData(): Promise<void> {
    try {
      await Promise.all([
        this.disableBiometric(),
        Keychain.resetInternetCredentials({ service: this.serviceKey }),
      ]);
    } catch (error) {
      console.error('Clear biometric data error:', error);
      // Don't throw error - this is for cleanup
    }
  }

  /**
   * Test biometric authentication without retrieving credentials
   */
  async testBiometricAuthentication(): Promise<boolean> {
    try {
      const { isAvailable } = await this.isBiometricAvailable();
      
      if (!isAvailable) {
        return false;
      }

      // Create a temporary credential for testing
      const testKey = `${this.serviceKey}_test`;
      
      // Store test credential
      await Keychain.setInternetCredentials(
        testKey,
        'test',
        'test',
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        }
      );

      // Try to retrieve it (this will prompt for biometric)
      const result = await Keychain.getInternetCredentials(testKey);

      // Clean up test credential
      await Keychain.resetInternetCredentials({ service: testKey });

      return result !== false;
    } catch (error) {
      console.error('Test biometric authentication error:', error);
      return false;
    }
  }

  /**
   * Get biometric settings for display
   */
  async getBiometricSettings(): Promise<{
    isAvailable: boolean;
    isEnabled: boolean;
    biometryType: string | null;
    hasStoredCredentials: boolean;
    displayName: string;
  }> {
    try {
      const [
        { isAvailable, biometryType },
        isEnabled,
        hasStoredCredentials,
      ] = await Promise.all([
        this.isBiometricAvailable(),
        this.isBiometricEnabled(),
        this.hasStoredCredentials(),
      ]);

      return {
        isAvailable,
        isEnabled,
        biometryType: biometryType || null,
        hasStoredCredentials,
        displayName: this.getBiometricTypeName(biometryType || null),
      };
    } catch (error) {
      console.error('Get biometric settings error:', error);
      return {
        isAvailable: false,
        isEnabled: false,
        biometryType: null,
        hasStoredCredentials: false,
        displayName: 'Biometric Authentication',
      };
    }
  }
}

// Create singleton instance
export const biometricService = new BiometricService();

// Export class for testing or custom instances
export default BiometricService;