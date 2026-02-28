import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MeditationList, Meditation } from '../components/MeditationList';
import { MeditationFilterModal, MeditationFilters } from '../components/MeditationFilterModal';
import { RoomPreviewSheet } from '../components/RoomPreviewSheet';
import { FloatingAuraAgent } from '../components/FloatingAuraAgent';
import { AuraIntroOverlay } from '../components/AuraIntroOverlay';
import { backgroundMusicService } from '../services/BackgroundMusicService';
import { roomsAPI, MeditationRoom } from '../services/api/roomsAPI';
import { theme } from '../theme';

const MOCK_MEDITATIONS: Meditation[] = [
  {
    id: '1',
    title: 'Box Breathing',
    description: 'Calm your nervous system with 4-4-4-4 breathing',
    duration: 5,
    category: 'breathwork',
    icon: '🫁',
    mood: 'calm',
    difficulty: 'beginner',
  },
  {
    id: '2',
    title: 'Loving Kindness',
    description: 'Cultivate compassion for yourself and others',
    duration: 10,
    category: 'loving-kindness',
    icon: '💚',
    mood: 'restore',
    difficulty: 'beginner',
  },
  {
    id: '3',
    title: 'Anxiety Relief',
    description: 'Find peace in moments of worry',
    duration: 7,
    category: 'anxiety',
    icon: '🌊',
    mood: 'calm',
    difficulty: 'beginner',
  },
  {
    id: '4',
    title: 'Body Scan',
    description: 'Release tension through mindful awareness',
    duration: 15,
    category: 'body-scan',
    icon: '✨',
    mood: 'ground',
    difficulty: 'intermediate',
  },
  {
    id: '5',
    title: 'Sleep Meditation',
    description: 'Drift into peaceful rest',
    duration: 20,
    category: 'sleep',
    icon: '🌙',
    mood: 'restore',
    difficulty: 'beginner',
  },
];

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

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [introVisible, setIntroVisible] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<MeditationFilters>({});
  const [previewRoom, setPreviewRoom] = useState<Room | null>(null);

  const ROOMS_DATA: Room[] = [
    {
      id: 'commons',
      name: 'Garden Pavilion',
      description: 'Meditate together in natures garden',
      theme: 'garden',
      tags: ['community', 'nature', 'welcoming'],
      currentParticipants: 12,
      image: require('../../assets/room-commons.png'),
    },
    {
      id: 'tide-pool',
      name: 'Tide Pool',
      description: 'Find calm in the gentle rhythm of waves',
      theme: 'tide-pool',
      tags: ['mindfulness', 'grounding', 'calm'],
      currentParticipants: 8,
      image: require('../../assets/room-tidepool.png'),
    },
    {
      id: 'starlit',
      name: 'Starlit Clearing',
      description: 'Meditate under the stars',
      theme: 'starlit',
      tags: ['evening', 'peace', 'reflection'],
      currentParticipants: 5,
      image: require('../../assets/room-starlit.png'),
    },
    {
      id: 'forest',
      name: 'Forest Nest',
      description: 'Ground yourself in natures embrace',
      theme: 'forest',
      tags: ['nature', 'renewal', 'growth'],
      currentParticipants: 15,
      image: require('../../assets/room-forest.png'),
    },
  ];

  const SOLO_ROOM: Room = {
    id: 'solo',
    name: 'Solo Sanctuary',
    description: 'Your personal meditation space',
    theme: 'solo',
    tags: ['solo', 'focus', 'privacy'],
    currentParticipants: 1,
    image: require('../../assets/room-solo.png'),
  };

  const ROOM_THEME_IMAGES: Record<string, any> = {
    commons: require('../../assets/room-commons.png'),
    'tide-pool': require('../../assets/room-tidepool.png'),
    starlit: require('../../assets/room-starlit.png'),
    forest: require('../../assets/room-forest.png'),
    solo: require('../../assets/room-solo.png'),
    garden: require('../../assets/room-commons.png'),
  };

  useEffect(() => {
    loadRooms();
    backgroundMusicService.play('cascade');
  }, []);

  const mapRoomWithImage = (room: Omit<Room, 'image'>): Room => ({
    ...room,
    image: ROOM_THEME_IMAGES[room.theme] || ROOM_THEME_IMAGES.commons,
  });

  const mapApiRoom = (room: MeditationRoom): Room =>
    mapRoomWithImage({
      id: room.id,
      name: room.name,
      description: room.description,
      theme: room.theme,
      tags: room.tags,
      currentParticipants: room.currentParticipants,
      gradientStart: room.gradientStart,
      gradientEnd: room.gradientEnd,
      icon: room.icon,
    });

  const loadRooms = async () => {
    try {
      setLoading(true);
      const apiRooms = await roomsAPI.getRooms();

      if (apiRooms.length > 0) {
        setRooms(apiRooms.map(mapApiRoom));
      } else {
        setRooms(ROOMS_DATA.map(mapRoomWithImage));
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setRooms(ROOMS_DATA.map(mapRoomWithImage));
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedRoom = (): Room => {
    if (rooms.length === 0) {
      return mapRoomWithImage(ROOMS_DATA[0]);
    }

    const hour = new Date().getHours();
    const preferredTheme =
      hour >= 6 && hour < 12
        ? 'commons'
        : hour >= 12 && hour < 17
          ? 'tide-pool'
          : hour >= 17 && hour < 21
            ? 'forest'
            : 'starlit';

    const preferredRoom = rooms.find((room) => room.theme === preferredTheme);
    return preferredRoom || rooms[0];
  };

  const handleRoomPress = (room: Room) => {
    setPreviewRoom(room);
  };

  const handleJoinFromSheet = (room: Room) => {
    setPreviewRoom(null);
    navigation?.navigate('Room', { roomId: room.id, roomName: room.name });
  };

  const handleMeditationPress = (meditation: Meditation) => {
    navigation?.navigate('MeditationTimer', { meditation });
  };

  const handleApplyFilters = (newFilters: MeditationFilters) => {
    setFilters(newFilters);
  };

  const recommendedRoom = getRecommendedRoom();
  const hasSoloRoom = rooms.some((room) => room.theme === 'solo');
  const exploreRooms = [
    ...rooms.filter((room) => room.id !== recommendedRoom.id),
    ...(hasSoloRoom ? [] : [SOLO_ROOM]),
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 88 },
        ]}
      >
        <View style={styles.headerSection}>
          <View style={styles.headerTopRow}>
          <Text style={styles.greeting}>Hi Matthew</Text>

            <View style={styles.badges}>
              <View style={styles.badge}>
                <Image
                  source={require('../../assets/icon-flame.png')}
                  style={styles.badgeIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.badgeText}>0</Text>
              </View>
              <View style={styles.badge}>
                <Image
                  source={require('../../assets/icon-trophy.png')}
                  style={styles.badgeIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.badgeText}>0</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.affirmationCard}>
          <View style={styles.affirmationHeader}>
            <LinearGradient
              colors={['#D4B8E8', '#F8C8DC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compassionGradient}
            />
            <View style={styles.affirmationTitleContainer}>
              <Text style={styles.affirmationDay}>Day 0/7</Text>
              <Text style={styles.affirmationTitle}>Self Compassion</Text>
            </View>
          </View>
          <View style={styles.affirmationContent}>
            <Text style={styles.affirmationText}>I am kind to myself</Text>
            <Text style={styles.affirmationDescription}>
              I embrace my journey with compassion, knowing I am enough as I am.
            </Text>
          </View>
        </View>

        <View style={styles.recommendedContainer}>
          <Text style={styles.circleTitle}>Recommended for you</Text>
          <TouchableOpacity
            style={styles.recommendedRoomCard}
            onPress={() => handleRoomPress(recommendedRoom)}
            activeOpacity={0.9}
          >
            <Image
              source={recommendedRoom.image}
              style={styles.recommendedRoomImage}
              resizeMode="contain"
            />
            <View style={styles.recommendedRoomContent}>
              <Text style={styles.recommendedRoomName}>{recommendedRoom.name}</Text>
              <Text style={styles.recommendedRoomDesc}>{recommendedRoom.description}</Text>
              <View style={styles.recommendedRoomStats}>
                <Image
                  source={require('../../assets/avatar-user.png')}
                  style={styles.avatarIcon}
                  resizeMode="contain"
                />
                <Text style={styles.participantCount}>
                  {recommendedRoom.currentParticipants} meditating now
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.assortmentContainer}>
          <Text style={styles.circleTitle}>Explore other spaces</Text>
          <View style={styles.roomGrid}>
            {exploreRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomGridItem}
                onPress={() => handleRoomPress(room)}
                activeOpacity={0.9}
              >
                <Image
                  source={room.image}
                  style={styles.roomIllustration}
                  resizeMode="contain"
                />
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={styles.roomParticipants}>
                    <Image
                      source={require('../../assets/avatar-user.png')}
                      style={styles.smallAvatarIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.smallParticipantCount}>{room.currentParticipants}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <LinearGradient
          colors={['#2D6A4F', '#52B788']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.seriesGradientContainer}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cleansing & Deep Breathing</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.browseButtonText}>Browse Series</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.seriesSubtitle}>5 modules · 45 min total</Text>
        </LinearGradient>

        <View style={styles.section}>
          <MeditationList
            meditations={MOCK_MEDITATIONS}
            filters={filters}
            onMeditationPress={handleMeditationPress}
          />
        </View>
      </ScrollView>

      {!introVisible && <FloatingAuraAgent context="home" />}
      <AuraIntroOverlay
        visible={introVisible}
        canDismiss={!loading}
        onDismiss={() => setIntroVisible(false)}
      />

      <RoomPreviewSheet
        room={previewRoom}
        onClose={() => setPreviewRoom(null)}
        onJoin={handleJoinFromSheet}
      />

      <MeditationFilterModal
        visible={filterModalVisible}
        currentFilters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.lavender,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingLeft: 12,
  },
  greeting: {
    fontSize: 32,
    fontFamily: 'Allura-Regular',
    color: theme.colors.charcoal,
    letterSpacing: 0.3,
    paddingLeft: 25,
    marginTop: 4,
    top: 4
  },
  badges: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  badgeIconImage: {
    width: 30,
    height: 30,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  affirmationCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  affirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  compassionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  affirmationTitleContainer: {
    flex: 1,
  },
  affirmationDay: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.lavender,
    marginBottom: 4,
  },
  affirmationTitle: {
    fontSize: 22,
    fontWeight: '300',
    fontFamily: 'System',
    letterSpacing: 0.5,
    color: theme.colors.charcoal,
  },
  affirmationContent: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  affirmationText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: 8,
  },
  affirmationDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  recommendedContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  circleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.lavender,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(163, 163, 163, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  recommendedRoomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 184, 232, 0.45)',
    borderRadius: 20,
    padding: 12,
  },
  recommendedRoomImage: {
    width: 140,
    height: 140,
    marginRight: 16,
  },
  recommendedRoomContent: {
    flex: 1,
  },
  recommendedRoomName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
    marginBottom: 8,
  },
  recommendedRoomDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendedRoomStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  participantCount: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  assortmentContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  roomGridItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 8,
  },
  roomIllustration: {
    width: '100%',
    height: 140,
    marginBottom: 8,
  },
  roomInfo: {
    alignItems: 'center',
  },
  roomName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.charcoal,
    textAlign: 'center',
    marginBottom: 6,
  },
  roomParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatarIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  smallParticipantCount: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  seriesGradientContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  seriesSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 0,
  },
  browseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  browseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
