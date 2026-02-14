import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../../theme';
import { FormInput } from '../../components/auth/FormInput';
import { PrimaryButton } from '../../components/auth/PrimaryButton';
import { AuthLink } from '../../components/auth/AuthLink';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendResetLink = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // await authAPI.sendPasswordReset({ email });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsSuccess(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to send reset link. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLink = async () => {
    setIsSuccess(false);
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert('Success', 'Reset link has been resent to your email.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to resend link. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigation.goBack();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (isSuccess) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✅</Text>
          </View>

          {/* Header */}
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          {/* Action Button */}
          <View style={styles.formContainer}>
            <PrimaryButton
              title="Return to Sign In"
              onPress={handleBackToSignIn}
              isLoading={isLoading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Didn't receive the email? </Text>
              <AuthLink text="Resend Link" onPress={handleResendLink} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email to receive{'\n'}a password reset link
        </Text>

        {/* Form */}
        <View style={styles.formContainer}>
          <FormInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            error={error}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSendResetLink}
            editable={!isLoading}
            autoFocus
          />

          <PrimaryButton
            title="Send Reset Link"
            onPress={handleSendResetLink}
            isLoading={isLoading}
          />

          <View style={styles.footer}>
            <AuthLink text="Back to Sign In" onPress={handleBackToSignIn} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxxxl,
    paddingBottom: theme.spacing.xxxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xs,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  successIcon: {
    fontSize: 80,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  successMessage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxxl,
    lineHeight: 24,
  },
  emailText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
});
