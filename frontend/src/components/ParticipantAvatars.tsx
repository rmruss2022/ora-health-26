import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface Participant {
  userId: string;
  userName: string;
  avatarUrl?: string;
}

interface ParticipantAvatarsProps {
  participants: Participant[];
  max?: number;
}

export const ParticipantAvatars: React.FC<ParticipantAvatarsProps> = ({
  participants,
  max = 5,
}) => {
  const visible = participants.slice(0, max);
  const remaining = participants.length - max;

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (userId: string): string => {
    // Generate consistent color based on userId
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    ];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <View style={styles.container}>
      {visible.map((participant, index) => (
        <View
          key={participant.userId}
          style={[
            styles.avatar,
            {
              backgroundColor: getAvatarColor(participant.userId),
              marginLeft: index === 0 ? 0 : -8,
              zIndex: visible.length - index,
            },
          ]}
        >
          <Text style={styles.initials}>{getInitials(participant.userName)}</Text>
        </View>
      ))}
      {remaining > 0 && (
        <View style={[styles.avatar, styles.remainingAvatar]}>
          <Text style={styles.remainingText}>+{remaining}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  initials: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  remainingAvatar: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginLeft: -8,
  },
  remainingText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
