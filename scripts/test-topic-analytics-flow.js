const http = require('http');

function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path: `/api${path}`,
        method: 'POST',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 400) {
              reject(new Error(`[${res.statusCode}] ` + (parsed.message || body)));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            resolve(body);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function patch(path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path: `/api${path}`,
        method: 'PATCH',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 400) {
              reject(new Error(`[${res.statusCode}] ` + (parsed.message || body)));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            resolve(body);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path: `/api${path}`,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 400) {
              reject(new Error(`[${res.statusCode}] ` + (parsed.message || body)));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            resolve(body);
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('🧪 Starting Phase 4 Topic-Wise Weakness & Analytics Verification...\n');

  try {
    // 1. Login as Admin
    console.log('1️⃣ Logging in as Admin...');
    const adminLogin = await post('/auth/login', {
      email: 'admin@examplatform.local',
      password: 'AdminPassword123!',
    });
    const adminToken = adminLogin.accessToken;
    console.log('   ✅ Admin logged in successfully.');

    // 2. Login as Teacher
    console.log('\n2️⃣ Logging in as Teacher...');
    const teacherLogin = await post('/auth/login', {
      email: 't_alan@stanford.io',
      password: 'Password123!',
    });
    const teacherToken = teacherLogin.accessToken;
    console.log('   ✅ Teacher authenticated.');

    // 3. Create Topics: Algebra (Topic A), Calculus (Topic B), Geometry (Topic C)
    console.log('\n3️⃣ Setting up test Topics...');
    const topicA = await post('/topics', { name: `Algebra Test ${Date.now()}` }, teacherToken).catch(async () => {
      const topics = await get('/topics', teacherToken);
      return topics[0];
    });
    const topicB = await post('/topics', { name: `Calculus Test ${Date.now()}` }, teacherToken).catch(async () => {
      const topics = await get('/topics', teacherToken);
      return topics[1] || topics[0];
    });
    console.log(`   ✅ Topics ready: "${topicA.name}" & "${topicB.name}".`);

    // 4. Create an Exam with 4 tagged questions
    // Topic A has 2 questions: Q1 (10 pts), Q2 (10 pts) -> total 20 pts
    // Topic B has 2 questions: Q3 (10 pts), Q4 (10 pts) -> total 20 pts
    console.log('\n4️⃣ Creating Test Exam with topic-tagged questions...');
    const exam = await post(
      '/exams',
      {
        title: `Topic Analytics Validation Exam ${Date.now()}`,
        durationMinutes: 30,
        isPublished: true,
      },
      teacherToken
    );

    // Q1 in Topic A (Correct Answer: "A")
    const q1 = await post(
      '/questions',
      {
        examId: exam.id,
        topicId: topicA.id,
        text: 'Algebra Q1: Solve 2x + 4 = 10',
        type: 'MCQ',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        difficulty: 'EASY',
        points: 10,
        orderIndex: 1,
      },
      teacherToken
    );

    // Q2 in Topic A (Correct Answer: "B")
    const q2 = await post(
      '/questions',
      {
        examId: exam.id,
        topicId: topicA.id,
        text: 'Algebra Q2: Solve x^2 = 16',
        type: 'MCQ',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'B',
        difficulty: 'MEDIUM',
        points: 10,
        orderIndex: 2,
      },
      teacherToken
    );

    // Q3 in Topic B (Correct Answer: "C")
    const q3 = await post(
      '/questions',
      {
        examId: exam.id,
        topicId: topicB.id,
        text: 'Calculus Q3: Derivative of x^2',
        type: 'MCQ',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'C',
        difficulty: 'MEDIUM',
        points: 10,
        orderIndex: 3,
      },
      teacherToken
    );

    // Q4 in Topic B (Correct Answer: "D")
    const q4 = await post(
      '/questions',
      {
        examId: exam.id,
        topicId: topicB.id,
        text: 'Calculus Q4: Integral of 1 dx',
        type: 'MCQ',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'D',
        difficulty: 'HARD',
        points: 10,
        orderIndex: 4,
      },
      teacherToken
    );

    console.log('   ✅ Exam & 4 questions created across 2 topics.');

    // Publish exam
    await patch(`/exams/${exam.id}/publish`, { isPublished: true }, teacherToken);
    console.log('   ✅ Exam published successfully.');

    // 5. Login as Student
    console.log('\n5️⃣ Logging in as Student...');
    const studentLogin = await post('/auth/login', {
      email: 's_john@stanford.io',
      password: 'Password123!',
    });
    const studentToken = studentLogin.accessToken;
    console.log('   ✅ Student authenticated.');

    // 6. Start Attempt
    console.log('\n6️⃣ Starting student attempt...');
    const attemptDetail = await post('/attempts/start', { examId: exam.id }, studentToken);
    const attemptId = attemptDetail.attempt.id;
    console.log(`   ✅ Attempt started with ID: ${attemptId}`);

    // 7. Submit Answers:
    // Topic A (Algebra): Q1 answered "A" (Correct, 10/10), Q2 answered "B" (Correct, 10/10) -> Expected Topic A: 100% (MASTERED)
    // Topic B (Calculus): Q3 answered "A" (Incorrect, 0/10), Q4 unanswered -> Expected Topic B: 0% (NEEDS_FOCUS)
    console.log('\n7️⃣ Submitting answers for topic calculation testing...');
    await post(`/attempts/${attemptId}/answers`, { questionId: q1.id, selectedAnswer: 'A' }, studentToken);
    await post(`/attempts/${attemptId}/answers`, { questionId: q2.id, selectedAnswer: 'B' }, studentToken);
    await post(`/attempts/${attemptId}/answers`, { questionId: q3.id, selectedAnswer: 'A' }, studentToken); // Wrong answer
    // Q4 left unanswered

    // 8. Submit Attempt
    console.log('\n8️⃣ Submitting final attempt...');
    const submitResult = await post(`/attempts/${attemptId}/submit`, {}, studentToken);
    console.log('   ✅ Attempt sealed and submitted.');

    // 9. Fetch and verify topic analytics
    console.log('\n9️⃣ Validating Topic Weakness & Strength Breakdown...');
    const analytics = await get(`/analytics/attempts/${attemptId}/topics`, studentToken);

    console.log('   Overall Score:', `${analytics.overallScore} / ${analytics.overallTotalPoints} (${analytics.overallPercentage}%)`);
    console.log('   Topic Breakdown:');
    analytics.topics.forEach((t) => {
      console.log(`     - [${t.proficiencyLevel}] ${t.topicName}: ${t.earnedPoints}/${t.totalPoints} pts (${t.percentage}%) | Correct: ${t.correctCount}, Incorrect: ${t.incorrectCount}, Unanswered: ${t.unansweredCount}`);
    });
    console.log('   Identified Strengths:', analytics.strengths);
    console.log('   Identified Weaknesses:', analytics.weaknesses);

    // Assertions
    const topicAStat = analytics.topics.find((t) => t.topicId === topicA.id);
    const topicBStat = analytics.topics.find((t) => t.topicId === topicB.id);

    if (!topicAStat || topicAStat.percentage !== 100 || topicAStat.proficiencyLevel !== 'MASTERED') {
      throw new Error(`Topic A math mismatch! Expected 100% MASTERED, got: ${JSON.stringify(topicAStat)}`);
    }

    if (!topicBStat || topicBStat.percentage !== 0 || topicBStat.proficiencyLevel !== 'NEEDS_FOCUS') {
      throw new Error(`Topic B math mismatch! Expected 0% NEEDS_FOCUS, got: ${JSON.stringify(topicBStat)}`);
    }

    if (!analytics.strengths.includes(topicA.name)) {
      throw new Error(`Expected "${topicA.name}" in strengths list!`);
    }

    if (!analytics.weaknesses.includes(topicB.name)) {
      throw new Error(`Expected "${topicB.name}" in weaknesses list!`);
    }

    console.log('\n🎉 ALL PHASE 4 TOPIC ANALYTICS TESTS PASSED WITH 100% ACCURACY!');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTest();
