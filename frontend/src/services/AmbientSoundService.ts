import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

export interface AmbientSound {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  file: any; // require() asset
  description: string;
}

// Ambient sound library
// NOTE: Placeholder paths - replace with actual sound files
export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    name: 'rain-ambient-loop',
    displayName: 'Rain',
    icon: '🌧️',
    file: require('../../assets/sounds/rain-ambient-loop.mp3'),
    description: 'Gentle rainfall ambience',
  },
  {
    id: 'ocean',
    name: 'ocean-waves-loop',
    displayName: 'Ocean Waves',
    icon: '🌊',
    file: require('../../assets/sounds/ocean-waves-loop.mp3'),
    description: 'Calming ocean waves',
  },
  {
    id: 'forest',
    name: 'forest-birds-loop',
    displayName: 'Forest Birds',
    icon: '🌲',
    file: require('../../assets/sounds/forest-birds-loop.mp3'),
    description: 'Peaceful forest with birds',
  },
  {
    id: 'white-noise',
    name: 'white-noise-loop',
    displayName: 'White Noise',
    icon: '📻',
    file: require('../../assets/sounds/white-noise-loop.mp3'),
    description: 'Soothing white noise',
  },
  {
    id: 'singing-bowls',
    name: 'singing-bowls-loop',
    displayName: 'Singing Bowls',
    icon: '🔔',
    file: require('../../assets/sounds/singing-bowls-loop.mp3'),
    description: 'Tibetan singing bowls',
  },
  {
    id: 'stream',
    name: 'stream-water-loop',
    displayName: 'Stream',
    icon: '💧',
    file: require('../../assets/sounds/stream-water-loop.mp3'),
    description: 'Flowing stream water',
  },
];

export class AmbientSoundService {
  private static instance: AmbientSoundService;
  private currentSound: Sound | null = null;
  private currentSoundId: string | null = null;
  private volume: number = 0.5;
  private isPlaying: boolean = false;

  private constructor() {
    // Configure audio mode for background playback
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  }

  static getInstance(): AmbientSoundService {
    if (!AmbientSoundService.instance) {
      AmbientSoundService.instance = new AmbientSoundService();
    }
    return AmbientSoundService.instance;
  }

  /**
   * Get all available ambient sounds
   */
  getSounds(): AmbientSound[] {
    return AMBIENT_SOUNDS;
  }

  /**
   * Get a specific sound by ID
   */
  getSound(id: string): AmbientSound | undefined {
    return AMBIENT_SOUNDS.find(s => s.id === id);
  }

  /**
   * Play an ambient sound (loops indefinitely)
   */
  async play(soundId: string): Promise<void> {
    try {
      // Stop current sound if playing
      await this.stop();

      const sound = this.getSound(soundId);
      if (!sound) {
        console.error(`Sound with id "${soundId}" not found`);
        return;
      }

      // Load and play the sound
      const { sound: audioSound } = await Audio.Sound.createAsync(
        sound.file,
        {
          isLooping: true,
          volume: this.volume,
        }
      );

      this.currentSound = audioSound;
      this.currentSoundId = soundId;
      this.isPlaying = true;

      await this.currentSound.playAsync();
    } catch (error) {
      console.error('Error playing ambient sound:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Stop the currently playing sound
   */
  async stop(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
      this.currentSound = null;
      this.currentSoundId = null;
      this.isPlaying = false;
    }
  }

  /**
   * Pause the currently playing sound
   */
  async pause(): Promise<void> {
    if (this.currentSound && this.isPlaying) {
      try {
        await this.currentSound.pauseAsync();
        this.isPlaying = false;
      } catch (error) {
        console.error('Error pausing sound:', error);
      }
    }
  }

  /**
   * Resume the currently paused sound
   */
  async resume(): Promise<void> {
    if (this.currentSound && !this.isPlaying) {
      try {
        await this.currentSound.playAsync();
        this.isPlaying = true;
      } catch (error) {
        console.error('Error resuming sound:', error);
      }
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentSound) {
      try {
        await this.currentSound.setVolumeAsync(this.volume);
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Check if a sound is currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get the currently playing sound ID
   */
  getCurrentSoundId(): string | null {
    return this.currentSoundId;
  }

  /**
   * Fade volume in over duration (ms)
   */
  async fadeIn(duration: number = 2000): Promise<void> {
    if (!this.currentSound) return;

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = this.volume / steps;

    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      await this.currentSound?.setVolumeAsync(volumeStep * i);
    }
  }

  /**
   * Fade volume out over duration (ms)
   */
  async fadeOut(duration: number = 2000): Promise<void> {
    if (!this.currentSound) return;

    const currentVolume = this.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = currentVolume / steps;

    for (let i = steps; i >= 0; i--) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      await this.currentSound?.setVolumeAsync(volumeStep * i);
    }

    await this.stop();
    // Restore volume for next play
    this.volume = currentVolume;
  }
}

// Export singleton instance
export const ambientSoundService = AmbientSoundService.getInstance();
