// Login Screen Component for Commerce Gate App
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { TextInput, Button, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginUser } from '../store/slices/authSlice';
import { biometricService } from '../services/biometricService';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';
import type { RootState, AppDispatch } from '../store';
import type { LoginCredentials } from '../types';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [_biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const { isAvailable } = await biometricService.isBiometricAvailable();
      const isEnabled = await biometricService.isBiometricEnabled();
      
      setBiometricAvailable(isAvailable);
      setBiometricEnabled(isEnabled && isAvailable);
    } catch (biometricError) {
      console.error('Error checking biometric availability:', biometricError);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      return 'Password is required';
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    
    return null;
  };

  const handleLogin = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      await dispatch(loginUser(formData)).unwrap();
      // Navigation will be handled by AppNavigator based on auth state
    } catch (loginError) {
      const errorMessage = loginError instanceof Error ? loginError.message : 'Login failed';
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const credentials = await biometricService.authenticateWithBiometric();
      
      if (credentials) {
        const loginData: LoginCredentials = {
          email: credentials.username,
          password: credentials.password,
          rememberMe: true,
        };
        
        await dispatch(loginUser(loginData)).unwrap();
      }
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : 'Biometric authentication failed';
      Alert.alert('Authentication Failed', errorMessage);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    // TODO: Implement social login
    Alert.alert('Coming Soon', `${provider} login will be available soon!`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Email"
              mode="outlined"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              error={error?.includes('email')}
            />

            <TextInput
              label="Password"
              mode="outlined"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry={!showPassword}
              autoComplete="password"
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              error={error?.includes('password')}
            />

            {/* Remember Me & Forgot Password */}
            <View style={styles.options}>
              <TouchableOpacity
                style={styles.rememberMe}
                onPress={() => handleInputChange('rememberMe', !formData.rememberMe)}
              >
                <Icon
                  name={formData.rememberMe ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              labelStyle={styles.loginButtonText}
            >
              Sign In
            </Button>

            {/* Biometric Login */}
            {biometricEnabled && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
              >
                <Icon name="fingerprint" size={24} color={COLORS.PRIMARY} />
                <Text style={styles.biometricText}>Use Biometric Login</Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <Divider style={styles.divider} />
            </View>

            {/* Social Login */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialLogin('google')}
              >
                <Icon name="account-circle" size={20} color={COLORS.WHITE} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialLogin('facebook')}
              >
                <Icon name="facebook" size={20} color={COLORS.WHITE} />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.MD,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.XL,
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    marginBottom: SPACING.LG,
  },
  input: {
    marginBottom: SPACING.MD,
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginLeft: SPACING.XS,
  },
  forgotPassword: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
  },
  loginButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.XS,
    marginBottom: SPACING.MD,
  },
  loginButtonText: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.MEDIUM,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  biometricText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
    marginLeft: SPACING.XS,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.LG,
  },
  divider: {
    flex: 1,
    backgroundColor: COLORS.BORDER_LIGHT,
  },
  dividerText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    marginHorizontal: SPACING.MD,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    marginHorizontal: SPACING.XS,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  socialButtonText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.WHITE,
    marginLeft: SPACING.XS,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.LG,
  },
  footerText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
  },
  signUpText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
});

export default LoginScreen;