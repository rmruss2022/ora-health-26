/**
 * Anonymous Avatar System
 * Generate consistent random animal avatars for anonymous posts
 */

const ANIMAL_AVATARS = [
  '🦊', // Fox
  '🐼', // Panda
  '🐨', // Koala
  '🦝', // Raccoon
  '🦉', // Owl
  '🐰', // Rabbit
  '🦌', // Deer
  '🐧', // Penguin
  '🦋', // Butterfly
  '🐝', // Bee
  '🐢', // Turtle
  '🦆', // Duck
  '🐿️', // Squirrel
  '🦭', // Seal
  '🦦', // Otter
  '🦫', // Beaver
  '🐻', // Bear
  '🦅', // Eagle
  '🦜', // Parrot
  '🐋', // Whale
];

const ANIMAL_NAMES = [
  'Fox',
  'Panda',
  'Koala',
  'Raccoon',
  'Owl',
  'Rabbit',
  'Deer',
  'Penguin',
  'Butterfly',
  'Bee',
  'Turtle',
  'Duck',
  'Squirrel',
  'Seal',
  'Otter',
  'Beaver',
  'Bear',
  'Eagle',
  'Parrot',
  'Whale',
];

/**
 * Generate a consistent random animal avatar based on a seed
 * This ensures the same user gets the same animal for a given post
 * @param seed - Unique identifier (e.g., post ID or user ID)
 * @returns Animal emoji
 */
export const generateAnonymousAvatar = (seed: string): string => {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get index
  const index = Math.abs(hash) % ANIMAL_AVATARS.length;
  return ANIMAL_AVATARS[index];
};

/**
 * Generate a consistent random animal name based on a seed
 * @param seed - Unique identifier
 * @returns Animal name (e.g., "Fox", "Panda")
 */
export const generateAnonymousName = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const index = Math.abs(hash) % ANIMAL_NAMES.length;
  return ANIMAL_NAMES[index];
};

/**
 * Get full anonymous display info
 * @param seed - Unique identifier (post ID recommended)
 * @returns Object with avatar emoji, display name, and label
 */
export const getAnonymousDisplayInfo = (seed: string) => {
  const avatar = generateAnonymousAvatar(seed);
  const animalName = generateAnonymousName(seed);

  return {
    avatar,
    name: `Anonymous ${animalName}`,
    shortName: animalName,
    label: 'Anonymous Supporter',
  };
};

/**
 * Check if a post is anonymous
 * @param isAnonymous - Boolean flag from post data
 * @returns Whether post should display as anonymous
 */
export const isAnonymousPost = (isAnonymous?: boolean): boolean => {
  return isAnonymous === true;
};

/**
 * Get display name for a post author
 * Handles anonymous and regular posts
 */
export const getAuthorDisplayName = (
  authorName: string,
  isAnonymous: boolean,
  postId?: string
): string => {
  if (!isAnonymous) return authorName;
  
  if (postId) {
    const { name } = getAnonymousDisplayInfo(postId);
    return name;
  }
  
  return 'Anonymous Supporter';
};

/**
 * Get avatar for a post author
 * Handles anonymous and regular posts
 */
export const getAuthorAvatar = (
  authorAvatar: string,
  isAnonymous: boolean,
  postId?: string
): string => {
  if (!isAnonymous) return authorAvatar;
  
  if (postId) {
    return generateAnonymousAvatar(postId);
  }
  
  return '🎭'; // Default mask emoji
};
