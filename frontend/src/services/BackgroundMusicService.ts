import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

export interface MeditationTrack {
  id: string;
  displayName: string;
  file: any;      // require() asset — used on native
  webPath: string; // relative path for Metro's web asset endpoint
}

// Static requires only — Metro bundler needs literal strings
export const MEDITATION_TRACKS: MeditationTrack[] = [
  { id: 'cascade',          displayName: 'Cascade',          file: require('../../assets/sounds/meditation/cascade.m4a'),          webPath: 'assets/sounds/meditation/cascade.m4a' },
  { id: 'celestial-garden', displayName: 'Celestial Garden', file: require('../../assets/sounds/meditation/celestial-garden.m4a'), webPath: 'assets/sounds/meditation/celestial-garden.m4a' },
  { id: 'embrace',          displayName: 'Embrace',          file: require('../../assets/sounds/meditation/embrace.m4a'),          webPath: 'assets/sounds/meditation/embrace.m4a' },
  { id: 'peaceful-meadow',  displayName: 'Peaceful Meadow',  file: require('../../assets/sounds/meditation/peaceful-meadow.m4a'),  webPath: 'assets/sounds/meditation/peaceful-meadow.m4a' },
];

class BackgroundMusicService {
  private static instance: BackgroundMusicService;

  // Native
  private currentSound: Sound | null = null;
  // Web
  private webAudio: HTMLAudioElement | null = null;

  private currentTrackIndex: number = 0;
  private currentVolume: number = 0;
  private _isPlaying: boolean = false;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private playStateListeners: ((isPlaying: boolean) => void)[] = [];
  // Web: pending track (autoplay blocked or muted — waiting for first user gesture)
  private _pendingWebTrackId: string | null = null;
  // Web: cleanup fn to cancel the pending-unmute interaction listeners
  private _pendingUnmuteCleanup: (() => void) | null = null;

