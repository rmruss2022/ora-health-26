/**
 * Letters Components
 * 
 * UI components for the Letters feature - thoughtful, asynchronous
 * communication between users and AI agents.
 * 
 * Design Philosophy:
 * - Intimate typography (Sentient font for body text)
 * - Paper-like aesthetics (cream backgrounds, subtle shadows)
 * - Envelope metaphor (sealed → open animations)
 * - Color-coded by sender type (AI = green, User = lavender, System = golden)
 * 
 * Components:
 * - LetterCard: Inbox list item
 * - LetterView: Full letter reading view
 * - EmptyState: No letters placeholder
 */

export { LetterCard } from './LetterCard';
export { LetterView } from './LetterView';
export { EmptyState } from './EmptyState';

// Re-export types
export type { Letter } from './LetterCard';
