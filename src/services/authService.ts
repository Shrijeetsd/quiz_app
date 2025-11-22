// Authentication Service for Commerce Gate App
import { apiService } from './apiService';
import { storageService } from './storageService';
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  LoginResponse, 
  ApiResponse 
} from '../types';

class AuthService {
  private tokenRefreshPromise: Promise<string> | null = null;

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const credentials: LoginCredentials = { email, password };
      const response = await apiService.post<LoginResponse>('/auth/login', credentials, false);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store tokens and user data
        await this.storeAuthData(user, accessToken, refreshToken);
        
        // Return with expected structure for backward compatibility
        return {
          ...response,
          user,
          tokens: {
            access: accessToken,
            refresh: refreshToken,
          },
        };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>('/auth/register', userData, false);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store tokens and user data
        await this.storeAuthData(user, accessToken, refreshToken);
        
        // Return with expected structure for backward compatibility
        return {
          ...response,
          user,
          tokens: {
            access: accessToken,
            refresh: refreshToken,
          },
        };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Get current tokens
      const { accessToken } = await storageService.getAuthTokens();
      
      // Call logout endpoint if we have a token
      if (accessToken) {
        try {
          await apiService.post('/auth/logout', {}, true);
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with local cleanup even if API call fails
        }
      }
      
      // Clear local storage
      await this.clearAuthData();
      
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear local data, even if there's an error
      await this.clearAuthData();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh();
    
