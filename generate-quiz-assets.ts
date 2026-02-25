import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = 'AIzaSyBxPKRtrxZB-C1yL8kcmU85XtWGN-clc6M';
const ASSETS_DIR = path.join(process.env.HOME || '', 'Desktop/Feb26/ora-ai/assets/quiz');

interface ImagePrompt {
  name: string;
  prompt: string;
  subfolder: string;
}

const imagePrompts: ImagePrompt[] = [
  // Question backgrounds
  {
    name: 'mood-background.png',
    prompt: 'Soft gradient background with peaceful pastel colors, warm sunrise gradient from coral to soft blue, minimalist abstract design, calming wellness app aesthetic, no text',
    subfolder: 'backgrounds'
  },
  {
    name: 'energy-background.png',
    prompt: 'Vibrant energetic gradient background, warm orange to bright yellow gradient, rays of light, motivational wellness app design, abstract energy waves, no text',
    subfolder: 'backgrounds'
  },
  {
    name: 'sleep-background.png',
    prompt: 'Calm night sky gradient background, deep blue to purple gradient with subtle stars, peaceful dreamy aesthetic, wellness app design, no text',
    subfolder: 'backgrounds'
  },
  {
    name: 'stress-background.png',
    prompt: 'Soothing zen background with gentle waves, soft teal to mint green gradient, peaceful calming design, mindfulness app aesthetic, no text',
    subfolder: 'backgrounds'
  },
  {
    name: 'intention-background.png',
    prompt: 'Uplifting dawn background, soft golden hour glow, warm peach to lavender gradient, hopeful inspiring aesthetic, wellness app design, no text',
    subfolder: 'backgrounds'
  },
  
  // Celebration graphics
  {
    name: 'quiz-complete.png',
    prompt: 'Celebration illustration with confetti and sparkles, colorful joyful design, success achievement graphic, wellness app celebration screen, warm congratulatory feeling, no text',
    subfolder: 'celebrations'
  },
  {
    name: 'streak-milestone.png',
    prompt: 'Achievement badge with glowing effect, golden laurel wreath, streak milestone celebration, inspiring success graphic, wellness app achievement design, no text',
    subfolder: 'celebrations'
  },
  {
    name: 'first-quiz.png',
    prompt: 'Welcome celebration illustration, gentle sparkles and light rays, warm welcoming design, first achievement graphic, wellness app onboarding style, no text',
    subfolder: 'celebrations'
  },
  
  // Progress badges
  {
    name: 'badge-7day.png',
    prompt: 'Seven day streak badge, circular design with number 7, soft green and gold colors, wellness achievement icon, minimalist badge design, no background',
    subfolder: 'badges'
  },
  {
    name: 'badge-30day.png',
    prompt: 'Thirty day streak badge, circular design with number 30, rich blue and gold colors, wellness achievement icon, premium badge design, no background',
    subfolder: 'badges'
  },
  {
    name: 'badge-100day.png',
    prompt: 'One hundred day streak badge, circular design with number 100, purple and gold colors with sparkles, elite achievement icon, prestigious badge design, no background',
    subfolder: 'badges'
  },
  
  // Category icons
  {
    name: 'icon-peace.png',
    prompt: 'Peace dove icon, simple minimal design, soft white bird silhouette, wellness app icon style, calm peaceful aesthetic, transparent background',
    subfolder: 'icons'
  },
  {
    name: 'icon-productivity.png',
    prompt: 'Checkmark with energy rays icon, simple minimal design, green achievement symbol, wellness app icon style, motivational aesthetic, transparent background',
    subfolder: 'icons'
  },
  {
    name: 'icon-connection.png',
    prompt: 'Connected hearts icon, simple minimal design, warm golden color, wellness app icon style, loving connection aesthetic, transparent background',
    subfolder: 'icons'
  },
  {
    name: 'icon-growth.png',
    prompt: 'Sprouting plant seedling icon, simple minimal design, fresh green color, wellness app icon style, growth potential aesthetic, transparent background',
    subfolder: 'icons'
  },
  {
    name: 'icon-rest.png',
    prompt: 'Crescent moon with stars icon, simple minimal design, soft blue and white colors, wellness app icon style, restful peaceful aesthetic, transparent background',
    subfolder: 'icons'
  },
  {
    name: 'icon-joy.png',
    prompt: 'Sparkle star burst icon, simple minimal design, bright yellow and white colors, wellness app icon style, joyful happy aesthetic, transparent background',
    subfolder: 'icons'
  },
];

async function generateImage(prompt: string, name: string, subfolder: string) {
  try {
    console.log(`🎨 Generating ${name}...`);
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generate`,
      {
        prompt: prompt,
        number_of_images: 1,
        aspect_ratio: '1:1',
        safety_filter_level: 'block_some',
        person_generation: 'dont_allow'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        }
      }
    );

    if (response.data.images && response.data.images.length > 0) {
      const imageData = response.data.images[0].image;
      const buffer = Buffer.from(imageData, 'base64');
      
      const outputPath = path.join(ASSETS_DIR, subfolder, name);
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`✅ Saved ${name}`);
      return true;
    } else {
      console.log(`❌ No image generated for ${name}`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Error generating ${name}:`, error.response?.data || error.message);
    return false;
  }
}

async function generateAllAssets() {
  console.log('🚀 Starting quiz asset generation...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const imagePrompt of imagePrompts) {
    const success = await generateImage(
      imagePrompt.prompt,
      imagePrompt.name,
      imagePrompt.subfolder
    );
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n✨ Asset generation complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
}

generateAllAssets();
