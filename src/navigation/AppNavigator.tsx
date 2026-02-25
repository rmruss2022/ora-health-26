import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChatScreen } from '../screens/ChatScreen';
import { MeditationTimerScreen } from '../screens/MeditationTimerScreen';
import { RoomScreen } from '../screens/RoomScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { CommentsScreen } from '../screens/CommentsScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { LetterDetailScreen } from '../screens/LetterDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ExerciseLibraryScreen } from '../screens/ExerciseLibraryScreen';
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen';
import { GuidedExerciseScreen } from '../screens/GuidedExerciseScreen';
import { ExerciseCompleteScreen } from '../screens/ExerciseCompleteScreen';
import { WeeklyPlanningScreen } from '../screens/WeeklyPlanningScreen';
import { WeeklyPlanningCompleteScreen } from '../screens/WeeklyPlanningCompleteScreen';
import { WeeklyReviewScreen } from '../screens/WeeklyReviewScreen';
import { WeeklyReviewCompleteScreen } from '../screens/WeeklyReviewCompleteScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const CommunityStack = createStackNavigator();
const AuthStack = createStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Room" component={RoomScreen} />
      <HomeStack.Screen name="MeditationTimer" component={MeditationTimerScreen} />
      <HomeStack.Screen name="Profile" component={ProfileScreen} />
      <HomeStack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
      <HomeStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <HomeStack.Screen name="GuidedExercise" component={GuidedExerciseScreen} />
      <HomeStack.Screen name="ExerciseComplete" component={ExerciseCompleteScreen} />
      <HomeStack.Screen name="WeeklyPlanning" component={WeeklyPlanningScreen} />
      <HomeStack.Screen name="WeeklyPlanningComplete" component={WeeklyPlanningCompleteScreen} />
      <HomeStack.Screen name="WeeklyReview" component={WeeklyReviewScreen} />
      <HomeStack.Screen name="WeeklyReviewComplete" component={WeeklyReviewCompleteScreen} />
    </HomeStack.Navigator>
  );
}

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
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✤</Text>,
        }}
      />
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◈</Text>,
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStackNavigator}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◉</Text>,
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