  private constructor() {
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    }
  }

  static getInstance(): BackgroundMusicService {
    if (!BackgroundMusicService.instance) {
      BackgroundMusicService.instance = new BackgroundMusicService();
    }
    return BackgroundMusicService.instance;
  }

  getCurrentTrack(): MeditationTrack {
    return MEDITATION_TRACKS[this.currentTrackIndex];
  }

  getTrackList(): MeditationTrack[] {
    return MEDITATION_TRACKS;
  }

  getIsPlaying(): boolean {
    return this._isPlaying;
  }

  onPlayStateChange(listener: (isPlaying: boolean) => void): () => void {
    this.playStateListeners.push(listener);
    return () => {
      this.playStateListeners = this.playStateListeners.filter((l) => l !== listener);
    };
  }

  private setIsPlaying(value: boolean): void {
    this._isPlaying = value;
    this.playStateListeners.forEach((l) => l(value));
  }

  async play(trackId?: string): Promise<void> {
    try {
      await this._unload();

      let index = this.currentTrackIndex;
      if (trackId) {
        const found = MEDITATION_TRACKS.findIndex((t) => t.id === trackId);
        if (found !== -1) index = found;
      }
      this.currentTrackIndex = index;

      if (Platform.OS === 'web') {
        await this._playWeb(MEDITATION_TRACKS[index]);
      } else {
        await this._playNative(MEDITATION_TRACKS[index]);
      }
    } catch (error) {
      console.error('[BackgroundMusicService] play() error:', error);
    }
  }

  private async _playWeb(track: MeditationTrack): Promise<void> {
    // Metro serves assets at /assets?unstable_path=<relative-path>
    const uri = `${(window as any).location.origin}/assets?unstable_path=${track.webPath}`;

    // Chrome autoplay rules:
    //   <video muted> → allowed to autoplay (silent)
    //   video.muted = false without prior user gesture → Chrome pauses the video
    //
    // Strategy: start the video muted (silent, preloaded), then unmute the moment
    // the user first interacts with the page (any click/touch/key). This makes the
    // audio start *instantly* on first interaction rather than waiting for a load.
    const video = (window as any).document.createElement('video') as HTMLVideoElement;
    video.src = uri;
    video.loop = true;
    video.volume = 0;
    video.muted = true;
    video.style.display = 'none';
    (window as any).document.body.appendChild(video);

    this.webAudio = video as unknown as HTMLAudioElement;
    this.currentVolume = 0;

    try {
      await video.play(); // Succeeds — muted video autoplay is allowed
      // Video is now playing silently. Unmuting requires a user gesture.
      // Register a listener to unmute on the first interaction.
      this._pendingWebTrackId = track.id;
      this._registerWebUnmuteOnInteraction(video);
    } catch (err: any) {
      // Even muted video was blocked (very restrictive env) — retry fully on gesture
      console.warn('[BackgroundMusicService] web autoplay blocked — will retry on first interaction');
      this._pendingWebTrackId = track.id;
      this._registerWebAutoplayRetry();
    }
  }

  // Called when the muted video is playing. Waits for a user gesture, then unmutes
  // and fades in. Uses bubble-phase listeners so React button handlers fire first
  // and can cancel this via _pendingUnmuteCleanup before the document listener fires.
  private _registerWebUnmuteOnInteraction(video: HTMLVideoElement): void {
    const unmute = async () => {
      // Remove all three listeners immediately
      (window as any).document.removeEventListener('click',      unmute);
      (window as any).document.removeEventListener('touchstart', unmute);
      (window as any).document.removeEventListener('keydown',    unmute);
      this._pendingUnmuteCleanup = null;

      // Guard: if already handled (e.g. resume() ran first) or video swapped out
      if (this._isPlaying || this.webAudio !== (video as unknown as HTMLAudioElement)) return;

      this._pendingWebTrackId = null;
      video.muted = false; // Inside user-gesture handler → Chrome allows this
      this.setIsPlaying(true);
      await this.fadeToVolume(0.5, 1500);
    };

    this._pendingUnmuteCleanup = () => {
      (window as any).document.removeEventListener('click',      unmute);
      (window as any).document.removeEventListener('touchstart', unmute);
      (window as any).document.removeEventListener('keydown',    unmute);
      this._pendingUnmuteCleanup = null;
    };

    (window as any).document.addEventListener('click',      unmute);
    (window as any).document.addEventListener('touchstart', unmute);
    (window as any).document.addEventListener('keydown',    unmute);
  }

  // Fallback: even muted video was blocked. Fully re-play on first gesture.
  private _registerWebAutoplayRetry(): void {
    let fired = false;
    const retry = async () => {
      if (fired) return;
      fired = true;
      (window as any).document.removeEventListener('click',      retry);
      (window as any).document.removeEventListener('touchstart', retry);
      (window as any).document.removeEventListener('keydown',    retry);
      if (this._pendingWebTrackId && !this._isPlaying) {
        await this.play(this._pendingWebTrackId);
      }
    };
    (window as any).document.addEventListener('click',      retry);
    (window as any).document.addEventListener('touchstart', retry);
    (window as any).document.addEventListener('keydown',    retry);
  }

  private async _playNative(track: MeditationTrack): Promise<void> {
    const { sound } = await Audio.Sound.createAsync(track.file, {
      isLooping: true,
      volume: 0,
    });
    this.currentSound = sound;
    this.currentVolume = 0;
    await sound.playAsync();
    this.setIsPlaying(true);
    await this.fadeToVolume(0.5, 1500);
  }

  async pause(): Promise<void> {
    if (!this._isPlaying) return;
    this._cancelFade();
    try {
      if (Platform.OS === 'web') {
        this.webAudio?.pause();
      } else {
        await this.currentSound?.pauseAsync();
      }
      this.setIsPlaying(false);
    } catch (error) {
      console.error('[BackgroundMusicService] pause() error:', error);
    }
  }

  async resume(): Promise<void> {
    if (this._isPlaying) return;
    try {
      if (Platform.OS === 'web') {
        if (!this.webAudio) { await this.play(); return; }
        // Cancel the document-level unmute listener — we handle it here directly
        // (this is called from a button press, which is already a user gesture)
        this._pendingUnmuteCleanup?.();
        this._pendingWebTrackId = null;
        const video = this.webAudio as unknown as HTMLVideoElement;
        video.muted = false;
        if (video.paused) await video.play();
        this.setIsPlaying(true);
        await this.fadeToVolume(this.currentVolume > 0 ? this.currentVolume : 0.5, 600);
      } else {
        if (!this.currentSound) { await this.play(); return; }
        await this.currentSound.setVolumeAsync(this.currentVolume > 0 ? this.currentVolume : 0.5);
        await this.currentSound.playAsync();
        this.setIsPlaying(true);
      }
    } catch (error) {
      console.error('[BackgroundMusicService] resume() error:', error);
    }
  }

  async togglePlayPause(): Promise<void> {
    if (this._isPlaying) await this.pause();
    else await this.resume();
  }

  async stop(): Promise<void> {
    try {
      if (this._isPlaying) await this.fadeToVolume(0, 800);
      await this._unload();
    } catch (error) {
      console.error('[BackgroundMusicService] stop() error:', error);
    }
  }

  async next(): Promise<void> {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % MEDITATION_TRACKS.length;
    await this.play();
  }

  async prev(): Promise<void> {
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + MEDITATION_TRACKS.length) % MEDITATION_TRACKS.length;
    await this.play();
  }

  async duckForTTS(): Promise<void> {
    if (this._isPlaying) await this.fadeToVolume(0.15, 600);
  }

  async restoreFromDuck(): Promise<void> {
    if (this._isPlaying) await this.fadeToVolume(0.5, 1200);
  }

  async fadeToVolume(target: number, durationMs: number): Promise<void> {
    this._cancelFade();

    const steps = Math.max(1, Math.round(durationMs / 50));
    const stepMs = durationMs / steps;
    const start = this.currentVolume;
    const delta = target - start;
    let step = 0;

    // Capture references before the interval starts
    const sound = this.currentSound;
    const audio = this.webAudio;

    return new Promise<void>((resolve) => {
      this.fadeInterval = setInterval(async () => {
        step++;
        const vol = Math.max(0, Math.min(1, start + delta * (step / steps)));
        this.currentVolume = vol;
        try {
          if (Platform.OS === 'web') {
            if (audio) audio.volume = vol;
          } else {
            await sound?.setVolumeAsync(vol);
          }
        } catch {
          // sound/audio may have been unloaded mid-fade
        }
        if (step >= steps) {
          this._cancelFade();
          resolve();
        }
      }, stepMs);
    });
  }

  private _cancelFade(): void {
    if (this.fadeInterval !== null) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  private async _unload(): Promise<void> {
    this._cancelFade();
    this._pendingUnmuteCleanup?.(); // cancel any pending unmute listeners
    this._pendingWebTrackId = null;
    if (Platform.OS === 'web') {
      if (this.webAudio) {
        this.webAudio.pause();
        this.webAudio.src = '';
        // Remove the hidden <video> element from the DOM
        const el = this.webAudio as unknown as HTMLElement;
        if (el.parentNode) el.parentNode.removeChild(el);
        this.webAudio = null;
      }
    } else {
      if (this.currentSound) {
        try {
          await this.currentSound.stopAsync();
          await this.currentSound.unloadAsync();
        } catch { /* already unloaded */ }
        this.currentSound = null;
      }
    }
    this.currentVolume = 0;
    this.setIsPlaying(false);
  }
}

export const backgroundMusicService = BackgroundMusicService.getInstance();
