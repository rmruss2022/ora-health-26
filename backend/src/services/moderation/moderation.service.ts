/**
 * Content Moderation Service
 * 
 * Multi-layer moderation for community safety:
 * 1. Profanity filter (bad-words library)
 * 2. Pattern-based detection (regex for common issues)
 * 3. Length/spam checks
 * 4. Optional: External API (OpenAI Moderation, Perspective API)
 * 
 * Usage:
 * ```ts
 * const result = await moderationService.moderateText(userContent);
 * if (!result.approved) {
 *   return res.status(400).json({ error: result.reason });
 * }
 * ```
 */

import Filter from 'bad-words';

export interface ModerationResult {
  approved: boolean;
  reason?: string;
  flags: string[];
  confidence: number; // 0-1
  cleanedText?: string;
}

export interface ModerationOptions {
  checkProfanity?: boolean;
  checkSpam?: boolean;
  checkToxicity?: boolean;
  checkPersonalInfo?: boolean;
  autoClean?: boolean; // Replace profanity with asterisks
}

class ModerationService {
  private profanityFilter: Filter;
  private enabled: boolean;

  constructor() {
    this.profanityFilter = new Filter();
    this.enabled = process.env.CONTENT_MODERATION_ENABLED !== 'false';

    // Add custom words to filter if needed
    // this.profanityFilter.addWords('customword1', 'customword2');
  }

  /**
   * Moderate text content
   */
  async moderateText(
    text: string,
    options: ModerationOptions = {}
  ): Promise<ModerationResult> {
    if (!this.enabled) {
      return { approved: true, flags: [], confidence: 1 };
    }

    const {
      checkProfanity = true,
      checkSpam = true,
      checkToxicity = true,
      checkPersonalInfo = true,
      autoClean = false,
    } = options;

    const flags: string[] = [];
    let approved = true;
    let reason: string | undefined;
    let confidence = 1;

    // 1. Check profanity
    if (checkProfanity && this.profanityFilter.isProfane(text)) {
      flags.push('profanity');
      approved = false;
      reason = 'Content contains inappropriate language';
      confidence = 0.9;
    }

    // 2. Check for spam patterns
    if (checkSpam) {
      const spamCheck = this.detectSpam(text);
      if (spamCheck.isSpam) {
        flags.push('spam');
        approved = false;
        reason = spamCheck.reason;
        confidence = Math.min(confidence, spamCheck.confidence);
      }
    }

    // 3. Check for toxic patterns
    if (checkToxicity) {
      const toxicityCheck = this.detectToxicity(text);
      if (toxicityCheck.isToxic) {
        flags.push('toxic');
        approved = false;
        reason = toxicityCheck.reason;
        confidence = Math.min(confidence, toxicityCheck.confidence);
      }
    }

    // 4. Check for personal information
    if (checkPersonalInfo) {
      const piiCheck = this.detectPersonalInfo(text);
      if (piiCheck.hasPII) {
        flags.push('personal_info');
        // Warning, but don't block (user might be sharing intentionally)
        if (!approved) {
          reason = `${reason}; also contains personal information`;
        }
      }
    }

    // 5. Auto-clean if requested and profanity detected
    let cleanedText: string | undefined;
    if (autoClean && flags.includes('profanity')) {
      cleanedText = this.profanityFilter.clean(text);
      // If cleaned, allow it through
      approved = true;
      reason = undefined;
    }

    return {
      approved,
      reason,
      flags,
      confidence,
      cleanedText,
    };
  }

  /**
   * Detect spam patterns
   */
  private detectSpam(text: string): {
    isSpam: boolean;
    reason?: string;
    confidence: number;
  } {
    const lowerText = text.toLowerCase();

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.7 && text.length > 20) {
      return {
        isSpam: true,
        reason: 'Excessive capitalization detected',
        confidence: 0.8,
      };
    }

