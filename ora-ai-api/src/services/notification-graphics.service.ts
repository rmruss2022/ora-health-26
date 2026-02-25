/**
 * Notification Graphics Service
 * Generates beautiful images for notifications using Gemini Imagen
 */

import axios from 'axios';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const GEMINI_API_KEY = 'AIzaSyBxPKRtrxZB-C1yL8kcmU85XtWGN-clc6M';
const GEMINI_IMAGE_API = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generate';

export interface NotificationGraphic {
  type: string;
  path: string;
  url?: string;
}

export class NotificationGraphicsService {
  private assetsDir: string;

  constructor() {
    // For backend, we'll save to a public assets directory
    this.assetsDir = join(__dirname, '../../public/notification-images');
    this.ensureAssetsDirectory();
  }

  /**
   * Ensure assets directory exists
   */
  private ensureAssetsDirectory(): void {
    if (!existsSync(this.assetsDir)) {
      mkdirSync(this.assetsDir, { recursive: true });
      console.log(`📁 Created notification images directory: ${this.assetsDir}`);
    }
  }

  /**
   * Generate weekly planning prompt illustration
   */
  async generateWeeklyPlanningImage(): Promise<NotificationGraphic> {
    const prompt = `Peaceful sunrise over calm waters with subtle golden light rays, minimalist zen aesthetic, 
soft pastel colors (peach, lavender, mint), gentle waves, meditation and mindfulness theme, 
serene and hopeful mood, clean composition, watercolor style, 1:1 aspect ratio, 
perfect for mobile app notification header`;

    return await this.generateImage('weekly-planning', prompt);
  }

  /**
   * Generate end-of-week review celebration image
   */
  async generateWeeklyReviewImage(): Promise<NotificationGraphic> {
    const prompt = `Warm sunset glow with gentle stars beginning to appear, peaceful night sky transitioning, 
soft purple and orange gradients, reflection and gratitude theme, calm achievement feeling, 
minimalist zen aesthetic, watercolor style, serene and contemplative mood, 
1:1 aspect ratio, perfect for mobile app notification`;

    return await this.generateImage('weekly-review', prompt);
  }

  /**
   * Generate achievement unlock graphic
   */
  async generateAchievementImage(achievementType: string): Promise<NotificationGraphic> {
    const prompts: Record<string, string> = {
      meditation_streak: `Glowing lotus flower blooming with soft light particles, 
achievement celebration, zen minimalist style, soft golden glow, peaceful and accomplished mood, 
gradient background with subtle sparkles, 1:1 aspect ratio`,
      
      planning_streak: `Ascending stairway of soft clouds in pastel colors, growth and progress theme, 
minimalist zen aesthetic, gentle rays of light, hopeful and motivating mood, 
watercolor style, 1:1 aspect ratio`,
      
      community_engagement: `Circle of gentle glowing orbs connected by subtle light threads, 
community and connection theme, warm colors, peaceful collaborative energy, 
minimalist zen style, 1:1 aspect ratio`,
    };

    const prompt = prompts[achievementType] || prompts.meditation_streak;
    return await this.generateImage(`achievement-${achievementType}`, prompt);
  }

  /**
   * Generate notification badge icon
   */
  async generateNotificationBadge(badgeType: string): Promise<NotificationGraphic> {
    const prompts: Record<string, string> = {
      new_message: `Simple envelope icon with soft glow, minimalist line art, 
peaceful blue and white colors, clean design, notification style, 1:1 aspect ratio`,
      
      reminder: `Gentle bell with soft ripple waves, minimalist zen style, 
calming colors, simple and clear, notification icon design, 1:1 aspect ratio`,
      
      celebration: `Subtle sparkle or star burst, soft golden light, minimalist celebration, 
zen aesthetic, peaceful joy, 1:1 aspect ratio`,
    };

    const prompt = prompts[badgeType] || prompts.reminder;
    return await this.generateImage(`badge-${badgeType}`, prompt);
  }

  /**
   * Generate mood visualization
   */
  async generateMoodVisualization(mood: string): Promise<NotificationGraphic> {
    const prompts: Record<string, string> = {
      peaceful: `Calm ripples on still water, zen minimalist, soft blues and whites, 
peaceful meditation mood, watercolor style, 1:1 aspect ratio`,
      
      energized: `Gentle sunrise with warm rays, soft orange and yellow gradients, 
energizing yet calm mood, minimalist zen aesthetic, 1:1 aspect ratio`,
      
      reflective: `Soft moonlight on quiet landscape, peaceful night scene, 
contemplative mood, deep blues and purples, minimalist style, 1:1 aspect ratio`,
      
      grateful: `Blooming flowers with soft glow, gratitude and growth theme, 
warm pastel colors, peaceful joy, zen minimalist, 1:1 aspect ratio`,
    };

    const prompt = prompts[mood] || prompts.peaceful;
    return await this.generateImage(`mood-${mood}`, prompt);
  }

