import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { quizService, QuizStreak } from '../services/quiz.service';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export const QuizHistoryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [streak, setStreak] = useState<QuizStreak | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock user ID - replace with actual auth
  const userId = 'mock-user-id';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [streakData, historyData, statsData] = await Promise.all([
        quizService.getUserStreak(userId),
        quizService.getUserQuizHistory(userId, 30),
        quizService.getUserQuizStats(userId, 30),
      ]);

      setStreak(streakData);
      setHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakBadge = () => {
    if (!streak) return null;

    const current = streak.current_streak;
    if (current >= 100) return '💯';
    if (current >= 30) return '🏆';
    if (current >= 7) return '🔥';
    return '⭐';
  };

  const renderStreakCard = () => {
    if (!streak) return null;

    return (
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Text style={styles.streakBadge}>{getStreakBadge()}</Text>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{streak.current_streak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.streakStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{streak.longest_streak}</Text>
            <Text style={styles.statLabel}>Longest</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{streak.total_completed}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMoodChart = () => {
    if (!history || history.length === 0) return null;

    // Get last 7 days of mood scores
    const last7Days = history.slice(0, 7).reverse();
    const moodScores = last7Days.map((h) => h.mood_score || 3);
    const labels = last7Days.map((h) => {
      const date = new Date(h.quiz_date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Mood Trend (Last 7 Days)</Text>
        <LineChart
          data={{
            labels,
            datasets: [
              {
                data: moodScores,
              },
            ],
          }}
          width={width - 40}
          height={200}
          chartConfig={{
            backgroundColor: theme.colors.white,
            backgroundGradientFrom: theme.colors.white,
            backgroundGradientTo: theme.colors.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34, 139, 34, ${opacity})`,
            labelColor: (opacity = 1) => theme.colors.textSecondary,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: theme.colors.forestGreen,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderIntentions = () => {
    if (!stats || !stats.top_intentions || stats.top_intentions.length === 0) {
      return null;
    }

    const intentionEmojis: Record<string, string> = {
      peace: '🕊️',
      productivity: '✅',
      connection: '💛',
      growth: '🌱',
      rest: '🌙',
      joy: '✨',
    };

    return (
      <View style={styles.intentionsCard}>
        <Text style={styles.intentionsTitle}>Your Top Intentions</Text>
        <View style={styles.intentionsList}>
          {stats.top_intentions.slice(0, 5).map((item: any, index: number) => (
            <View key={index} style={styles.intentionItem}>
              <Text style={styles.intentionEmoji}>
                {intentionEmojis[item.intention] || '✨'}
              </Text>
              <View style={styles.intentionInfo}>
                <Text style={styles.intentionName}>
                  {item.intention.charAt(0).toUpperCase() + item.intention.slice(1)}
                </Text>
                <View style={styles.intentionBar}>
                  <View
                    style={[
                      styles.intentionBarFill,
                      {
                        width: `${(item.count / stats.total_quizzes) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.intentionCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAverages = () => {
    if (!stats) return null;

    return (
      <View style={styles.averagesCard}>
        <Text style={styles.averagesTitle}>30-Day Averages</Text>
        <View style={styles.averagesList}>
          <View style={styles.averageItem}>
            <Text style={styles.averageEmoji}>😊</Text>
            <View style={styles.averageInfo}>
              <Text style={styles.averageLabel}>Mood</Text>
              <Text style={styles.averageValue}>
                {parseFloat(stats.avg_mood || 0).toFixed(1)} / 5
              </Text>
            </View>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageEmoji}>⚡</Text>
            <View style={styles.averageInfo}>
              <Text style={styles.averageLabel}>Energy</Text>
              <Text style={styles.averageValue}>
                {parseFloat(stats.avg_energy || 0).toFixed(1)} / 5
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        {renderStreakCard()}
        {renderMoodChart()}
        {renderAverages()}
        {renderIntentions()}

        {/* History List */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Quizzes</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No quiz history yet</Text>
          ) : (
            history.slice(0, 10).map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyDate}>
                  <Text style={styles.historyDay}>
                    {new Date(item.quiz_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })}
                  </Text>
                  <Text style={styles.historyDateText}>
                    {new Date(item.quiz_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.historyScores}>
                  {item.mood_score && (
                    <View style={styles.scoreChip}>
                      <Text style={styles.scoreEmoji}>😊</Text>
                      <Text style={styles.scoreText}>{item.mood_score}/5</Text>
                    </View>
                  )}
                  {item.energy_score && (
                    <View style={styles.scoreChip}>
                      <Text style={styles.scoreEmoji}>⚡</Text>
                      <Text style={styles.scoreText}>{item.energy_score}/5</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: theme.colors.forestGreen,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  placeholder: {
    width: 60,
  },
  content: {
    paddingHorizontal: 20,
  },
  streakCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakBadge: {
    fontSize: 48,
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
  },
  streakLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  streakStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.forestGreen,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  chartCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  averagesCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  averagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 16,
  },
  averagesList: {
    gap: 12,
  },
  averageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
  },
  averageEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  averageInfo: {
    flex: 1,
  },
  averageLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  averageValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  intentionsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  intentionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 16,
  },
  intentionsList: {
    gap: 12,
  },
  intentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intentionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  intentionInfo: {
    flex: 1,
  },
  intentionName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.charcoal,
    marginBottom: 6,
  },
  intentionBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  intentionBarFill: {
    height: '100%',
    backgroundColor: theme.colors.forestGreen,
    borderRadius: 3,
  },
  intentionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginLeft: 12,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
  },
  historyItem: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    marginRight: 16,
  },
  historyDay: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  historyDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  historyScores: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scoreEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
});
