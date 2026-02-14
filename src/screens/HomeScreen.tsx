import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HeaderGradient } from '../components/home/HeaderGradient';
import { BehaviorCard } from '../components/home/BehaviorCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { getHeaderA11yProps, getLoadingA11yProps } from '../utils/accessibility';

const CONVERSATION_MODES = [
  {
    id: 'free-form-chat',
    iconType: 'chat' as const,
    iconBg: '#4A90E2',
    title: 'Free-Form Chat',
    subtitle: 'Open conversation and emotional support',
    route: 'Chat',
    params: { conversationMode: 'free-form' },
  },
  {
    id: 'journal-prompts',
    iconType: 'journal' as const,
    iconBg: '#F39C12',
    title: 'Journal Prompts',
    subtitle: 'Guided journaling with thoughtful questions',
    route: 'Chat',
    params: { conversationMode: 'journal' },
  },
  {
    id: 'guided-exercise',
    iconType: 'exercise' as const,
    iconBg: '#6B7A5D',
    title: 'Guided Exercise',
    subtitle: 'Structured personal growth activities',
    route: 'Chat',
    params: { conversationMode: 'exercise' },
  },
  {
    id: 'progress-analysis',
    iconType: 'progress' as const,
    iconBg: '#E74C3C',
    title: 'Progress Analysis',
    subtitle: 'Insights on your personal growth journey',
    route: 'Chat',
    params: { conversationMode: 'analysis' },
  },
  {
    id: 'weekly-planning',
    iconType: 'planning' as const,
    iconBg: '#9B59B6',
    title: 'Weekly Planning',
    subtitle: 'Set intentions and plan your week',
    route: 'Chat',
    params: { conversationMode: 'planning' },
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data load
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setLoading(false);
    };
    loadData();
  }, []);

  const handleCardPress = (route: string, params?: any) => {
    navigation.navigate(route as never, params as never);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate data reload (replace with actual data fetching)
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <HeaderGradient />
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#6B7A5D"
            accessibilityLabel="Refresh content"
          />
        }
      >
        <Text 
          style={styles.sectionTitle}
          {...getHeaderA11yProps('Choose Your Focus', 2)}
        >
          Choose Your Focus
        </Text>
        {loading ? (
          <View {...getLoadingA11yProps(true)}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          CONVERSATION_MODES.map((mode) => (
            <BehaviorCard
              key={mode.id}
              icon="" 
              iconType={mode.iconType}
              iconBg={mode.iconBg}
              title={mode.title}
              subtitle={mode.subtitle}
              onPress={() => handleCardPress(mode.route, mode.params)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
});

export default HomeScreen;