  /**
   * Generate seasonal background
   */
  async generateSeasonalBackground(season: string): Promise<NotificationGraphic> {
    const prompts: Record<string, string> = {
      spring: `Cherry blossoms falling gently, soft pink and green colors, 
renewal and growth theme, peaceful spring meditation scene, minimalist zen, 1:1 aspect ratio`,
      
      summer: `Golden sunlight through leaves, warm and peaceful summer day, 
bright but calming colors, zen garden aesthetic, 1:1 aspect ratio`,
      
      autumn: `Falling maple leaves in warm colors, gentle autumn breeze, 
transformation and letting go theme, peaceful meditation mood, 1:1 aspect ratio`,
      
      winter: `Soft snowfall on peaceful landscape, quiet and still winter scene, 
cool blues and whites, meditation and reflection theme, minimalist zen, 1:1 aspect ratio`,
    };

    const prompt = prompts[season] || prompts.spring;
    return await this.generateImage(`seasonal-${season}`, prompt);
  }

  /**
   * Core image generation function
   */
  private async generateImage(
    filename: string,
    prompt: string
  ): Promise<NotificationGraphic> {
    try {
      console.log(`🎨 Generating image: ${filename}...`);

      // Check if image already exists
      const imagePath = join(this.assetsDir, `${filename}.png`);
      if (existsSync(imagePath)) {
        console.log(`✓ Image already exists: ${filename}`);
        return {
          type: filename,
          path: imagePath,
          url: `/notification-images/${filename}.png`,
        };
      }

      // Generate image using Gemini Imagen API
      const response = await axios.post(
        `${GEMINI_IMAGE_API}?key=${GEMINI_API_KEY}`,
        {
          prompt: prompt,
          number_of_images: 1,
          aspect_ratio: '1:1',
          safety_filter_level: 'block_only_high',
          person_generation: 'dont_allow',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      // Extract image data from response
      if (!response.data?.generatedImages?.[0]?.image) {
        throw new Error('No image data in response');
      }

      const imageBase64 = response.data.generatedImages[0].image;
      
      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      writeFileSync(imagePath, imageBuffer);

      console.log(`✅ Generated and saved: ${filename}`);

      return {
        type: filename,
        path: imagePath,
        url: `/notification-images/${filename}.png`,
      };
    } catch (error: any) {
      console.error(`❌ Error generating image ${filename}:`, error.message);
      
      // Return placeholder path on error
      return {
        type: filename,
        path: '',
        url: undefined,
      };
    }
  }

  /**
   * Pre-generate all notification images
   */
  async preGenerateAllImages(): Promise<void> {
    console.log('🎨 Pre-generating all notification images...\n');

    const tasks = [
      // Core notification types
      { name: 'Weekly Planning', fn: () => this.generateWeeklyPlanningImage() },
      { name: 'Weekly Review', fn: () => this.generateWeeklyReviewImage() },
      
      // Achievements
      { name: 'Meditation Streak', fn: () => this.generateAchievementImage('meditation_streak') },
      { name: 'Planning Streak', fn: () => this.generateAchievementImage('planning_streak') },
      { name: 'Community Engagement', fn: () => this.generateAchievementImage('community_engagement') },
      
      // Notification badges
      { name: 'New Message Badge', fn: () => this.generateNotificationBadge('new_message') },
      { name: 'Reminder Badge', fn: () => this.generateNotificationBadge('reminder') },
      { name: 'Celebration Badge', fn: () => this.generateNotificationBadge('celebration') },
      
      // Moods
      { name: 'Peaceful Mood', fn: () => this.generateMoodVisualization('peaceful') },
      { name: 'Energized Mood', fn: () => this.generateMoodVisualization('energized') },
      { name: 'Reflective Mood', fn: () => this.generateMoodVisualization('reflective') },
      { name: 'Grateful Mood', fn: () => this.generateMoodVisualization('grateful') },
      
      // Seasons
      { name: 'Spring Background', fn: () => this.generateSeasonalBackground('spring') },
      { name: 'Summer Background', fn: () => this.generateSeasonalBackground('summer') },
      { name: 'Autumn Background', fn: () => this.generateSeasonalBackground('autumn') },
      { name: 'Winter Background', fn: () => this.generateSeasonalBackground('winter') },
    ];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      console.log(`[${i + 1}/${tasks.length}] ${task.name}...`);
      
      try {
        await task.fn();
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`  ❌ Failed: ${error.message}`);
      }
    }

    console.log('\n✅ Image pre-generation complete!');
  }

  /**
   * Get image URL for a notification type
   */
  getImageUrl(type: string): string {
    return `/notification-images/${type}.png`;
  }
}

// Singleton instance
export const notificationGraphicsService = new NotificationGraphicsService();
