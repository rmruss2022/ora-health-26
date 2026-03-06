/**
 * Seed script — populates a user with realistic data
 * so the AI chat has real context to reference.
 *
 * Run: npx ts-node src/scripts/seed-test-user.ts
 */

import { query, closePool } from '../config/database';

const SEED_EMAIL = 'mattrussellc@gmail.com';

async function seed() {
  console.log('🌱 Seeding user data...\n');

  // 1. Look up user by email
  const userRow = await query(
    `SELECT id, name FROM users WHERE email = $1 AND is_active = true`,
    [SEED_EMAIL]
  );
  const userId = userRow.rows[0]?.id;
  if (!userId) {
    throw new Error(
      `User not found: ${SEED_EMAIL}. Register or log in first, then run this script.`
    );
  }
  console.log(`✅ Found user: ${userRow.rows[0]?.name || SEED_EMAIL}`);

  // 2. Pick a real meditation ID from the DB
  const medRow = await query(`SELECT id FROM meditations LIMIT 1`);
  const meditationId = medRow.rows[0]?.id;
  if (!meditationId) throw new Error('No meditations found in DB — run app first to populate');

  // 3. Meditation sessions — last 3 weeks of practice (duration_completed = minutes)
  const meditationDays = [1, 2, 4, 5, 8, 9, 10, 12, 15, 16, 18, 20, 22, 23];
  const durations = [5, 10, 10, 15, 10, 20, 15, 10, 5, 15, 20, 10, 15, 10];
  for (let i = 0; i < meditationDays.length; i++) {
    const daysAgo = meditationDays[i];
    const mins = durations[i];
    await query(
      `INSERT INTO meditation_sessions (user_id, meditation_id, started_at, completed_at, duration_completed, created_at)
       VALUES ($1, $2, NOW() - INTERVAL '${daysAgo} days', NOW() - INTERVAL '${daysAgo} days' + INTERVAL '${mins} minutes', $3, NOW() - INTERVAL '${daysAgo} days')`,
      [userId, meditationId, mins]
    );
  }
  console.log('✅ Meditation sessions seeded (14 sessions, ~165 total minutes)');

  // 4. Weekly plans — last 3 weeks + current week
  const plans = [
    {
      weekOffset: 0,
      intentions: 'Focus on consistent morning meditation and getting to bed earlier. Want to finish the project proposal at work and spend more quality time offline.',
      goals: JSON.stringify(['Meditate 5 days', 'In bed by 11pm', 'No phone after 9pm', 'Finish work proposal']),
    },
    {
      weekOffset: 7,
      intentions: 'Last week was hectic so this week I want to slow down. Prioritise stillness in the mornings and reconnecting with what matters.',
      goals: JSON.stringify(['10 min journaling daily', 'Walk outside each day', 'Cook at home 4x']),
    },
    {
      weekOffset: 14,
      intentions: 'Big work deadline coming up. Want to stay calm under pressure and not let stress spiral. Use the breathwork exercises.',
      goals: JSON.stringify(['Breathwork before meetings', 'Daily check-in with Ora', 'No skipping meals']),
    },
  ];

  for (const plan of plans) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - plan.weekOffset); // Monday
    const weekStartStr = weekStart.toISOString().split('T')[0];

    await query(
      `INSERT INTO weekly_plans (user_id, week_start_date, intentions, goals, created_at)
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${plan.weekOffset} days')
       ON CONFLICT (user_id, week_start_date) DO UPDATE
         SET intentions = EXCLUDED.intentions, goals = EXCLUDED.goals`,
      [userId, weekStartStr, plan.intentions, plan.goals]
    );
  }
  console.log('✅ Weekly plans seeded');

  // 5. Weekly reviews — last 2 completed weeks
  const reviews = [
    {
      weekOffset: 7,
      reflection: "Slower than I hoped but I actually needed it. Got outside most days which helped a lot with mood.",
      learnings: "I underestimate how much natural light affects my energy. Mornings outside > mornings at my desk.",
      wins: "Cooked at home 5 days, got through a hard conversation with a friend without shutting down.",
      challenges: "Still reaching for my phone too much. The no-phone rule lasted 2 days.",
      mood_score: 7,
    },
    {
      weekOffset: 14,
      reflection: "Work deadline hit hard. Managed to stay mostly calm but the last two days were rough. Breathwork helped more than expected.",
      learnings: "When I skip meals I get way more anxious. Basic stuff but I forget it.",
      wins: "Delivered the project on time. Didn't catastrophise when feedback came in.",
      challenges: "Sleep was poor all week. Everything felt heavier because of it.",
      mood_score: 6,
    },
  ];

  for (const review of reviews) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - review.weekOffset);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    await query(
      `INSERT INTO weekly_reviews (user_id, week_start_date, reflection, learnings, wins, challenges, mood_score, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${review.weekOffset - 4} days')
       ON CONFLICT (user_id, week_start_date) DO UPDATE
         SET reflection = EXCLUDED.reflection, mood_score = EXCLUDED.mood_score,
             learnings = EXCLUDED.learnings, wins = EXCLUDED.wins, challenges = EXCLUDED.challenges`,
      [userId, weekStartStr, review.reflection, review.learnings, review.wins, review.challenges, review.mood_score]
    );
  }
  console.log('✅ Weekly reviews seeded');

  // 6. Clear agent memory cache so fresh data is fetched next request
  await query(
    `DELETE FROM agent_memory_cache WHERE user_id = $1`,
    [userId]
  );
  console.log('✅ Agent memory cache cleared');

  console.log(`\n🎉 Done! ${SEED_EMAIL} now has:`);
  console.log('  • 14 meditation sessions over the past 3 weeks');
  console.log('  • 3 weekly plans (current week + last 2)');
  console.log('  • 2 weekly reviews with mood scores (6-7/10)');
  console.log('\nRestart the server or wait for cache expiry, then ask Ora about your week.');

  await closePool();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
