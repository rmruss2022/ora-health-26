# Placeholder Sound Files Needed

This directory requires 6 ambient sound files for the meditation feature.

## Required Files

The following files are referenced by the app but need to be added:

1. `rain-ambient-loop.mp3` - Gentle rain sounds
2. `ocean-waves-loop.mp3` - Ocean wave sounds
3. `forest-birds-loop.mp3` - Forest ambience with birds
4. `white-noise-loop.mp3` - White noise for focus
5. `singing-bowls-loop.mp3` - Tibetan singing bowls
6. `stream-water-loop.mp3` - Flowing water sounds

## Temporary Solution

Until actual sound files are added, you can:

1. **Option A**: Download royalty-free sounds from:
   - https://freesound.org (CC0 license)
   - https://zapsplat.com
   - https://www.youtube.com/audiolibrary

2. **Option B**: Create 1-second silent MP3 files as placeholders:
   ```bash
   cd /Users/matthew/Desktop/Feb26/ora-ai/assets/sounds
   
   # Create 1-second silent MP3 (requires ffmpeg)
   ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 -q:a 9 -acodec libmp3lame rain-ambient-loop.mp3
   ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 -q:a 9 -acodec libmp3lame ocean-waves-loop.mp3
   ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 -q:a 9 -acodec libmp3lame forest-birds-loop.mp3
   ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 -q:a 9 -acodec libmp3lame white-noise-loop.mp3
   ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 -q:a 9 -acodec libmp3lame singing-bowls-loop.mp3
   ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 -q:a 9 -acodec libmp3lame stream-water-loop.mp3
   ```

3. **Option C**: Use the same placeholder file for all:
   ```bash
   # Create one placeholder
   ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 1 -q:a 9 -acodec libmp3lame placeholder.mp3
   
   # Copy to all required names
   cp placeholder.mp3 rain-ambient-loop.mp3
   cp placeholder.mp3 ocean-waves-loop.mp3
   cp placeholder.mp3 forest-birds-loop.mp3
   cp placeholder.mp3 white-noise-loop.mp3
   cp placeholder.mp3 singing-bowls-loop.mp3
   cp placeholder.mp3 stream-water-loop.mp3
   ```

## Integration Complete

The code is ready and will work once these audio files are present.

- ✅ AmbientSoundService created
- ✅ AmbientSoundSelector UI component created
- ✅ Integration points identified
- ⏳ Actual audio files needed (placeholder files acceptable for development)

## Next Steps

1. Add audio files to this directory
2. Test audio playback in meditation screens
3. Adjust volume levels if needed
4. Replace with production-quality sounds before launch
