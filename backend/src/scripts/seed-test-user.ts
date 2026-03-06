/**
 * Seed script — populates mattrussellc@gmail.com with realistic data
 * for ALL AI tool calls including: user_summaries, journal_entries, chat_messages,
 * user_progress, meditation_sessions, letters, inbox_messages, weekly_plan/review,
 * quiz_streaks, quiz_responses, exercise_completions, collective_sessions, community_posts.
 *
 * Run: npx ts-node src/scripts/seed-test-user.ts
 */

import { query, closePool } from '../config/database';

const SEED_EMAIL = 'mattrussellc@gmail.com';

function getMonday(offsetWeeks = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 + offsetWeeks * 7);
  return d.toISOString().split('T')[0];
}

async function seed() {
  console.log('🌱 Seeding data for', SEED_EMAIL, '...\n');

  const userRow = await query(
    `SELECT id, name FROM users WHERE email = $1 AND is_active = true`,
    [SEED_EMAIL]
  );
  const userId = userRow.rows[0]?.id;
  if (!userId) {
    throw new Error(`User not found: ${SEED_EMAIL}. Register first, then run this script.`);
  }
  console.log(`✅ Found user: ${userRow.rows[0]?.name || SEED_EMAIL}\n`);

  // ─── 1. USER SUMMARIES (get_user_summaries, save_user_insight) ─────────────
  await query(`DELETE FROM user_summaries WHERE user_id = $1`, [userId]);
  const summaries = [
    { type: 'personality', text: 'Thoughtful, introspective, values authenticity. Tends to overthink but is self-aware about it. Responds well to gentle reframes and practical next steps. Values morning routines and quiet time.' },
    { type: 'goals', text: 'Improve work-life balance, establish consistent meditation (5x/week), get to bed by 11pm, finish the Q1 project proposal. Wants to be less reactive and more intentional with time.' },
    { type: 'patterns', text: 'Journals when stressed or after breakthroughs. Skips meals when busy → anxiety spikes. Gets outside when mood is low — natural light helps. Reaches for phone when bored or anxious. Breathwork before meetings reduces overwhelm.' },
    { type: 'preferences', text: 'Prefers guided exercises over open-ended prompts. Likes structure and planning. Cooking at home is grounding. Responds well to actionable advice. Values honesty over sugar-coating.' },
  ];
  for (const s of summaries) {
    await query(
      `INSERT INTO user_summaries (user_id, summary_type, summary_text, confidence_score, metadata)
       VALUES ($1, $2, $3, 0.85, '{}')`,
      [userId, s.type, s.text]
    );
  }
  console.log('✅ user_summaries (personality, goals, patterns, preferences)');

  // ─── 2. JOURNAL ENTRIES (get_recent_journal_entries, search_journal_entries) ─
  await query(`DELETE FROM journal_entries WHERE user_id = $1`, [userId]);
  const journalEntries = [
    { daysAgo: 1, content: "Tried the 10-min breathwork before my standup. Actually helped — felt less scattered going in. Need to make this a habit.", mood: 'calm', tags: ['breathwork', 'work', 'routine'], context: 'journal-prompt' },
    { daysAgo: 3, content: "Finally shipped the feature we've been stuck on. Celebrated with a proper dinner instead of eating at my desk. Small win but it mattered.", mood: 'relieved', tags: ['work', 'accomplishment', 'self-care'], context: 'free-form-chat' },
    { daysAgo: 5, content: "Slept terribly again. Woke at 3am and couldn't get back. Going to try no caffeine after 2pm this week.", mood: 'tired', tags: ['sleep', 'habits'], context: 'journal-prompt' },
    { daysAgo: 7, content: "Had the hard conversation with my friend about the thing we've been avoiding. Uncomfortable but necessary. They said they appreciated me bringing it up.", mood: 'vulnerable', tags: ['relationships', 'boundaries', 'communication'], context: 'free-form-chat' },
    { daysAgo: 9, content: "Morning meditation felt different today — actually present instead of going through motions. Maybe the earlier bedtime is helping.", mood: 'peaceful', tags: ['meditation', 'mindfulness', 'sleep'], context: 'journal-prompt' },
    { daysAgo: 11, content: "Phone usage is still out of control. The no-phone-after-9 rule lasted 2 days. Want to try again with a different trigger.", mood: 'reflective', tags: ['habits', 'phone', 'anxiety'], context: 'weekly-review' },
    { daysAgo: 13, content: "Cooked at home 5 nights. Something about making food with my hands is grounding. Need to protect that time.", mood: 'content', tags: ['cooking', 'self-care', 'routine'], context: 'journal-prompt' },
    { daysAgo: 15, content: "Work deadline hit hard. Last two days were rough but breathwork before meetings helped. When I skip meals I get way more anxious — basic stuff but I forget.", mood: 'stressed', tags: ['work', 'stress', 'breathwork', 'meals'], context: 'weekly-review' },
    { daysAgo: 17, content: "Got outside most days. Natural light makes such a difference — mornings outside beat mornings at my desk.", mood: 'balanced', tags: ['outdoors', 'energy', 'routine'], context: 'journal-prompt' },
    { daysAgo: 19, content: "Thinking about the next few months. Less reactive, more intentional. Maybe that starts with protecting morning time.", mood: 'hopeful', tags: ['goals', 'intentions', 'planning'], context: 'weekly-planning' },
  ];
  for (const e of journalEntries) {
    await query(
      `INSERT INTO journal_entries (user_id, content, mood, tags, behavior_context, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, '{}', NOW() - INTERVAL '${e.daysAgo} days')`,
      [userId, e.content, e.mood, e.tags, e.context]
    );
  }
  console.log('✅ journal_entries (10 entries)');

  // ─── 3. CHAT MESSAGES (get_conversation_history) ──────────────────────────
  await query(`DELETE FROM chat_messages WHERE user_id = $1`, [userId]);
  const chatHistory = [
    { role: 'user', content: "Hey, I've been feeling really scattered at work lately. Any ideas?", behaviorId: 'free-form-chat' },
    { role: 'assistant', content: "That sounds frustrating. Scattered energy often shows up when we're juggling too much or when our nervous system is activated. A few things that help: short breathwork before meetings, blocking focus time, and checking if you're skipping meals (that often amplifies anxiety). Want to try a 5-min breathwork together?", behaviorId: 'free-form-chat' },
    { role: 'user', content: "Yeah, the breathwork before standup actually helped today. I'm going to try to make it a habit.", behaviorId: 'free-form-chat' },
    { role: 'assistant', content: "That's a great signal — your body is telling you what works. Small, consistent habits beat big one-off efforts. How did the rest of your day feel after that?", behaviorId: 'free-form-chat' },
  ];
  for (const m of chatHistory) {
    await query(
      `INSERT INTO chat_messages (user_id, role, content, behavior_id, created_at)
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '2 days')`,
      [userId, m.role, m.content, m.behaviorId]
    );
  }
  console.log('✅ chat_messages (conversation history)');

  // ─── 4. USER PROGRESS (get_user_progress) ─────────────────────────────────
  await query(`DELETE FROM user_progress WHERE user_id = $1`, [userId]);
  const progressEntries = [
    { daysAgo: 0, mood: 'calm', notes: 'Good morning. 10 min breathwork before work.' },
    { daysAgo: 1, mood: 'tired', notes: 'Slept poorly. Skipped meditation.' },
    { daysAgo: 2, mood: 'balanced', notes: 'Got outside at lunch. Helped.' },
    { daysAgo: 4, mood: 'anxious', notes: 'Work deadline. Breathwork helped.' },
    { daysAgo: 6, mood: 'content', notes: 'Cooked dinner. Felt grounded.' },
    { daysAgo: 8, mood: 'reflective', notes: 'Weekly review. 7/10 overall.' },
  ];
  for (const p of progressEntries) {
    const d = new Date();
    d.setDate(d.getDate() - p.daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    await query(
      `INSERT INTO user_progress (user_id, check_in_date, mood, notes, created_at)
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${p.daysAgo} days')
       ON CONFLICT (user_id, check_in_date) DO UPDATE SET mood = EXCLUDED.mood, notes = EXCLUDED.notes`,
      [userId, dateStr, p.mood, p.notes]
    );
  }
  console.log('✅ user_progress (6 check-ins)');

  // ─── 5. MEDITATION SESSIONS (get_meditation_sessions) ─────────────────────
  const medRow = await query(`SELECT id FROM meditations LIMIT 1`);
  const meditationId = medRow.rows[0]?.id;
  if (meditationId) {
    await query(`DELETE FROM meditation_sessions WHERE user_id = $1`, [userId]);
    const sessions = [1, 2, 4, 5, 8, 9, 10, 12, 15, 16, 18, 20];
    const durations = [5, 10, 10, 15, 10, 20, 15, 10, 5, 15, 20, 10];
    for (let i = 0; i < sessions.length; i++) {
      const daysAgo = sessions[i];
      const mins = durations[i];
      await query(
        `INSERT INTO meditation_sessions (user_id, meditation_id, started_at, completed_at, duration_completed, created_at)
         VALUES ($1, $2, NOW() - INTERVAL '${daysAgo} days', NOW() - INTERVAL '${daysAgo} days' + INTERVAL '${mins} minutes', $3, NOW() - INTERVAL '${daysAgo} days')`,
        [userId, meditationId, mins]
      );
    }
    console.log('✅ meditation_sessions (12 sessions)');
  } else {
    console.log('⚠️  meditations table empty — skipping meditation_sessions');
  }

  // ─── 6. LETTERS (get_user_letters) ────────────────────────────────────────
  await query(`DELETE FROM letters WHERE recipient_id = $1`, [userId]);
  const letters = [
    { daysAgo: 2, subject: 'A note on your week', body: "You've been showing up for yourself — the breathwork before meetings, the hard conversation with your friend. That takes courage. Remember: progress isn't linear. One rough night doesn't undo the good.", mood: 'encouraging' },
    { daysAgo: 5, subject: 'On protecting morning time', body: "You wrote about wanting less reactive, more intentional days. Morning time is where that starts. Even 10 minutes of stillness before the day claims you can shift everything. You don't have to get it perfect — just start.", mood: 'reflective' },
  ];
  for (const l of letters) {
    await query(
      `INSERT INTO letters (sender_id, recipient_id, subject, body, is_ai_generated, metadata, sent_at, read_at, created_at)
       VALUES (NULL, $1, $2, $3, true, $4, NOW() - INTERVAL '${l.daysAgo} days', NOW() - INTERVAL '${l.daysAgo - 1} days', NOW() - INTERVAL '${l.daysAgo} days')`,
      [userId, l.subject, l.body, JSON.stringify({ mood: l.mood })]
    );
  }
  console.log('✅ letters (2 AI letters)');

  // ─── 7. INBOX MESSAGES (get_inbox_messages, get_weekly_plan, get_weekly_review) ─
  await query(`DELETE FROM inbox_messages WHERE user_id = $1`, [userId]);

  // Weekly plans (ai-tools get_weekly_plan reads from inbox_messages)
  const weekStarts = [getMonday(0), getMonday(-1), getMonday(-2)];
  const planGoals = [
    ['Meditate 5 days', 'In bed by 11pm', 'No phone after 9pm', 'Finish project proposal'],
    ['10 min journaling daily', 'Walk outside each day', 'Cook at home 4x'],
    ['Breathwork before meetings', 'Daily check-in with Ora', 'No skipping meals'],
  ];
  for (let i = 0; i < weekStarts.length; i++) {
    await query(
      `INSERT INTO inbox_messages (user_id, message_type, subject, content, metadata, is_read, created_at)
       VALUES ($1, 'weekly-plan', $2, $3, $4, true, NOW() - INTERVAL '${i * 7} days')`,
      [
        userId,
        `Weekly Plan - Week of ${weekStarts[i]}`,
        `Goals: ${planGoals[i].join(', ')}`,
        JSON.stringify({ week_start: weekStarts[i], goals: planGoals[i], focus_areas: [] }),
      ]
    );
  }

  // Weekly reviews (ai-tools get_weekly_review reads from inbox_messages)
  const reviewData = [
    { week_start: weekStarts[1], rating: 7, highlights: ['Got outside most days', 'Cooked at home 5 nights', 'Had hard conversation with friend'], challenges: ['Phone rule lasted 2 days'], learnings: ['Natural light affects energy more than I thought'] },
    { week_start: weekStarts[2], rating: 6, highlights: ['Delivered project on time', "Didn't catastrophise on feedback"], challenges: ['Sleep was poor', 'Skipped meals'], learnings: ['Skipping meals increases anxiety'] },
  ];
  for (const r of reviewData) {
    await query(
      `INSERT INTO inbox_messages (user_id, message_type, subject, content, metadata, is_read, created_at)
       VALUES ($1, 'weekly-review', $2, $3, $4, true, NOW() - INTERVAL '7 days')`,
      [
        userId,
        `Weekly Review - Week of ${r.week_start}`,
        `Rating: ${r.rating}/10. Highlights: ${r.highlights.join('; ')}`,
        JSON.stringify({
          week_start: r.week_start,
          overall_rating: r.rating,
          highlights: r.highlights,
          challenges: r.challenges,
          learnings: r.learnings,
        }),
      ]
    );
  }

  // Prompt-style inbox message
  await query(
    `INSERT INTO inbox_messages (user_id, message_type, subject, content, metadata, is_read, created_at)
     VALUES ($1, 'prompt', 'What felt most alive this week?', 'Take a moment to reflect: what moment or experience made you feel most alive or present this week?', '{}', false, NOW())`,
    [userId]
  );
  console.log('✅ inbox_messages (weekly-plan, weekly-review, prompt)');

  // ─── 8. WEEKLY_PLANS & WEEKLY_REVIEWS tables (agent-memory, other services) ─
  try {
    await query(`DELETE FROM weekly_reviews WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM weekly_plans WHERE user_id = $1`, [userId]);

    for (let i = 0; i < 3; i++) {
      const ws = getMonday(-i);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const weStr = we.toISOString().split('T')[0];
      await query(
        `INSERT INTO weekly_plans (user_id, week_start_date, intentions, goals, created_at)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${i * 7} days')
         ON CONFLICT (user_id, week_start_date) DO UPDATE SET intentions = EXCLUDED.intentions, goals = EXCLUDED.goals`,
        [userId, ws, `Focus for week of ${ws}`, JSON.stringify(planGoals[i] || [])]
      );
    }
    for (const r of reviewData) {
      await query(
        `INSERT INTO weekly_reviews (user_id, week_start_date, reflection, learnings, wins, challenges, mood_score, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '5 days')
         ON CONFLICT (user_id, week_start_date) DO UPDATE SET reflection = EXCLUDED.reflection, mood_score = EXCLUDED.mood_score`,
        [userId, r.week_start, r.learnings.join('. '), r.learnings.join('. '), r.highlights.join('. '), r.challenges.join('. '), r.rating]
      );
    }
    console.log('✅ weekly_plans & weekly_reviews');
  } catch {
    console.log('⚠️  weekly_plans/weekly_reviews tables may not exist — skipped');
  }

  // ─── 9. AGENT MEMORY CACHE ───────────────────────────────────────────────
  try {
    await query(`DELETE FROM agent_memory_cache WHERE user_id = $1`, [userId]);
    console.log('✅ agent_memory_cache cleared');
  } catch {
    console.log('⚠️  agent_memory_cache table may not exist — skipped');
  }

  // ─── 10. QUIZ STREAK & QUIZ HISTORY (get_quiz_streak, get_quiz_history) ───
  try {
    await query(`DELETE FROM quiz_responses WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM quiz_streaks WHERE user_id = $1`, [userId]);

    // Ensure daily_quizzes exist for recent dates
    const quizDates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const templateRow = await query(`SELECT id FROM quiz_templates WHERE is_active = true LIMIT 1`);
    const templateId = templateRow.rows[0]?.id;

    for (const daysAgo of quizDates) {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const dateStr = d.toISOString().split('T')[0];
      await query(
        `INSERT INTO daily_quizzes (quiz_date, template_id, questions)
         VALUES ($1, $2, '{"questions":[]}'::jsonb)
         ON CONFLICT (quiz_date) DO NOTHING`,
        [dateStr, templateId]
      );
    }

    const quizIds = await query(
      `SELECT id, quiz_date FROM daily_quizzes WHERE quiz_date >= NOW() - INTERVAL '14 days' ORDER BY quiz_date DESC LIMIT 11`
    );

    for (const row of quizIds.rows) {
      const moodScore = [3, 4, 2, 4, 5, 3, 4, 4, 3, 4, 4][quizIds.rows.indexOf(row)] ?? 4;
      const energyScore = [3, 4, 2, 4, 4, 3, 4, 3, 3, 4, 4][quizIds.rows.indexOf(row)] ?? 4;
      await query(
        `INSERT INTO quiz_responses (user_id, quiz_id, answers, mood_score, energy_score, intentions, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${quizIds.rows.indexOf(row)} days')
         ON CONFLICT (user_id, quiz_id) DO UPDATE SET mood_score = EXCLUDED.mood_score, energy_score = EXCLUDED.energy_score`,
        [userId, row.id, JSON.stringify({ mood: moodScore, energy: energyScore }), moodScore, energyScore, ['peace', 'productivity']]
      );
    }

    await query(
      `INSERT INTO quiz_streaks (user_id, current_streak, longest_streak, last_completed_date, total_completed)
       VALUES ($1, 5, 12, CURRENT_DATE, 28)
       ON CONFLICT (user_id) DO UPDATE SET current_streak = 5, longest_streak = 12, last_completed_date = CURRENT_DATE, total_completed = 28`,
      [userId]
    );
    console.log('✅ quiz_streaks & quiz_responses');
  } catch (e) {
    console.log('⚠️  quiz tables may not exist — skipped:', (e as Error).message);
  }

  // ─── 11. EXERCISE COMPLETIONS (get_exercise_completions) ──────────────────
  try {
    const exRows = await query(`SELECT id, title, duration_minutes FROM exercises WHERE is_active = true LIMIT 5`);
    if (exRows.rows.length > 0) {
      await query(`DELETE FROM exercise_completions WHERE user_id = $1`, [userId]);
      const exCompletions = [
        { exerciseId: exRows.rows[0]?.id, daysAgo: 1, duration: 5, rating: 4 },
        { exerciseId: exRows.rows[1]?.id || exRows.rows[0]?.id, daysAgo: 3, duration: 10, rating: 5 },
        { exerciseId: exRows.rows[2]?.id || exRows.rows[0]?.id, daysAgo: 5, duration: 5, rating: 4 },
        { exerciseId: exRows.rows[0]?.id, daysAgo: 7, duration: 10, rating: 4 },
        { exerciseId: exRows.rows[1]?.id || exRows.rows[0]?.id, daysAgo: 9, duration: 15, rating: 5 },
      ];
      for (const c of exCompletions) {
        await query(
          `INSERT INTO exercise_completions (user_id, exercise_id, started_at, completed_at, duration_seconds, rating)
           VALUES ($1, $2, NOW() - INTERVAL '${c.daysAgo} days', NOW() - INTERVAL '${c.daysAgo} days' + INTERVAL '${c.duration} minutes', $3, $4)`,
          [userId, c.exerciseId, c.duration * 60, c.rating]
        );
      }
      console.log('✅ exercise_completions (5)');
    } else {
      console.log('⚠️  exercises table empty — skipping exercise_completions');
    }
  } catch (e) {
    console.log('⚠️  exercise_completions may not exist — skipped:', (e as Error).message);
  }

  // ─── 12. COLLECTIVE SESSIONS (get_upcoming_collective_sessions) ───────────
  try {
    const upcomingCheck = await query(
      `SELECT id FROM collective_sessions WHERE started_at IS NULL AND scheduled_time > NOW() LIMIT 1`
    );
    if (upcomingCheck.rows.length === 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      dayAfter.setHours(19, 0, 0, 0);
      await query(
        `INSERT INTO collective_sessions (scheduled_time, duration_minutes)
         VALUES ($1, 15), ($2, 20)`,
        [tomorrow.toISOString(), dayAfter.toISOString()]
      );
      console.log('✅ collective_sessions (2 upcoming)');
    } else {
      console.log('✅ collective_sessions (already has upcoming)');
    }
  } catch (e) {
    console.log('⚠️  collective_sessions may not exist — skipped:', (e as Error).message);
  }

  // ─── 13. COMMUNITY POSTS (get_user_community_posts) ───────────────────────
  try {
    await query(`DELETE FROM community_posts WHERE user_id = $1`, [userId]);
    const userRow = await query(`SELECT name FROM users WHERE id = $1`, [userId]);
    const userName = userRow.rows[0]?.name || 'Matt';

    const posts = [
      { type: 'progress', category: 'progress', content: 'Completed 5 days of morning breathwork. Feeling more grounded before work.', daysAgo: 2 },
      { type: 'gratitude', category: 'gratitude', content: 'Grateful for the hard conversation I had with my friend. Uncomfortable but necessary.', daysAgo: 5 },
      { type: 'prompt', category: 'prompt', content: 'What felt most alive this week? Cooking at home 5 nights. Something about making food with my hands is grounding.', daysAgo: 8 },
    ];
    for (const p of posts) {
      await query(
        `INSERT INTO community_posts (user_id, type, category, content, author_name, author_avatar, is_anonymous, likes_count, comments_count, created_at)
         VALUES ($1, $2, $3, $4, $5, '👤', false, $6, $7, NOW() - INTERVAL '${p.daysAgo} days')`,
        [userId, p.type, p.category, p.content, userName, Math.floor(Math.random() * 5), Math.floor(Math.random() * 3)]
      );
    }
    console.log('✅ community_posts (3)');
  } catch (e) {
    console.log('⚠️  community_posts may not exist — skipped:', (e as Error).message);
  }

  console.log('\n🎉 Done!', SEED_EMAIL, 'now has:');
  console.log('  • user_summaries (personality, goals, patterns, preferences)');
  console.log('  • journal_entries (10)');
  console.log('  • chat_messages (conversation history)');
  console.log('  • user_progress (6 check-ins)');
  console.log('  • meditation_sessions (12)');
  console.log('  • letters (2 AI letters)');
  console.log('  • inbox_messages (weekly-plan, weekly-review, prompt)');
  console.log('  • weekly_plans & weekly_reviews');
  console.log('  • quiz_streaks & quiz_responses');
  console.log('  • exercise_completions');
  console.log('  • collective_sessions (upcoming)');
  console.log('  • community_posts');
  console.log('\nAsk Ora about your journal, week, letters, progress, quiz streak, exercises, or community posts.');

  await closePool();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
