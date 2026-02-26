import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { roomsAPI } from '../services/api/roomsAPI';
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

const ROOM_THEME_IMAGES: Record<string, any> = {
  commons: require('../../assets/room-commons.png'),
  'tide-pool': require('../../assets/room-tidepool.png'),
  starlit: require('../../assets/room-starlit.png'),
  forest: require('../../assets/room-forest.png'),
  solo: require('../../assets/room-solo.png'),
  garden: require('../../assets/room-commons.png'),
};

const ROOM_WELCOME_COPY: Record<string, string> = {
  commons:
    'Find calm in community. This garden pavilion is designed for open, welcoming group presence — perfect for beginners and experienced meditators alike.',
  garden:
    'Find calm in community. This garden pavilion is designed for open, welcoming group presence — perfect for beginners and experienced meditators alike.',
  'tide-pool':
    'Let the rhythm of the waves guide you inward. This space uses sound anchoring to help you stay present, breath by breath.',
  starlit:
    'Evening reflections are most powerful when you let go of the day. This clearing supports silent, open-awareness sits under a vast, imagined sky.',
  forest:
    'Nature grounds the nervous system. This forest nest guides you through a body-scan and slow-breath sequence inspired by time spent among trees.',
  solo:
    'Your private space to settle in without distraction. Focus on whatever style feels right today — breath, body, or open awareness.',
};

export const RoomScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { roomId, roomName } = route.params as { roomId: string; roomName?: string };

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [resolvedRoomId, setResolvedRoomId] = useState<string>(roomId);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const resolveRoomId = async (rawRoomId: string, fallbackName?: string): Promise<string> => {
    if (isUuid(rawRoomId)) {
      return rawRoomId;
    }

    const availableRooms = await roomsAPI.getRooms();
    const matchedRoom =
      availableRooms.find((entry) => entry.theme === rawRoomId) ||
      availableRooms.find((entry) => entry.id === rawRoomId) ||
      (fallbackName
        ? availableRooms.find((entry) => entry.name.toLowerCase() === fallbackName.toLowerCase())
        : undefined);

    if (!matchedRoom) {
      throw new Error(`Unable to resolve room id: ${rawRoomId}`);
    }

    return matchedRoom.id;
  };

  useEffect(() => {
    loadAndJoinRoom();
  }, [roomId, roomName]);

  // Navigating to a room = joining it. No separate confirmation step.
  const loadAndJoinRoom = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const resolved = await resolveRoomId(roomId, roomName);
      setResolvedRoomId(resolved);
      const data = await roomsAPI.getRoomDetails(resolved);

      const alreadyJoined = data.participants.some((p: Participant) => p.userId === user?.id);
      if (!alreadyJoined && user?.id) {
        const joinData = await roomsAPI.joinRoom(resolved, {
          userId: user.id,
          userName: user.name || 'Anonymous',
        });
        setRoom(joinData.room);
      } else {
        setRoom(data);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to join room:', error);
      setLoadError('Failed to load room');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      if (user?.id) {
        await roomsAPI.leaveRoom(resolvedRoomId, user.id);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to leave room:', error);
    } finally {
      navigation.navigate('HomeMain' as never);
    }
  };

  const handleStartMeditation = () => {
    const targetRoomId = resolvedRoomId || roomId;
    // Navigate to meditation selection or timer
    navigation.navigate('MeditationTimer', {
      roomId: targetRoomId,
      roomName: room?.name,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>{loadError || 'Room unavailable'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRoomDetails}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
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
          {/* Room Hero - two-column layout */}
          <View style={styles.heroRow}>
            {/* Left column: title, description, tags */}
            <View style={styles.heroLeft}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.description}>{room.description}</Text>
              <View style={styles.tags}>
                {room.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            {/* Right column: room image */}
            <Image
              source={ROOM_THEME_IMAGES[room.theme] ?? ROOM_THEME_IMAGES.commons}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* Welcome section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome</Text>
            <Text style={styles.welcomeBody}>
              Here's the meditation you can do in this space.
            </Text>
            <Text style={styles.welcomeBody}>
              {ROOM_WELCOME_COPY[room.theme] ?? ROOM_WELCOME_COPY.commons}
            </Text>
          </View>

          {/* Participant Section */}
          <View style={styles.participantSection}>
            <View style={styles.participantHeader}>
              <Text style={styles.participantTitle}>
                {room.currentParticipants === 0
                  ? 'Be the first to join'
                  : room.currentParticipants === 1
                  ? '1 person meditating'
                  : `${room.currentParticipants} people meditating`}
              </Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>

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

          {/* Room Atmosphere */}
          <View style={styles.atmosphereSection}>
            <Text style={styles.atmosphereTitle}>Room Atmosphere</Text>
            <Text style={styles.atmosphereText}>
              {getAtmosphereDescription(room.currentParticipants)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.meditateButton}
              onPress={handleStartMeditation}
            >
              <Text style={styles.meditateButtonText}>Start Meditation</Text>
            </TouchableOpacity>
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

const getAtmosphereDescription = (participantCount: number): string => {
  if (participantCount === 0) {
    return 'Peaceful and quiet. Perfect for solo practice.';
  } else if (participantCount <= 3) {
    return 'Intimate and cozy. A small group meditating together.';
  } else if (participantCount <= 10) {
    return 'Active and supportive. Great collective energy.';
  } else {
    return 'Vibrant and energizing. A large community gathering.';
  }
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
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 12,
  },
  heroImage: {
    width: 140,
    height: 140,
    borderRadius: 16,
  },
  welcomeSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: 10,
  },
  welcomeBody: {
    fontSize: 15,
    color: theme.colors.white,
    opacity: 0.9,
    lineHeight: 22,
    marginBottom: 6,
  },
  roomName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
    lineHeight: 20,
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
  },
  participantList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  participantItem: {
    alignItems: 'center',
    margin: 8,
    width: 64,
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
    fontSize: 11,
    color: theme.colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  atmosphereSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  atmosphereTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 8,
    opacity: 0.8,
  },
  atmosphereText: {
    fontSize: 15,
    color: theme.colors.white,
    lineHeight: 20,
  },
  actions: {
    marginTop: 'auto',
  },
  joinButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    ...theme.shadows.lg,
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
    ...theme.shadows.lg,
  },
  meditateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.forestGreen,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...theme.shadows.xl,
  },
  modalIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: theme.colors.backgroundGray,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
