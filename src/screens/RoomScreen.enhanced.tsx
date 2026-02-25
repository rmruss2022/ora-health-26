import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { AuthContext } from '../context/AuthContext';
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
  const { user } = useContext(AuthContext);
  const { roomId, roomName } = route.params as { roomId: string; roomName: string };

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    loadRoomDetails();
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [roomId]);

  const connectWebSocket = () => {
    try {
      const token = user?.token; // Get auth token
      const wsUrl = `ws://localhost:4000?token=${token}`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected');
        // Subscribe to room updates
        websocket.send(JSON.stringify({
          type: 'subscribe',
          data: { room: `room:${roomId}` }
        }));
      };

      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      setWs(websocket);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const disconnectWebSocket = () => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'unsubscribe',
        data: { room: `room:${roomId}` }
      }));
      ws.close();
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'room:user-joined':
        handleUserJoined(message.data);
        break;
      case 'room:user-left':
        handleUserLeft(message.data);
        break;
      case 'room:meditation-started':
        handleMeditationStarted(message.data);
        break;
    }
  };

  const handleUserJoined = (data: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRoom(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentParticipants: data.participantCount,
        participants: [...prev.participants, data.participant],
      };
    });
  };

  const handleUserLeft = (data: any) => {
    setRoom(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        currentParticipants: data.participantCount,
        participants: prev.participants.filter(p => p.userId !== data.userId),
      };
    });
  };

  const handleMeditationStarted = (data: any) => {
    // Show notification that meditation started
    Alert.alert(
      'Meditation Started',
      'A meditation session has begun in this room',
      [{ text: 'OK' }]
    );
  };

  const loadRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/rooms/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data);
        
        // Check if current user is already in the room
        const isInRoom = data.participants.some((p: Participant) => p.userId === user?.id);
        setHasJoined(isInRoom);
      }
    } catch (error) {
      console.error('Failed to load room details:', error);
      Alert.alert('Error', 'Failed to load room details');
    } finally {
      setLoading(false);
    }
  };

  const showJoinConfirmation = () => {
    setShowJoinConfirm(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleJoinRoom = async () => {
    try {
      setShowJoinConfirm(false);
      
      const response = await fetch(`http://localhost:4000/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          userId: user?.id || 'default-user',
          userName: user?.name || 'Anonymous',
          avatarUrl: user?.avatarUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHasJoined(true);
        setRoom(data.room);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Failed to join room');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      Alert.alert('Error', 'Failed to join the room. Please try again.');
    }
  };

  const handleLeaveRoom = async () => {
    Alert.alert(
      'Leave Room?',
      'Are you sure you want to leave this meditation room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://localhost:4000/api/rooms/${roomId}/leave`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${user?.token}`,
                },
                body: JSON.stringify({
                  userId: user?.id || 'default-user',
                }),
              });

              if (response.ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                navigation.goBack();
              }
            } catch (error) {
              console.error('Failed to leave room:', error);
              Alert.alert('Error', 'Failed to leave the room.');
            }
          },
        },
      ]
    );
  };

  const handleStartMeditation = () => {
    // Navigate to meditation selection or timer
    navigation.navigate('MeditationTimer', {
      roomId,
      roomName: room?.name,
    });
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
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={hasJoined ? handleLeaveRoom : () => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>
              {hasJoined ? '← Leave' : '← Back'}
            </Text>
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
            {!hasJoined ? (
              <TouchableOpacity 
                style={styles.joinButton} 
                onPress={showJoinConfirmation}
              >
                <Text style={styles.joinButtonText}>Join Room</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.meditateButton} 
                onPress={handleStartMeditation}
              >
                <Text style={styles.meditateButtonText}>🧘 Start Meditation</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Join Confirmation Modal */}
      <Modal
        visible={showJoinConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>{room.icon}</Text>
            <Text style={styles.modalTitle}>Join {room.name}?</Text>
            <Text style={styles.modalMessage}>
              You'll join {room.currentParticipants > 0 
                ? `${room.currentParticipants} ${room.currentParticipants === 1 ? 'person' : 'people'}`
                : 'this meditation room'} and can start meditating together.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowJoinConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleJoinRoom}
              >
                <Text style={styles.modalConfirmText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
