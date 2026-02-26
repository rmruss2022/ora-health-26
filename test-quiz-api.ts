import axios from 'axios';

const API_BASE = 'http://localhost:3000';
const TEST_USER_ID = 'test-user-' + Date.now();

async function testQuizAPI() {
  console.log('🧪 Testing Daily Quiz API\n');

  try {
    // Test 1: Get today's quiz
    console.log('1️⃣ Testing GET /api/quiz/daily...');
    const quizResponse = await axios.get(`${API_BASE}/api/quiz/daily`);
    console.log('✅ Today\'s quiz retrieved');
    console.log(`   Quiz ID: ${quizResponse.data.id}`);
    console.log(`   Date: ${quizResponse.data.quiz_date}`);
    console.log(`   Questions: ${quizResponse.data.questions.questions.length}`);
    console.log();

    const quizId = quizResponse.data.id;

    // Test 2: Submit quiz response
    console.log('2️⃣ Testing POST /api/quiz/responses...');
    const answers = {
      mood: 4,
      energy: 3,
      sleep: 5,
      stress: 2,
      intention: ['peace', 'growth'],
      gratitude: 'Testing the quiz system!',
    };

    const submitResponse = await axios.post(`${API_BASE}/api/quiz/responses`, {
      userId: TEST_USER_ID,
      quizId: quizId,
      answers: answers,
      timeTakenSeconds: 120,
    });

    console.log('✅ Quiz response submitted');
    console.log(`   Response ID: ${submitResponse.data.response.id}`);
    console.log(`   Insights generated: ${submitResponse.data.insights.length}`);
    if (submitResponse.data.insights.length > 0) {
      submitResponse.data.insights.forEach((insight: any, i: number) => {
        console.log(`   Insight ${i + 1}: ${insight.insight_text}`);
      });
    }
    console.log();

    // Test 3: Get user's response
    console.log('3️⃣ Testing GET /api/quiz/responses/:quizId...');
    const responseData = await axios.get(
      `${API_BASE}/api/quiz/responses/${quizId}`,
      {
        params: { userId: TEST_USER_ID },
      }
    );
    console.log('✅ User response retrieved');
    console.log(`   Mood score: ${responseData.data.response.mood_score}`);
    console.log(`   Energy score: ${responseData.data.response.energy_score}`);
    console.log();

    // Test 4: Get streak
    console.log('4️⃣ Testing GET /api/quiz/streak...');
    const streakResponse = await axios.get(`${API_BASE}/api/quiz/streak`, {
      params: { userId: TEST_USER_ID },
    });
    console.log('✅ Streak retrieved');
    console.log(`   Current streak: ${streakResponse.data.current_streak} days`);
    console.log(`   Longest streak: ${streakResponse.data.longest_streak} days`);
    console.log(`   Total completed: ${streakResponse.data.total_completed}`);
    console.log();

    // Test 5: Get history
    console.log('5️⃣ Testing GET /api/quiz/history...');
    const historyResponse = await axios.get(`${API_BASE}/api/quiz/history`, {
      params: { userId: TEST_USER_ID, limit: 10 },
    });
    console.log('✅ History retrieved');
    console.log(`   Total quizzes in history: ${historyResponse.data.length}`);
    console.log();

    // Test 6: Get statistics
    console.log('6️⃣ Testing GET /api/quiz/stats...');
    const statsResponse = await axios.get(`${API_BASE}/api/quiz/stats`, {
      params: { userId: TEST_USER_ID, days: 30 },
    });
    console.log('✅ Statistics retrieved');
    console.log(`   Total quizzes: ${statsResponse.data.total_quizzes}`);
    console.log(`   Avg mood: ${parseFloat(statsResponse.data.avg_mood || 0).toFixed(1)}`);
    console.log(`   Avg energy: ${parseFloat(statsResponse.data.avg_energy || 0).toFixed(1)}`);
    console.log();

    console.log('🎉 All tests passed!');
    console.log('\n📊 Quiz API is fully functional and ready to use.');
  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is running\n');
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the backend server:');
    console.error('   cd ~/Desktop/Feb26/ora-ai-api && npm run dev\n');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testQuizAPI();
  }
}

main();
