import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { backgroundMusicService } from '../services/BackgroundMusicService';

interface MeditationSoundControlProps {
  style?: ViewStyle;
}

export const MeditationSoundControl: React.FC<MeditationSoundControlProps> = ({ style }) => {
  const [currentTrack, setCurrentTrack] = useState(backgroundMusicService.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState(backgroundMusicService.getIsPlaying());

  // Stay in sync with service play state
  useEffect(() => {
    const unsub = backgroundMusicService.onPlayStateChange(setIsPlaying);
    return unsub;
  }, []);

  const handlePlayPause = async () => {
    await backgroundMusicService.togglePlayPause();
  };

  const handleNext = async () => {
    await backgroundMusicService.next();
    setCurrentTrack(backgroundMusicService.getCurrentTrack());
  };

  const handlePrev = async () => {
    await backgroundMusicService.prev();
    setCurrentTrack(backgroundMusicService.getCurrentTrack());
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={handlePlayPause} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.playPause}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
      <Text style={styles.trackName}>{currentTrack.displayName}</Text>
      <TouchableOpacity onPress={handlePrev} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.arrow}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleNext} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(212,184,232,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playPause: {
    fontSize: 13,
    color: '#9B8AB4',
  },
  trackName: {
    flex: 1,
    fontSize: 12,
    color: '#9B8AB4',
  },
  arrow: {
    fontSize: 18,
    color: '#9B8AB4',
    lineHeight: 22,
  },
});
