import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RoomCard, MeditationRoom } from './RoomCard';

interface RoomGridProps {
  rooms: MeditationRoom[];
  onRoomPress: (room: MeditationRoom) => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({ rooms, onRoomPress }) => {
  // Separate Solo Sanctuary from other rooms
  const soloRoom = rooms.find((r) => r.theme === 'solo');
  const otherRooms = rooms.filter((r) => r.theme !== 'solo');

  return (
    <View style={styles.container}>
      {/* Main 4 rooms in 2x2 grid */}
      <View style={styles.grid}>
        {otherRooms.map((room) => (
          <View key={room.id} style={styles.gridItem}>
            <RoomCard room={room} onPress={onRoomPress} />
          </View>
        ))}
      </View>

      {/* Solo Sanctuary - full width */}
      {soloRoom && (
        <View style={styles.soloContainer}>
          <RoomCard room={soloRoom} onPress={onRoomPress} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6,
  },
  soloContainer: {
    marginTop: 12,
  },
});
