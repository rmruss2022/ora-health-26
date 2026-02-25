// Generate AI Agent Personality Avatars using Gemini Imagen
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = 'AIzaSyBxPKRtrxZB-C1yL8kcmU85XtWGN-clc6M';
const IMAGEN_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict';
const OUTPUT_DIR = path.join(__dirname, '../ora-ai/assets/agents');

// Agent avatar prompts
const agentPrompts = [
  {
    id: 'luna',
    name: 'Luna',
    prompt: 'Minimalist circular avatar icon of a serene crescent moon with soft glow, gentle purple and blue gradient, peaceful meditation aesthetic, simple clean design, transparent background, 512x512'
  },
  {
    id: 'kai',
    name: 'Kai',
    prompt: 'Minimalist circular avatar icon of an energetic flame or sunrise, warm orange and red gradient, dynamic and motivating aesthetic, simple clean design, transparent background, 512x512'
  },
  {
    id: 'sage',
    name: 'Sage',
    prompt: 'Minimalist circular avatar icon of a wise owl with knowing eyes, earthy green and brown tones, calm wisdom aesthetic, simple clean design, transparent background, 512x512'
  },
  {
    id: 'river',
    name: 'River',
    prompt: 'Minimalist circular avatar icon of flowing water waves, playful blue and teal gradient, joyful movement aesthetic, simple clean design, transparent background, 512x512'
  },
  {
    id: 'sol',
    name: 'Sol',
    prompt: 'Minimalist circular avatar icon of a warm radiating sun, golden yellow and warm pink gradient, compassionate warmth aesthetic, simple clean design, transparent background, 512x512'
  }
];

async function generateAvatar(id: string, name: string, prompt: string) {
  try {
    console.log(`\n🎨 Generating avatar for ${name}...`);
    
    const response = await axios.post(
      `${IMAGEN_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        instances: [
          {
            prompt: prompt
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          safetyFilterLevel: 'block_only_high',
          personGeneration: 'allow_adult'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract base64 image
    if (response.data && response.data.predictions && response.data.predictions[0]) {
      const imageData = response.data.predictions[0].bytesBase64Encoded;
      
      // Create output directory if it doesn't exist
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }

      // Save as PNG
      const outputPath = path.join(OUTPUT_DIR, `${id}-avatar.png`);
      fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
      
      console.log(`✅ Saved ${name} avatar to: ${outputPath}`);
      return outputPath;
    } else {
      console.error(`❌ No image data received for ${name}`);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ Error generating avatar for ${name}:`, error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('🎨 Starting AI Agent Avatar Generation...\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  for (const agent of agentPrompts) {
    await generateAvatar(agent.id, agent.name, agent.prompt);
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n✨ Avatar generation complete!');
}

main().catch(console.error);
