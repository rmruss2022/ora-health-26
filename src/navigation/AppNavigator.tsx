import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChatScreen } from '../screens/ChatScreen';
import { MeditationScreen } from '../screens/MeditationScreen';
import { MeditationTimerScreen } from '../screens/MeditationTimerScreen';
import { CollectiveSessionScreen } from '../screens/CollectiveSessionScreen';
import { DailyReflectionScreen } from '../screens/DailyReflectionScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { CommentsScreen } from '../screens/CommentsScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { LetterDetailScreen } from '../screens/LetterDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
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
      <MeditationStack.Screen name="CollectiveSession" component={CollectiveSessionScreen} />
      <MeditationStack.Screen name="DailyReflection" component={DailyReflectionScreen} />
    </MeditationStack.Navigator>
  );
}

/**
 * Main app tabs for authenticated users
 */
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F8F7F3',
          borderTopColor: '#DDD8CB',
          height: 76,
          paddingBottom: 12,
          paddingTop: 10,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#526253',
        tabBarInactiveTintColor: '#A8A59A',
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: theme.typography.labelSmall.fontFamily,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⌂</Text>,
        }}
      />
      <Tab.Screen
        name="Meditate"
        component={MeditationStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◠</Text>,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✤</Text>,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◉</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◍</Text>,
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
