import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface Behavior {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const behaviors: Behavior[] = [
  {
    id: 'free-form-chat',
    title: 'Free-Form Chat',
    description: 'Open conversation and emotional support',
    icon: '💬',
  },
  {
    id: 'journal-prompt',
    title: 'Journal Prompts',
    description: 'Guided journaling with thoughtful questions',
    icon: '📝',
  },
  {
    id: 'guided-exercise',
    title: 'Guided Exercise',
    description: 'Structured personal growth activities',
    icon: '🧘',
  },
  {
    id: 'progress-analysis',
    title: 'Progress Analysis',
    description: 'Insights on your personal growth journey',
    icon: '📊',
  },
  {
    id: 'weekly-planning',
    title: 'Weekly Planning',
    description: 'Set intentions and plan your week',
    icon: '📅',
  },
];

interface HomeScreenProps {
  onSelectBehavior: (behaviorId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectBehavior }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shadow AI</Text>
        <Text style={styles.headerSubtitle}>
          Your personal companion for growth and reflection
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Choose Your Focus</Text>

        {behaviors.map((behavior) => (
          <TouchableOpacity
            key={behavior.id}
            style={styles.behaviorCard}
            onPress={() => onSelectBehavior(behavior.id)}
            activeOpacity={0.7}
          >
            <View style={styles.behaviorIcon}>
              <Text style={styles.behaviorIconText}>{behavior.icon}</Text>
            </View>
            <View style={styles.behaviorInfo}>
              <Text style={styles.behaviorTitle}>{behavior.title}</Text>
              <Text style={styles.behaviorDescription}>
                {behavior.description}
              </Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  behaviorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  behaviorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  behaviorIconText: {
    fontSize: 24,
  },
  behaviorInfo: {
    flex: 1,
  },
  behaviorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  behaviorDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrow: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '300',
  },
});
