// Ask Agent Button Component
// Allows users to request an AI agent comment on a post

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { agentAPI } from '../../services/api/agentAPI';

interface AskAgentButtonProps {
  postId: string;
  onCommentGenerated?: (comment: any) => void;
}

export const AskAgentButton: React.FC<AskAgentButtonProps> = ({
  postId,
  onCommentGenerated,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    try {
      setLoading(true);

      // Generate agent comment
      const comment = await agentAPI.generateComment(postId);

      if (comment) {
        Alert.alert(
          '✨ AI Guide Responded',
          `${comment.author.name} added a thoughtful comment!`,
          [{ text: 'View', onPress: () => onCommentGenerated?.(comment) }]
        );
      }
    } catch (error: any) {
      console.error('Error generating agent comment:', error);
      Alert.alert(
        'Unable to Generate Comment',
        error.message || 'The AI guides are taking a break. Try again later!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#F3E8FF', '#E9D5FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#7C3AED" />
        ) : (
          <>
            <Text style={styles.icon}>🤖</Text>
            <Text style={styles.text}>Ask an AI Guide</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
});
