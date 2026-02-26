/**
 * Accessibility Utilities
 * Helper functions and constants for WCAG AA compliance
 */

/**
 * Create accessible label combining multiple text elements
 */
export const createAccessibilityLabel = (...parts: (string | undefined)[]): string => {
  return parts.filter(Boolean).join(', ');
};

/**
 * Common accessibility hints for interactions
 */
export const AccessibilityHints = {
  DOUBLE_TAP_TO_ACTIVATE: 'Double tap to activate',
  DOUBLE_TAP_TO_OPEN: 'Double tap to open',
  DOUBLE_TAP_TO_SELECT: 'Double tap to select',
  DOUBLE_TAP_TO_SEND: 'Double tap to send',
  SWIPE_TO_DISMISS: 'Swipe up or down to dismiss',
  PULL_TO_REFRESH: 'Pull down to refresh content',
  TAP_TO_EDIT: 'Double tap to edit',
  TAP_TO_DELETE: 'Double tap to delete',
};

/**
 * Common accessibility roles
 */
export const AccessibilityRoles = {
  BUTTON: 'button' as const,
  HEADER: 'header' as const,
  LINK: 'link' as const,
  SEARCH: 'search' as const,
  IMAGE: 'image' as const,
  TEXT: 'text' as const,
  ADJUSTABLE: 'adjustable' as const,
  IMAGE_BUTTON: 'imagebutton' as const,
  CHECKBOX: 'checkbox' as const,
  RADIO: 'radio' as const,
  SWITCH: 'switch' as const,
};

/**
 * Semantic importance levels for announcements
 */
export const AccessibilityLiveRegion = {
  POLITE: 'polite' as const,
  ASSERTIVE: 'assertive' as const,
  NONE: 'none' as const,
};

/**
 * Check if color contrast meets WCAG AA standards
 * Returns true if contrast ratio is sufficient
 */
export const meetsContrastRatio = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  // This is a simplified version
  // In production, use a proper color contrast library like 'color-contrast-checker'
  const requiredRatio = isLargeText ? 3 : 4.5;
  // TODO: Implement actual contrast calculation
  return true; // Placeholder
};

/**
 * Format time duration for accessibility
 * @example formatDurationForA11y(125) => "2 minutes and 5 seconds"
 */
export const formatDurationForA11y = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  const parts: string[] = [];
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  if (secs > 0) {
    parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
  }
  
  return parts.join(' and ') || '0 seconds';
};

/**
 * Format number for accessibility
 * @example formatNumberForA11y(1234) => "1 thousand 2 hundred 34"
 */
export const formatNumberForA11y = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 10000) return `${(num / 1000).toFixed(1)} thousand`;
  if (num < 1000000) return `${Math.floor(num / 1000)} thousand`;
  return `${(num / 1000000).toFixed(1)} million`;
};

/**
 * Mark element as decorative (should be ignored by screen readers)
 */
export const markAsDecorative = () => ({
  accessible: false,
  importantForAccessibility: 'no-hide-descendants' as const,
});

/**
 * Common loading state accessibility props
 */
export const getLoadingA11yProps = (isLoading: boolean) => ({
  accessibilityLabel: isLoading ? 'Loading content' : undefined,
  accessibilityLiveRegion: isLoading ? AccessibilityLiveRegion.POLITE : undefined,
  accessibilityState: { busy: isLoading },
});

/**
 * Button accessibility props generator
 */
export const getButtonA11yProps = (
  label: string,
  hint?: string,
  disabled: boolean = false
) => ({
  accessibilityRole: AccessibilityRoles.BUTTON,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: { disabled },
});

/**
 * Header accessibility props generator
 */
export const getHeaderA11yProps = (text: string, level: 1 | 2 | 3 = 1) => ({
  accessibilityRole: AccessibilityRoles.HEADER,
  accessibilityLabel: text,
  // @ts-ignore - accessibilityLevel is iOS only
  accessibilityLevel: level,
});
