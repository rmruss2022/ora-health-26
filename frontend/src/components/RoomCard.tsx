import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ParticipantAvatars } from './ParticipantAvatars';
import { theme } from '../theme';

export interface MeditationRoom {
  id: string;
  name: string;
  description: string;
  theme: string;
  icon: string;
  tags: string[];
  gradientStart: string;
  gradientEnd: string;
  currentParticipants: number;
  participants?: Participant[];
}

export interface Participant {
  userId: string;
  userName: string;
  avatarUrl?: string;
}

interface RoomCardProps {
  room: MeditationRoom;
  onPress: (room: MeditationRoom) => void;
  featured?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onPress, featured }) => {
  const participantText =
    room.currentParticipants === 0
      ? 'No one meditating'
      : room.currentParticipants === 1
      ? '1 person meditating'
      : `${room.currentParticipants} people meditating`;

  return (
    <TouchableOpacity
      style={[styles.container, featured && styles.featuredContainer]}
      onPress={() => onPress(room)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[room.gradientStart, room.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>{room.icon}</Text>
          <View style={styles.headerText}>
            <Text style={styles.name}>{room.name}</Text>
            <Text style={styles.participantCount}>{participantText}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {room.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.tags}>
            {room.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {room.currentParticipants > 0 && room.participants && (
            <ParticipantAvatars participants={room.participants} max={5} />
          )}
        </View>

        <View style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Join →</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featuredContainer: {
    marginBottom: 20,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  participantCount: {
    fontSize: 13,
    color: theme.colors.white,
    opacity: 0.9,
  },
  description: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.95,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: theme.colors.white,
    fontWeight: '500',
  },
  joinButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
