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

async function run() {
  console.log('====================================================');
  console.log('🧪 Phase 6 Test: Teacher Live Polling Monitor Dashboard');
  console.log('====================================================\n');

  const ts = Date.now();

  // 1. Authenticate Teacher
  console.log('1️⃣ Logging in as Teacher...');
  const teacherLogin = await post('/auth/login', {
    email: 't_alan@stanford.io',
    password: 'Password123!',
  });
  const teacherToken = teacherLogin.accessToken;
  console.log('   ✅ Teacher authenticated.');

  // 2. Create and publish test exam with multiple questions
  console.log('2️⃣ Creating and publishing live monitored assessment...');
  const exam = await post(
    '/exams',
    {
      title: `Live Monitor Real-Time Exam ${ts}`,
      description: 'Testing polling endpoints and real-time student tracking',
      durationMinutes: 45,
    },
    teacherToken
  );

  const q1 = await post(
    '/questions',
    {
      examId: exam.id,
      text: 'What is polling in web application architecture?',
      type: 'MCQ',
      options: ['Periodic HTTP requests', 'Direct memory access', 'Satellite uplink', 'None'],
      correctAnswer: 'Periodic HTTP requests',
      points: 10,
      orderIndex: 0,
    },
    teacherToken
  );

  const q2 = await post(
    '/questions',
    {
      examId: exam.id,
      text: 'Which React hook manages background intervals effectively?',
      type: 'MCQ',
      options: ['usePolling / setInterval', 'useRef only', 'useLayoutEffect', 'none'],
      correctAnswer: 'usePolling / setInterval',
      points: 10,
      orderIndex: 1,
    },
    teacherToken
  );

  await patch(`/exams/${exam.id}/publish`, { isPublished: true }, teacherToken);
  console.log(`   ✅ Exam published: "${exam.title}" (ID: ${exam.id})`);

  // 3. Authenticate Students
  console.log('\n3️⃣ Authenticating 2 students...');
  const stu1Login = await post('/auth/login', {
    email: 's_john@stanford.io',
    password: 'Password123!',
  });
  const stu1Token = stu1Login.accessToken;

  const stu2Login = await post('/auth/login', {
    email: 's_claude@stanford.io',
    password: 'Password123!',
  });
  const stu2Token = stu2Login.accessToken;
  console.log('   ✅ Students authenticated (John & Claude).');

  // 4. Student 1 starts exam, answers Q1, and triggers tab switch flag
  console.log('\n4️⃣ Student 1 (John) starts exam and triggers integrity flag...');
  const att1 = await post('/attempts/start', { examId: exam.id }, stu1Token);
  await post(`/attempts/${att1.attempt.id}/answers`, {
    questionId: q1.id,
    selectedAnswer: 'Periodic HTTP requests',
    timeSpentSeconds: 30,
    changeCount: 1,
  }, stu1Token);

  await post('/integrity/flags', {
    attemptId: att1.attempt.id,
    flagType: 'TAB_SWITCH',
    details: { switchCount: 1, detectedAt: new Date().toISOString() },
  }, stu1Token);
  console.log('   ✅ John is IN_PROGRESS with 1 flag.');

  // 5. Student 2 starts exam, answers both questions, and submits
  console.log('\n5️⃣ Student 2 (Claude) completes test and submits...');
  const att2 = await post('/attempts/start', { examId: exam.id }, stu2Token);
  await post(`/attempts/${att2.attempt.id}/answers`, {
    questionId: q1.id,
    selectedAnswer: 'Periodic HTTP requests',
    timeSpentSeconds: 20,
  }, stu2Token);
  await post(`/attempts/${att2.attempt.id}/answers`, {
    questionId: q2.id,
    selectedAnswer: 'usePolling / setInterval',
    timeSpentSeconds: 25,
  }, stu2Token);

  const submitRes = await post(`/attempts/${att2.attempt.id}/submit`, {}, stu2Token);
  console.log(`   ✅ Claude finalized exam (Score: ${submitRes.score}/${submitRes.totalPoints} pts, ${submitRes.percentage}%).`);

  // 6. Teacher polls live monitor endpoint
  console.log('\n6️⃣ Teacher polling Live Monitor API endpoint: /api/dashboard/exam/:id/live-monitor ...');
  const monitorData = await get(`/dashboard/exam/${exam.id}/live-monitor`, teacherToken);

  console.log('\n📊 Live Monitor Polled Response:');
  console.log(`   Total Students:          ${monitorData.stats.totalStudents}`);
  console.log(`   Active in-progress:      ${monitorData.stats.activeCount}`);
  console.log(`   Submitted count:         ${monitorData.stats.submittedCount}`);
  console.log(`   Flagged integrity count: ${monitorData.stats.flaggedCount}`);
  console.log(`   Average Score:           ${monitorData.stats.averageScore} pts`);
  console.log(`   Average Progress:        ${monitorData.stats.averageProgressPercent}%`);

  // Validations
  if (monitorData.stats.totalStudents !== 2) {
    throw new Error(`Expected totalStudents 2, got ${monitorData.stats.totalStudents}`);
  }
  if (monitorData.stats.activeCount !== 1) {
    throw new Error(`Expected activeCount 1, got ${monitorData.stats.activeCount}`);
  }
  if (monitorData.stats.submittedCount !== 1) {
    throw new Error(`Expected submittedCount 1, got ${monitorData.stats.submittedCount}`);
  }
  if (monitorData.stats.flaggedCount !== 1) {
    throw new Error(`Expected flaggedCount 1, got ${monitorData.stats.flaggedCount}`);
  }

  const john = monitorData.students.find((s) => s.studentEmail === 's_john@stanford.io');
  const claude = monitorData.students.find((s) => s.studentEmail === 's_claude@stanford.io');

  if (!john || john.status !== 'IN_PROGRESS' || !john.isFlagged || john.flagsCount !== 1) {
    throw new Error('John status/flag assertion failed');
  }
  if (!claude || (claude.status !== 'SUBMITTED' && claude.status !== 'GRADED') || claude.score !== 20) {
    throw new Error('Claude status/score assertion failed');
  }

  console.log('\n====================================================');
  console.log('🎉 Phase 6 Live Polling Monitor Dashboard Checkpoint PASSED!');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('❌ Phase 6 Live Monitor Test FAILED:', err);
  process.exit(1);
});
