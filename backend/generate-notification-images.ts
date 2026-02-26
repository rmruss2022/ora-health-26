/**
 * Generate all notification images using Gemini Imagen
 * Run this script to pre-generate all notification graphics
 */

import { notificationGraphicsService } from './src/services/notification-graphics.service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🎨 Starting notification image generation...\n');
  console.log('This will generate all notification graphics using Gemini Imagen API');
  console.log('Images will be saved to: public/notification-images/\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    await notificationGraphicsService.preGenerateAllImages();
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('\n✨ All notification images generated successfully!');
    console.log('Images are ready to be used in push notifications.');
    console.log('\nYou can now:');
    console.log('1. View them in: public/notification-images/');
    console.log('2. Copy them to frontend: cp public/notification-images/* ~/Desktop/Feb26/ora-ai/assets/notifications/');
    console.log('3. Start the server and they will be served at /notification-images/*\n');
  } catch (error) {
    console.error('\n❌ Error generating images:', error);
    process.exit(1);
  }
}

main();
