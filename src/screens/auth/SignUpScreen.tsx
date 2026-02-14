import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      // });
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // On success, navigate to intake quiz
      navigation.navigate('IntakeQuiz');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToSignIn = () => {
    navigation.navigate('SignIn');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={48} color="#8B9D83" />
          </View>
          <Text style={styles.logoText}>Ora AI</Text>
          <Text style={styles.tagline}>Your companion for mindful growth</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Email input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="At least 8 characters"
                placeholderTextColor="#999"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Confirm Password input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Sign Up button */}
          <TouchableOpacity
            style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign In link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleNavigateToSignIn}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8EFE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C3E2E',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E2E',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputError: {
    borderColor: '#D89E5F',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontSize: 13,
    color: '#D89E5F',
    marginTop: 6,
    marginLeft: 4,
  },
  signUpButton: {
    backgroundColor: '#8B9D83',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#8B9D83',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signInText: {
    fontSize: 15,
    color: '#666',
  },
  signInLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B9D83',
  },
});
