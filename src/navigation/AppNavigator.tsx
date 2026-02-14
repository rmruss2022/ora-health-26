import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChatScreen } from '../screens/ChatScreen';
import { MeditationScreen } from '../screens/MeditationScreen';
import { MeditationTimerScreen } from '../screens/MeditationTimerScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { CommentsScreen } from '../screens/CommentsScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { LetterDetailScreen } from '../screens/LetterDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();
const CommunityStack = createStackNavigator();
const MeditationStack = createStackNavigator();
const AuthStack = createStackNavigator();

function CommunityStackNavigator() {
  return (
    <CommunityStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <CommunityStack.Screen name="CommunityHome" component={CommunityScreen} />
      <CommunityStack.Screen name="Comments" component={CommentsScreen} />
      <CommunityStack.Screen name="CreatePost" component={CreatePostScreen} />
      <CommunityStack.Screen name="LetterDetail" component={LetterDetailScreen} />
    </CommunityStack.Navigator>
  );
}

function MeditationStackNavigator() {
  return (
    <MeditationStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <MeditationStack.Screen name="MeditationLibrary" component={MeditationScreen} />
      <MeditationStack.Screen name="MeditationTimer" component={MeditationTimerScreen} />
    </MeditationStack.Navigator>
  );
}

/**
 * Main app tabs for authenticated users
 */
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mediumGrey,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>💬</Text>,
        }}
      />
      <Tab.Screen
        name="Meditation"
        component={MeditationStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🧘</Text>,
          tabBarLabel: 'Calm',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🤝</Text>,
          tabBarLabel: 'Connect',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Auth flow for unauthenticated users
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Loading screen shown during auth initialization
 */
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

/**
 * Root navigator - switches between auth and main app based on auth state
 */
export function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isLoading ? <LoadingScreen /> : isAuthenticated ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.charcoal,
  },
});