    try {
      const newAccessToken = await this.tokenRefreshPromise;
      return newAccessToken;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<string> {
    try {
      const { refreshToken } = await storageService.getAuthTokens();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/auth/refresh', { refreshToken }, false);

      if (response && typeof response === 'object' && 'accessToken' in response) {
        const { accessToken, refreshToken: newRefreshToken, user } = response;
        
        // Update stored tokens and user data
        await this.storeAuthData(user, accessToken, newRefreshToken);
        
        return accessToken;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // If refresh fails, clear auth data and redirect to login
      await this.clearAuthData();
      throw error;
    }
  }

  /**
   * Verify token validity
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await apiService.post<{ valid: boolean }>('/auth/verify', { token }, false);
      return response && response.valid === true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      return await apiService.post<ApiResponse>('/auth/verify-email', { token }, false);
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      return await apiService.post<ApiResponse>('/auth/forgot-password', { email }, false);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    try {
      return await apiService.post<ApiResponse>('/auth/reset-password', { 
        token, 
        password 
      }, false);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      return await apiService.post<ApiResponse>('/auth/change-password', {
        currentPassword,
        newPassword,
      }, true);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Social login (Google, Facebook, Apple)
   */
  async socialLogin(provider: 'google' | 'facebook' | 'apple', token: string): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>('/auth/social-login', {
        provider,
        token,
      }, false);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        
        // Store tokens and user data
        await this.storeAuthData(user, accessToken, refreshToken);
        
        return response;
      } else {
        throw new Error(response.message || 'Social login failed');
      }
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const { accessToken } = await storageService.getAuthTokens();
      
      if (!accessToken) {
        return null;
      }

      // Check if token is expired (basic check - server will validate)
      const tokenData = this.parseJWT(accessToken);
      if (tokenData && tokenData.exp && Date.now() >= tokenData.exp * 1000) {
        // Token is expired, try to refresh
        try {
          return await this.refreshToken();
        } catch {
          // Refresh failed, return null
          return null;
        }
      }

      return accessToken;
    } catch (error) {
      console.error('Get access token error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      return !!token;
    } catch {
      return false;
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      return await storageService.getUserData();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await apiService.put<ApiResponse<User>>('/auth/profile', updates, true);
      
      if (response.success && response.data) {
        // Update stored user data
        await storageService.storeUserData(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(_password: string): Promise<ApiResponse> {
    try {
      const response = await apiService.delete<ApiResponse>('/auth/account', true);
      
      if (response.success) {
        // Clear all local data
        await this.clearAuthData();
      }
      
      return response;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(): Promise<ApiResponse> {
    try {
      return await apiService.post<ApiResponse>('/auth/resend-verification', {}, true);
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }

  /**
   * Check email availability
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    try {
      return await apiService.post<{ available: boolean }>('/auth/check-email', { email }, false);
    } catch (error) {
      console.error('Check email availability error:', error);
      throw error;
    }
  }

  /**
   * Check username availability
   */
  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    try {
      return await apiService.post<{ available: boolean }>('/auth/check-username', { username }, false);
    } catch (error) {
      console.error('Check username availability error:', error);
      throw error;
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(): Promise<Array<{
    id: string;
    deviceInfo: string;
    ipAddress: string;
    lastActive: string;
    current: boolean;
  }>> {
    try {
      const response = await apiService.get<ApiResponse<Array<any>>>('/auth/sessions', true);
      return response.data || [];
    } catch (error) {
      console.error('Get user sessions error:', error);
      throw error;
    }
  }

  /**
   * Revoke user session
   */
  async revokeSession(sessionId: string): Promise<ApiResponse> {
    try {
      return await apiService.delete<ApiResponse>(`/auth/sessions/${sessionId}`, true);
    } catch (error) {
      console.error('Revoke session error:', error);
      throw error;
    }
  }

  /**
   * Revoke all other sessions
   */
  async revokeAllOtherSessions(): Promise<ApiResponse> {
    try {
      return await apiService.delete<ApiResponse>('/auth/sessions/others', true);
    } catch (error) {
      console.error('Revoke all sessions error:', error);
      throw error;
    }
  }

  /**
   * Load stored authentication data on app start
   */
  async loadStoredAuth(): Promise<User | null> {
    try {
      const [user, { accessToken }] = await Promise.all([
        storageService.getUserData(),
        storageService.getAuthTokens(),
      ]);

      if (user && accessToken) {
        // Verify token is still valid
        const isValid = await this.verifyTokenValidity();
        
        if (isValid) {
          return user;
        } else {
          // Token is invalid, clear auth data
          await this.clearAuthData();
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Load stored auth error:', error);
      return null;
    }
  }

  /**
   * Verify token validity with server
   */
  private async verifyTokenValidity(): Promise<boolean> {
    try {
      await apiService.get('/auth/verify', true);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(user: User, accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      storageService.storeAuthTokens(accessToken, refreshToken),
      storageService.storeUserData(user),
    ]);
  }

  /**
   * Clear all authentication data
   */
  private async clearAuthData(): Promise<void> {
    await Promise.all([
      storageService.clearAuthTokens(),
      storageService.clearUserData(),
    ]);
  }

  /**
   * Parse JWT token (basic parsing - don't rely on this for security)
   */
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // For React Native, we'll use a simple approach
      // This is a basic implementation and shouldn't be used for security-critical operations
      const jsonPayload = JSON.parse(
        decodeURIComponent(
          escape(
            // Simple base64 decode approximation
            base64.split('').map((char, index) => {
              const code = char.charCodeAt(0);
              return String.fromCharCode(code + (index % 2 === 0 ? -32 : 32));
            }).join('')
          )
        )
      );
      
      return jsonPayload;
    } catch {
      // If parsing fails, return a minimal payload
      return { exp: Math.floor(Date.now() / 1000) + 3600 }; // Default 1 hour expiry
    }
  }

  /**
   * Get token expiration time
   */
  async getTokenExpiration(): Promise<Date | null> {
    try {
      const { accessToken } = await storageService.getAuthTokens();
      
      if (!accessToken) {
        return null;
      }

      const tokenData = this.parseJWT(accessToken);
      if (tokenData && tokenData.exp) {
        return new Date(tokenData.exp * 1000);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  async isTokenExpiringSoon(): Promise<boolean> {
    try {
      const expiration = await this.getTokenExpiration();
      
      if (!expiration) {
        return true; // No token means it's "expired"
      }

      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      return expiration <= fiveMinutesFromNow;
    } catch {
      return true;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export class for testing or custom instances
export default AuthService;