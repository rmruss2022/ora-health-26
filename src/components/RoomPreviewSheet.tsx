import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface Room {
  id: string;
  name: string;
  description: string;
  theme: string;
  tags: string[];
  currentParticipants: number;
  gradientStart?: string;
  gradientEnd?: string;
  icon?: string;
  image: any;
}

interface RoomPreviewSheetProps {
  room: Room | null;
  onClose: () => void;
  onJoin: (room: Room) => void;
}

export const RoomPreviewSheet: React.FC<RoomPreviewSheetProps> = ({
  room,
  onClose,
  onJoin,
}) => {
  if (!room) return null;

  return (
    <Modal
      visible={!!room}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Room image + info row */}
          <View style={styles.heroRow}>
            <Image
              source={room.image}
              style={styles.roomImage}
              resizeMode="contain"
            />
            <View style={styles.heroInfo}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomDescription} numberOfLines={2}>
                {room.description}
              </Text>
              {/* Tags */}
              <View style={styles.tagsRow}>
                {room.tags.slice(0, 2).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Participant count */}
          <View style={styles.participantRow}>
            <View style={styles.liveDot} />
            <Text style={styles.participantText}>
              {room.currentParticipants > 0
                ? `${room.currentParticipants} meditating now`
                : 'Be the first to arrive'}
            </Text>
          </View>

          {/* CTA */}
          <LinearGradient
            colors={
              room.gradientStart && room.gradientEnd
                ? [room.gradientStart, room.gradientEnd]
                : ['#2D6A4F', '#52B788']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.joinButton}
          >
            <TouchableOpacity
              style={styles.joinButtonInner}
              onPress={() => onJoin(room)}
              activeOpacity={0.85}
            >
              <Text style={styles.joinButtonText}>Join Room</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: 24,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  roomImage: {
    width: 120,
    height: 120,
    marginRight: 16,
    borderRadius: 12,
  },
  heroInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.charcoal,
    marginBottom: 6,
  },
  roomDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(84, 130, 102, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D6A4F',
    textTransform: 'capitalize',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 8,
  },
  participantText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  joinButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  joinButtonInner: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: 0.3,
  },
});
