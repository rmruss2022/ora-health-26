# Restore Redesigned HomeScreen

The current `ora-ai/src/screens/HomeScreen.tsx` is missing the redesigned components.

## What needs to happen:

1. HomeScreen.tsx should import:
   - RoomCard
   - RoomGrid
   - ParticipantAvatars

2. HomeScreen should render:
   - Streak calendar (existing)
   - Affirmation card (existing)
   - Recommendations section with featured room
   - RoomGrid with 4 themed rooms
   - Solo Sanctuary card
   - Your Meditations list with filter

## Components that exist:
- `/ora-ai/src/components/RoomCard.tsx` ✅
- `/ora-ai/src/components/RoomGrid.tsx` ✅
- `/ora-ai/src/components/ParticipantAvatars.tsx` ✅

## Problem:
Current HomeScreen.tsx (611 lines) is the old "updates" commit version that doesn't use room components.

## Solution:
Rebuild HomeScreen.tsx to match the design in HOME_REDESIGN_COMPLETE.md and use the existing room components.
