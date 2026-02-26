import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { meditationApi, MeditationStats } from '../services/meditation';
import { theme } from '../theme';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<MeditationStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await meditationApi.getUserStats(user?.id);
        if (mounted) {
          setStats(response ?? null);
        }
      } catch (error) {
        console.error('Failed to load profile stats:', error);
      } finally {
        if (mounted) {
          setIsLoadingStats(false);
        }
      }
    };
    loadStats();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.slice(0, 1) || 'M'}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Matt'}</Text>
        <Text style={styles.email}>{user?.email || 'matt@ora.ai'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{stats?.completedThisWeek ?? 0}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{stats?.currentStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Week Streak</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statValue}>{stats?.totalSessions ?? 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </View>
        {isLoadingStats && <ActivityIndicator size="small" color="#66734E" style={styles.loader} />}

        <TouchableOpacity style={styles.button} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    backgroundColor: '#F6F5F1',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D7D3C8',
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C5C98F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: theme.typography.h2.fontFamily,
    color: '#4F532D',
    fontSize: 30,
  },
  name: {
    fontFamily: theme.typography.h2.fontFamily,
    color: '#555249',
    fontSize: 26,
  },
  email: {
    fontFamily: theme.typography.body.fontFamily,
    color: '#868074',
    fontSize: 14,
    marginTop: 2,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  statChip: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD8CB',
    backgroundColor: '#FBFAF7',
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: theme.typography.h4.fontFamily,
    color: '#575545',
    fontSize: 18,
  },
  statLabel: {
    fontFamily: theme.typography.labelSmall.fontFamily,
    color: '#989486',
    fontSize: 11,
    marginTop: 2,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#5C6C57',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: theme.typography.button.fontFamily,
    color: '#F5F5EF',
    fontSize: 14,
  },
  loader: {
    marginBottom: 14,
  },
});

export default ProfileScreen;
