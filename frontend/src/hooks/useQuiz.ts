import { useState, useEffect } from 'react';
import { quizService, DailyQuiz, QuizStreak } from '../services/quiz.service';

export const useQuiz = (userId: string) => {
  const [todaysQuiz, setTodaysQuiz] = useState<DailyQuiz | null>(null);
  const [streak, setStreak] = useState<QuizStreak | null>(null);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuizData();
  }, [userId]);

  const loadQuizData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load today's quiz
      const quiz = await quizService.getTodaysQuiz();
      setTodaysQuiz(quiz);

      // Check if user has completed it
      try {
        const response = await quizService.getUserQuizResponse(userId, quiz.id);
        setHasCompletedToday(!!response.response);
      } catch (err) {
        // No response found - not completed
        setHasCompletedToday(false);
      }

      // Load streak
      const streakData = await quizService.getUserStreak(userId);
      setStreak(streakData);
    } catch (err: any) {
      console.error('Error loading quiz data:', err);
      setError(err.message || 'Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadQuizData();
  };

  return {
    todaysQuiz,
    streak,
    hasCompletedToday,
    loading,
    error,
    refresh,
  };
};
