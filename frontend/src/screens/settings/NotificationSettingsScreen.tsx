/**
 * Notification Settings Screen
 * UI for managing notification preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationsService, NotificationPreferences } from '../../services/notifications.service';

export default function NotificationSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    lettersEnabled: true,
    communityEnabled: true,
    remindersEnabled: true,
    weeklyPlanningEnabled: true,
    weeklyReviewEnabled: true,
    weeklyPlanningDay: 'sunday',
    weeklyPlanningTime: '09:00',
    weeklyReviewDay: 'sunday',
    weeklyReviewTime: '18:00',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationsService.getPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (
    key: keyof NotificationPreferences,
    value: boolean | string
  ) => {
    try {
      // Optimistically update UI
      setPreferences(prev => ({ ...prev, [key]: value }));
      
      // Save to backend
      setSaving(true);
      const success = await notificationsService.updatePreferences({
        [key]: value,
      });

      if (!success) {
        // Revert on failure
        setPreferences(prev => ({ ...prev, [key]: !value }));
        Alert.alert('Error', 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preference:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>
            Choose what notifications you'd like to receive
          </Text>
        </View>

        {/* Letter Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📬 Letters</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Letter Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified when you receive a new letter
              </Text>
            </View>
            <Switch
              value={preferences.lettersEnabled}
              onValueChange={(value) => updatePreference('lettersEnabled', value)}
              disabled={saving}
            />
          </View>
        </View>

        {/* Community Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💬 Community</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Community Notifications</Text>
              <Text style={styles.settingDescription}>
                Reactions, comments, and community updates
              </Text>
            </View>
            <Switch
              value={preferences.communityEnabled}
              onValueChange={(value) => updatePreference('communityEnabled', value)}
              disabled={saving}
            />
          </View>
        </View>

        {/* Reminder Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔔 Reminders</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>General Reminders</Text>
              <Text style={styles.settingDescription}>
                Meditation reminders and mindfulness prompts
              </Text>
            </View>
            <Switch
              value={preferences.remindersEnabled}
              onValueChange={(value) => updatePreference('remindersEnabled', value)}
              disabled={saving}
            />
          </View>
        </View>

        {/* Weekly Planning */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌅 Weekly Planning</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Planning Prompts</Text>
              <Text style={styles.settingDescription}>
                Get prompted to plan your week every {preferences.weeklyPlanningDay || 'Sunday'}
              </Text>
            </View>
            <Switch
              value={preferences.weeklyPlanningEnabled}
              onValueChange={(value) => updatePreference('weeklyPlanningEnabled', value)}
              disabled={saving}
            />
          </View>
        </View>

        {/* Weekly Review */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌟 Weekly Review</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Review Prompts</Text>
              <Text style={styles.settingDescription}>
                Get prompted to reflect on your week every {preferences.weeklyReviewDay || 'Sunday'}
              </Text>
            </View>
            <Switch
              value={preferences.weeklyReviewEnabled}
              onValueChange={(value) => updatePreference('weeklyReviewEnabled', value)}
              disabled={saving}
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 You can customize the timing of weekly prompts in your profile settings
          </Text>
        </View>

        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  savingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});
