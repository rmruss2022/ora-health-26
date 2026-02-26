import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ParticipantAvatars } from '../components/ParticipantAvatars';
import { theme } from '../theme';

interface Participant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: Date;
}

interface RoomDetails {
  id: string;
  name: string;
  description: string;
  theme: string;
  icon: string;
  tags: string[];
  gradientStart: string;
  gradientEnd: string;
  currentParticipants: number;
  participants: Participant[];
}

export const RoomScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { roomId, roomName } = route.params as { roomId: string; roomName: string };

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    loadRoomDetails();
  }, [roomId]);

  const loadRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/rooms/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data);
      }
    } catch (error) {
      console.error('Failed to load room details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user-id',
          userName: 'Matthew',
        }),
      });

      if (response.ok) {
        setHasJoined(true);
        loadRoomDetails(); // Refresh participant list
      }
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user-id',
        }),
      });

      if (response.ok) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  const handleStartMeditation = () => {
    // Navigate to meditation timer with room context
    console.log('Starting meditation in room:', roomId);
    // TODO: Navigate to meditation selection or start meditation
  };

  if (loading || !room) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[room.gradientStart, room.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleLeaveRoom}>
            <Text style={styles.backButtonText}>← Leave</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        >
          {/* Room Info */}
          <View style={styles.roomInfo}>
            <Text style={styles.icon}>{room.icon}</Text>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.description}>{room.description}</Text>

            {/* Tags */}
            <View style={styles.tags}>
              {room.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Participant Count */}
          <View style={styles.participantSection}>
            <Text style={styles.participantTitle}>
              {room.currentParticipants === 0
                ? 'Be the first to join'
                : room.currentParticipants === 1
                ? '1 person meditating'
                : `${room.currentParticipants} people meditating`}
            </Text>

            {room.participants.length > 0 && (
              <View style={styles.participantList}>
                {room.participants.map((participant) => (
                  <View key={participant.userId} style={styles.participantItem}>
                    <View
                      style={[
                        styles.participantAvatar,
                        { backgroundColor: getAvatarColor(participant.userId) },
                      ]}
                    >
                      <Text style={styles.participantInitials}>
                        {getInitials(participant.userName)}
                      </Text>
                    </View>
                    <Text style={styles.participantName}>{participant.userName}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {!hasJoined ? (
              <TouchableOpacity style={styles.joinButton} onPress={handleJoinRoom}>
                <Text style={styles.joinButtonText}>Join Room</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.meditateButton} onPress={handleStartMeditation}>
                <Text style={styles.meditateButtonText}>Start Meditation</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

// Helper functions
const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  ];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  roomInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  roomName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.95,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  tagText: {
    fontSize: 13,
    color: theme.colors.white,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  participantSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  participantTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  participantList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  participantItem: {
    alignItems: 'center',
    margin: 8,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  participantInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  participantName: {
    fontSize: 12,
    color: theme.colors.white,
    opacity: 0.9,
  },
  actions: {
    marginTop: 'auto',
  },
  joinButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.forestGreen,
  },
  meditateButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  meditateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.forestGreen,
  },
});