    // Check for repeated characters
    if (/(.)\1{5,}/.test(text)) {
      return {
        isSpam: true,
        reason: 'Excessive repeated characters',
        confidence: 0.85,
      };
    }

    // Check for excessive emojis
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    if (emojiCount > 20) {
      return {
        isSpam: true,
        reason: 'Excessive emojis',
        confidence: 0.75,
      };
    }

    // Check for suspicious URLs
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlPattern) || [];
    if (urls.length > 5) {
      return {
        isSpam: true,
        reason: 'Excessive links detected',
        confidence: 0.9,
      };
    }

    // Check for common spam phrases
    const spamPhrases = [
      'click here now',
      'limited time offer',
      'act now',
      'free money',
      'work from home',
      'make money fast',
      'buy now',
      'subscribe to my channel',
    ];

    for (const phrase of spamPhrases) {
      if (lowerText.includes(phrase)) {
        return {
          isSpam: true,
          reason: 'Suspected promotional content',
          confidence: 0.7,
        };
      }
    }

    return { isSpam: false, confidence: 1 };
  }

  /**
   * Detect toxic content patterns
   */
  private detectToxicity(text: string): {
    isToxic: boolean;
    reason?: string;
    confidence: number;
  } {
    const lowerText = text.toLowerCase();

    // Check for hate speech patterns
    const hateSpeechPatterns = [
      /\b(hate|kill|die|kys)\s+(you|them|everyone)\b/i,
      /\byou\s+(should|must|need to)\s+die\b/i,
    ];

    for (const pattern of hateSpeechPatterns) {
      if (pattern.test(text)) {
        return {
          isToxic: true,
          reason: 'Content may contain threatening or hateful language',
          confidence: 0.85,
        };
      }
    }

    // Check for harassment patterns
    const harassmentWords = ['idiot', 'stupid', 'loser', 'pathetic', 'worthless'];
    const harassmentCount = harassmentWords.filter((word) =>
      lowerText.includes(word)
    ).length;

    if (harassmentCount >= 2) {
      return {
        isToxic: true,
        reason: 'Content may be harassing or insulting',
        confidence: 0.75,
      };
    }

    return { isToxic: false, confidence: 1 };
  }

  /**
   * Detect personal information (PII)
   */
  private detectPersonalInfo(text: string): {
    hasPII: boolean;
    types: string[];
  } {
    const types: string[] = [];

    // Email addresses
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
      types.push('email');
    }

    // Phone numbers (various formats)
    if (
      /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)
    ) {
      types.push('phone');
    }

    // Credit card numbers (basic pattern)
    if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) {
      types.push('credit_card');
    }

    // SSN (US format)
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
      types.push('ssn');
    }

    // Street addresses (basic pattern)
    if (/\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr)\b/i.test(text)) {
      types.push('address');
    }

    return {
      hasPII: types.length > 0,
      types,
    };
  }

  /**
   * Moderate user profile data
   */
  async moderateProfile(profile: {
    name?: string;
    bio?: string;
    website?: string;
  }): Promise<{ approved: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (profile.name) {
      const nameResult = await this.moderateText(profile.name, {
        checkProfanity: true,
        checkSpam: false,
      });
      if (!nameResult.approved) {
        issues.push('name: ' + nameResult.reason);
      }
    }

    if (profile.bio) {
      const bioResult = await this.moderateText(profile.bio);
      if (!bioResult.approved) {
        issues.push('bio: ' + bioResult.reason);
      }
    }

    if (profile.website) {
      // Basic URL validation
      try {
        new URL(profile.website);
      } catch {
        issues.push('website: Invalid URL format');
      }
    }

    return {
      approved: issues.length === 0,
      issues,
    };
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Add custom words to profanity filter
   */
  addCustomWords(...words: string[]): void {
    this.profanityFilter.addWords(...words);
  }

  /**
   * Remove words from profanity filter
   */
  removeWords(...words: string[]): void {
    this.profanityFilter.removeWords(...words);
  }
}

export const moderationService = new ModerationService();
export default moderationService;
