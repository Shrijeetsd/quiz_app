// Register Screen Component for Commerce Gate App
import React, { useState } from 'react';
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

import { registerUser } from '../store/slices/authSlice';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';
import type { RootState, AppDispatch } from '../store';
import type { RegisterData } from '../types';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  
  const [formData, setFormData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    phone: '',
    agreeToTerms: false,
    subscribeToNewsletter: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: keyof RegisterData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) {
      return 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      return 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      return 'Password is required';
    }
    
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      return 'Please enter a valid phone number';
    }
    
    if (!formData.agreeToTerms) {
      return 'You must agree to the terms and conditions';
    }
    
    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      // Create username from email if not provided
      const username = formData.username || formData.email.split('@')[0];
      
      const registerPayload: RegisterData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        username,
        phone: formData.phone,
        agreeToTerms: formData.agreeToTerms,
        subscribeToNewsletter: formData.subscribeToNewsletter,
      };
      
      await dispatch(registerUser(registerPayload)).unwrap();
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully. Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Registration Failed', errorMessage);
    }
  };

  const handleSocialRegister = (provider: 'google' | 'facebook' | 'apple') => {
    // TODO: Implement social registration
    Alert.alert('Coming Soon', `${provider} registration will be available soon!`);
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY_LIGHT} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start your learning journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.nameRow}>
              <TextInput
                label="First Name"
                mode="outlined"
                value={formData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                autoCapitalize="words"
                style={[styles.input, styles.nameInput]}
                left={<TextInput.Icon icon="account" />}
              />
              
              <TextInput
                label="Last Name"
                mode="outlined"
                value={formData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                autoCapitalize="words"
                style={[styles.input, styles.nameInput]}
              />
            </View>

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
            />

            <TextInput
              label="Username (Optional)"
              mode="outlined"
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="account-circle" />}
            />
            <Text style={styles.helperText}>Leave blank to use email prefix as username</Text>

            <TextInput
              label="Phone (Optional)"
              mode="outlined"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
              autoComplete="tel"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              label="Password"
              mode="outlined"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label="Confirm Password"
              mode="outlined"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            {/* Password Requirements */}
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              <Text style={styles.requirement}>• At least 8 characters</Text>
              <Text style={styles.requirement}>• One uppercase letter</Text>
              <Text style={styles.requirement}>• One lowercase letter</Text>
              <Text style={styles.requirement}>• One number</Text>
            </View>

            {/* Terms and Newsletter */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleInputChange('agreeToTerms', !formData.agreeToTerms)}
              >
                <Icon
                  name={formData.agreeToTerms ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.checkboxText}>
                  I agree to the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleInputChange('subscribeToNewsletter', !formData.subscribeToNewsletter)}
              >
                <Icon
                  name={formData.subscribeToNewsletter ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={COLORS.PRIMARY}
                />
                <Text style={styles.checkboxText}>
                  Subscribe to newsletter for updates and tips
                </Text>
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
              labelStyle={styles.registerButtonText}
            >
              Create Account
            </Button>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <Divider style={styles.divider} />
            </View>

            {/* Social Registration */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialRegister('google')}
              >
                <Icon name="account-circle" size={20} color={COLORS.WHITE} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => handleSocialRegister('facebook')}
              >
                <Icon name="facebook" size={20} color={COLORS.WHITE} />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.signInText}>Sign In</Text>
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
    marginTop: SPACING.MD,
    marginBottom: SPACING.LG,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: SPACING.XS,
  },
  title: {
    fontSize: 28,
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nameInput: {
    flex: 1,
    marginRight: SPACING.XS,
  },
  input: {
    marginBottom: SPACING.MD,
  },
  passwordRequirements: {
    backgroundColor: COLORS.SURFACE_LIGHT,
    padding: SPACING.SM,
    borderRadius: 8,
    marginBottom: SPACING.MD,
  },
  requirementsTitle: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginBottom: SPACING.XS,
  },
  requirement: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    marginBottom: 2,
  },
  checkboxContainer: {
    marginBottom: SPACING.LG,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  checkboxText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginLeft: SPACING.XS,
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  registerButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.XS,
    marginBottom: SPACING.MD,
  },
  registerButtonText: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.MEDIUM,
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
  signInText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.BOLD,
    color: COLORS.PRIMARY,
  },
  helperText: {
    fontSize: FONT_SIZES.XS,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    marginTop: -SPACING.SM,
    marginBottom: SPACING.MD,
    marginLeft: SPACING.SM,
  },
});

export default RegisterScreen;