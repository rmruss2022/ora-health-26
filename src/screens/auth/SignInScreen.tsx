import React, { useState, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBER_ME_KEY = '@ora_remember_me';
const SAVED_EMAIL_KEY = '@ora_saved_email';

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const remembered = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (remembered === 'true') {
        const savedEmail = await AsyncStorage.getItem(SAVED_EMAIL_KEY);
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      }
    } catch (error) {
      console.error('Error loading saved email:', error);
    }
  };

  const saveRememberMe = async (remember: boolean, emailValue: string) => {
    try {
      await AsyncStorage.setItem(REMEMBER_ME_KEY, remember.toString());
      if (remember && emailValue) {
        await AsyncStorage.setItem(SAVED_EMAIL_KEY, emailValue);
      } else {
        await AsyncStorage.removeItem(SAVED_EMAIL_KEY);
      }
    } catch (error) {
      console.error('Error saving remember me:', error);
    }
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: email.trim(), password }),
      // });
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save remember me preference
      await saveRememberMe(rememberMe, email.trim());
      
      // On success, navigate to home
      navigation.navigate('Home');
    } catch (error: any) {
      if (error.status === 401) {
        Alert.alert('Error', 'Invalid email or password');
      } else {
        Alert.alert('Error', 'Failed to sign in. Please try again.');
      }
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    Alert.alert('Forgot Password', 'Password reset functionality coming soon!');
  };

  const handleNavigateToSignUp = () => {
    navigation.navigate('SignUp');
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
          <Text style={styles.logoText}>Welcome back</Text>
          <Text style={styles.tagline}>Sign in to continue your journey</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
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
          </View>

          {/* Remember me & Forgot password */}
          <View style={styles.optionsRow}>
            <View style={styles.rememberMeContainer}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: '#ccc', true: '#B8CDB4' }}
                thumbColor={rememberMe ? '#8B9D83' : '#f4f3f4'}
              />
              <Text style={styles.rememberMeText}>Remember me</Text>
            </View>
            
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleNavigateToSignUp}>
              <Text style={styles.signUpLink}>Create Account</Text>
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
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#8B9D83',
    fontWeight: '600',
  },
  signInButton: {
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
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpText: {
    fontSize: 15,
    color: '#666',
  },
  signUpLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B9D83',
  },
});
