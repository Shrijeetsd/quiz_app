import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginResponse, AuthState, RegisterData } from '../../types';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { STORAGE_KEYS } from '../../constants';

// Async thunks
export const loginUser = createAsyncThunk<
  LoginResponse,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await authService.login(email, password);
    
    // Store tokens in secure storage
    if (response.tokens?.access) {
      await storageService.setSecureItem(STORAGE_KEYS.USER_TOKEN, response.tokens.access);
    }
    if (response.user) {
      await storageService.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
  }
});

export const registerUser = createAsyncThunk<
  LoginResponse,
  RegisterData,
  { rejectValue: string }
>('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await authService.register(userData);
    
    // Store tokens in secure storage
    if (response.tokens?.access) {
      await storageService.setSecureItem(STORAGE_KEYS.USER_TOKEN, response.tokens.access);
    }
    if (response.user) {
      await storageService.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Registration failed');
  }
});

export const refreshToken = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>('auth/refreshToken', async (_, { rejectWithValue }) => {
  try {
    const newAccessToken = await authService.refreshToken();
    
    // Update stored token
    await storageService.setSecureItem(STORAGE_KEYS.USER_TOKEN, newAccessToken);
    
    return newAccessToken;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Token refresh failed');
  }
});

export const verifyEmail = createAsyncThunk<
  { message: string },
  { token: string },
  { rejectValue: string }
>('auth/verifyEmail', async ({ token }, { rejectWithValue }) => {
  try {
    const response = await authService.verifyEmail(token);
    return response;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Email verification failed');
  }
});

export const forgotPassword = createAsyncThunk<
  { message: string },
  { email: string },
  { rejectValue: string }
>('auth/forgotPassword', async ({ email }, { rejectWithValue }) => {
  try {
    const response = await authService.forgotPassword(email);
    return response;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Password reset request failed');
  }
});

export const resetPassword = createAsyncThunk<
  { message: string },
  { token: string; password: string },
  { rejectValue: string }
>('auth/resetPassword', async ({ token, password }, { rejectWithValue }) => {
  try {
    const response = await authService.resetPassword(token, password);
    return response;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Password reset failed');
  }
});

export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>('auth/logout', async (_, { rejectWithValue, getState }) => {
  try {
    const state = getState() as { auth: AuthState };
    const refreshTokenValue = state.auth.tokens.refresh;
    
    if (refreshTokenValue) {
      await authService.logout();
    }
    
    // Clear stored data
    await storageService.removeSecureItem(STORAGE_KEYS.USER_TOKEN);
    await storageService.removeItem(STORAGE_KEYS.USER_DATA);
    
  } catch (error) {
    // Even if logout API fails, we should clear local data
    await storageService.removeSecureItem(STORAGE_KEYS.USER_TOKEN);
    await storageService.removeItem(STORAGE_KEYS.USER_DATA);
    
    return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
  }
});

export const loadStoredAuth = createAsyncThunk<
  { user: User; tokens: { access: string; refresh: string; expiresAt: string } } | null,
  void,
  { rejectValue: string }
>('auth/loadStored', async (_, { rejectWithValue }) => {
  try {
    const [token, userData] = await Promise.all([
      storageService.getSecureItem(STORAGE_KEYS.USER_TOKEN),
      storageService.getItem(STORAGE_KEYS.USER_DATA),
    ]);
    
    if (token && userData && typeof userData === 'string') {
      const user = JSON.parse(userData) as User;
      
      // Verify token is still valid
      const isValid = await authService.verifyToken(token);
      
      if (isValid) {
        return {
          user,
          tokens: {
            access: token,
            refresh: '', // Will be updated on next refresh
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        };
      }
    }
    
    return null;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to load stored auth');
  }
});

export const socialLogin = createAsyncThunk<
  LoginResponse,
  { provider: 'google' | 'facebook' | 'apple'; token: string },
  { rejectValue: string }
>('auth/socialLogin', async ({ provider, token }, { rejectWithValue }) => {
  try {
    const response = await authService.socialLogin(provider, token);
    
    // Store tokens in secure storage
    if (response.tokens?.access) {
      await storageService.setSecureItem(STORAGE_KEYS.USER_TOKEN, response.tokens.access);
    }
    if (response.user) {
      await storageService.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    }
    
    return response;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Social login failed');
  }
});

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: {
    access: null,
    refresh: null,
    expiresAt: null,
  },
  isLoading: false,
  error: null,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.tokens = {
        access: null,
        refresh: null,
        expiresAt: null,
      };
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || null;
        if (action.payload.tokens) {
          state.tokens.access = action.payload.tokens.access;
          state.tokens.refresh = action.payload.tokens.refresh;
          state.tokens.expiresAt = null;
        } else {
          state.tokens.access = null;
          state.tokens.refresh = null;
          state.tokens.expiresAt = null;
        }
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || null;
        if (action.payload.tokens) {
          state.tokens.access = action.payload.tokens.access;
          state.tokens.refresh = action.payload.tokens.refresh;
          state.tokens.expiresAt = null;
        } else {
          state.tokens.access = null;
          state.tokens.refresh = null;
          state.tokens.expiresAt = null;
        }
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
      });

    // Refresh token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        if (state.tokens) {
          state.tokens.access = action.payload;
          state.tokens.expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
        }
      })
      .addCase(refreshToken.rejected, (state, action) => {
        // If refresh fails, logout user
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = {
          access: null,
          refresh: null,
          expiresAt: null,
        };
        state.error = action.payload || 'Session expired';
      });

    // Verify email
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        if (state.user) {
          state.user.isVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Email verification failed';
      });

    // Forgot password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Password reset request failed';
      });

    // Reset password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Password reset failed';
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = {
          access: null,
          refresh: null,
          expiresAt: null,
        };
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        // Still logout even if API call fails
        state.isAuthenticated = false;
        state.user = null;
        state.tokens = {
          access: null,
          refresh: null,
          expiresAt: null,
        };
        state.error = action.payload || 'Logout failed';
      });

    // Load stored auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.tokens = action.payload.tokens;
        }
      })
      .addCase(loadStoredAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load stored auth';
      });

    // Social login
    builder
      .addCase(socialLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(socialLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || null;
        if (action.payload.tokens) {
          state.tokens.access = action.payload.tokens.access;
          state.tokens.refresh = action.payload.tokens.refresh;
          state.tokens.expiresAt = null;
        } else {
          state.tokens.access = null;
          state.tokens.refresh = null;
          state.tokens.expiresAt = null;
        }
        state.error = null;
      })
      .addCase(socialLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Social login failed';
      });
  },
});

// Export actions
export const { clearError, clearAuth, updateUser, setLoading } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.tokens.access;

// Export reducer
export default authSlice.reducer;