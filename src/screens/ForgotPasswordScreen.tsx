// Forgot Password Screen Component for Commerce Gate App
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
import { TextInput, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { forgotPassword } from '../store/slices/authSlice';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../constants';
import type { RootState, AppDispatch } from '../store';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (): string | null => {
    if (!email.trim()) {
      return 'Email is required';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateEmail();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      await dispatch(forgotPassword({ email })).unwrap();
      setIsSubmitted(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleResend = () => {
    setIsSubmitted(false);
    handleSubmit();
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Icon name="mail-outline" size={64} color={COLORS.PRIMARY} />
            </View>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a password reset link to:
            </Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={styles.instructionItem}>
              <Icon name="looks-one" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.instructionText}>
                Check your email inbox and spam folder
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Icon name="looks-two" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.instructionText}>
                Click the reset password link
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Icon name="looks-3" size={24} color={COLORS.PRIMARY} />
              <Text style={styles.instructionText}>
                Create a new password
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleBackToLogin}
              style={styles.backButton}
              labelStyle={styles.buttonText}
            >
              Back to Login
            </Button>
            
            <TouchableOpacity
              onPress={handleResend}
              style={styles.resendContainer}
            >
              <Text style={styles.resendText}>
                Didn't receive the email?{' '}
                <Text style={styles.resendLink}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            
            <View style={styles.iconContainer}>
              <Icon name="lock-reset" size={64} color={COLORS.PRIMARY} />
            </View>
            
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              label="Email Address"
              mode="outlined"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading || !email.trim()}
              style={styles.submitButton}
              labelStyle={styles.buttonText}
            >
              Send Reset Link
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleBackToLogin}
              style={styles.backToLoginContainer}
            >
              <Icon name="arrow-back" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.backToLoginText}>Back to Login</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.MD,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: SPACING.XS,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: SPACING.LG,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.BOLD,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.BOLD,
    color: COLORS.PRIMARY,
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.XL,
  },
  input: {
    marginBottom: SPACING.LG,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.XS,
  },
  buttonText: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONTS.MEDIUM,
  },
  instructions: {
    marginBottom: SPACING.XL,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  instructionText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_PRIMARY_LIGHT,
    marginLeft: SPACING.MD,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    alignItems: 'center',
  },
  resendContainer: {
    marginTop: SPACING.LG,
    paddingVertical: SPACING.SM,
  },
  resendText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.REGULAR,
    color: COLORS.TEXT_SECONDARY_LIGHT,
    textAlign: 'center',
  },
  resendLink: {
    color: COLORS.PRIMARY,
    fontFamily: FONTS.MEDIUM,
  },
  footer: {
    alignItems: 'center',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  backToLoginText: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONTS.MEDIUM,
    color: COLORS.PRIMARY,
    marginLeft: SPACING.XS,
  },
});

export default ForgotPasswordScreen;