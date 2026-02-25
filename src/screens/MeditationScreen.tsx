import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface MeditationScreenProps {
  navigation?: any;
}

export const MeditationScreen: React.FC<MeditationScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.pageContent, { paddingBottom: insets.bottom + 88 }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Find Calm</Text>
          <Text style={styles.headerSubtitle}>
            Practices for peace and presence
          </Text>
        </View>

        {/* Collective Session Card */}
        <TouchableOpacity
          style={styles.collectiveCard}
          onPress={() => {
            console.log('Navigate to Collective Session');
            navigation?.navigate('CollectiveSession', { sessionId: 'demo-session' });
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.forestGreen, theme.colors.lavender]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.collectiveGradient}
          >
            <View style={styles.collectiveContent}>
              <Text style={styles.collectiveIcon}>🌅</Text>
              <View style={styles.collectiveInfo}>
                <Text style={styles.collectiveTitle}>Next Collective Session</Text>
                <Text style={styles.collectiveTime}>Starts in 3 hours</Text>
                <Text style={styles.collectiveParticipants}>0 people joining</Text>
              </View>
            </View>
            <View style={styles.collectiveButton}>
              <Text style={styles.collectiveButtonText}>Join →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Daily Reflection Card */}
        <TouchableOpacity
          style={styles.reflectionCard}
          onPress={() => {
            console.log('Navigate to Daily Reflection');
            navigation?.navigate('DailyReflection');
          }}
          activeOpacity={0.8}
        >
          <View style={styles.reflectionContent}>
            <Text style={styles.reflectionIcon}>📝</Text>
            <View style={styles.reflectionInfo}>
              <Text style={styles.reflectionTitle}>Daily Reflection</Text>
              <Text style={styles.reflectionSubtitle}>
                Share your thoughts with the community
              </Text>
            </View>
          </View>
          <View style={styles.reflectionButton}>
            <Text style={styles.reflectionButtonText}>Start →</Text>
          </View>
        </TouchableOpacity>

        {/* Mock Meditations */}
        <View style={styles.meditationsSection}>
          <Text style={styles.sectionTitle}>Guided Meditations</Text>
          
          <TouchableOpacity style={styles.meditationCard} activeOpacity={0.7}>
            <View style={styles.meditationIcon}>
              <Text style={styles.meditationIconText}>🫁</Text>
            </View>
            <View style={styles.meditationInfo}>
              <Text style={styles.meditationTitle}>Box Breathing</Text>
              <Text style={styles.meditationDescription}>
                Calm your nervous system with 4-4-4-4 breathing
              </Text>
              <Text style={styles.meditationDuration}>5 minutes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.meditationCard} activeOpacity={0.7}>
            <View style={styles.meditationIcon}>
              <Text style={styles.meditationIconText}>💚</Text>
            </View>
            <View style={styles.meditationInfo}>
              <Text style={styles.meditationTitle}>Loving Kindness</Text>
              <Text style={styles.meditationDescription}>
                Cultivate compassion for yourself and others
              </Text>
              <Text style={styles.meditationDuration}>10 minutes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.meditationCard} activeOpacity={0.7}>
            <View style={styles.meditationIcon}>
              <Text style={styles.meditationIconText}>🌊</Text>
            </View>
            <View style={styles.meditationInfo}>
              <Text style={styles.meditationTitle}>Anxiety Relief</Text>
              <Text style={styles.meditationDescription}>
                Find peace in moments of worry
              </Text>
              <Text style={styles.meditationDuration}>7 minutes</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  pageContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.charcoal,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  collectiveCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  collectiveGradient: {
    padding: 20,
  },
  collectiveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  collectiveIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  collectiveInfo: {
    flex: 1,
  },
  collectiveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  collectiveTime: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  collectiveParticipants: {
    fontSize: 12,
    color: theme.colors.white,
    opacity: 0.8,
  },
  collectiveButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  collectiveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  reflectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  reflectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reflectionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  reflectionInfo: {
    flex: 1,
  },
  reflectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
    marginBottom: 2,
  },
  reflectionSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  reflectionButton: {
    backgroundColor: theme.colors.forestGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reflectionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.white,
  },
  meditationsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
    marginBottom: 16,
  },
  meditationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  meditationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  meditationIconText: {
    fontSize: 24,
  },
  meditationInfo: {
    flex: 1,
  },
  meditationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 4,
  },
  meditationDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  meditationDuration: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});
