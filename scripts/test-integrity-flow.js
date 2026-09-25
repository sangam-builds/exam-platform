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
  console.log('🛡️ Starting Phase 5 Behavioral Analytics & Anti-Cheating Verification...\n');

  try {
    // 1. Login as Teacher
    console.log('1️⃣ Logging in as Teacher...');
    const teacherLogin = await post('/auth/login', {
      email: 't_alan@stanford.io',
      password: 'Password123!',
    });
    const teacherToken = teacherLogin.accessToken;
    console.log('   ✅ Teacher authenticated.');

    // 2. Create and publish test exam
    console.log('\n2️⃣ Creating and publishing exam...');
    const exam = await post(
      '/exams',
      {
        title: `Anti-Cheating Integrity Validation Exam ${Date.now()}`,
        durationMinutes: 45,
      },
      teacherToken
    );

    const question = await post(
      '/questions',
      {
        examId: exam.id,
        text: 'Integrity Question: Is exam cheating monitored in real time?',
        type: 'MCQ',
        options: ['Yes', 'No', 'Maybe', 'Never'],
        correctAnswer: 'Yes',
        points: 5,
        orderIndex: 1,
      },
      teacherToken
    );

    await patch(`/exams/${exam.id}/publish`, { isPublished: true }, teacherToken);
    console.log('   ✅ Exam published successfully.');

    // 3. Login as Student
    console.log('\n3️⃣ Logging in as Student...');
    const studentLogin = await post('/auth/login', {
      email: 's_john@stanford.io',
      password: 'Password123!',
    });
    const studentToken = studentLogin.accessToken;
    console.log('   ✅ Student authenticated.');

    // 4. Start Student Attempt
    console.log('\n4️⃣ Starting student attempt...');
    const attemptDetail = await post('/attempts/start', { examId: exam.id }, studentToken);
    const attemptId = attemptDetail.attempt.id;
    console.log(`   ✅ Attempt started with ID: ${attemptId}`);

    // 5. Simulate student answering with behavioral time spent and change counts
    console.log('\n5️⃣ Submitting answer with behavioral metrics (time-spent & change counts)...');
    await post(
      `/attempts/${attemptId}/answers`,
      {
        questionId: question.id,
        selectedAnswer: 'Yes',
        timeSpentSeconds: 15,
        changeCount: 2,
      },
      studentToken
    );
    console.log('   ✅ Answer saved with behavioral analytics.');

    // 6. Simulate deliberate tab switch incidents from student browser
    console.log('\n6️⃣ Simulating Tab Switch incidents (Anti-Cheating detection)...');
    const flag1 = await post(
      '/integrity/flags',
      {
        attemptId,
        flagType: 'TAB_SWITCH',
        details: {
          switchCount: 1,
          detectedAt: new Date().toISOString(),
          context: 'User switched to external browser window',
        },
      },
      studentToken
    );
    console.log(`   🚩 Flag #1 recorded: [${flag1.flagType}] by student ${flag1.studentEmail}`);

    const flag2 = await post(
      '/integrity/flags',
      {
        attemptId,
        flagType: 'TAB_SWITCH',
        details: {
          switchCount: 2,
          detectedAt: new Date().toISOString(),
          context: 'Browser lost focus for 8 seconds',
        },
      },
      studentToken
    );
    console.log(`   🚩 Flag #2 recorded: [${flag2.flagType}] by student ${flag2.studentEmail}`);

    // 7. Teacher queries live integrity monitor summary for this exam
    console.log('\n7️⃣ Fetching live exam integrity summary as Teacher...');
    const summary = await get(`/integrity/flags/exam/${exam.id}`, teacherToken);

    console.log(`   Summary: Total Flags = ${summary.totalFlags}, Flagged Students = ${summary.flaggedStudentsCount}`);
    console.log(`   Flags By Type:`, summary.flagsByType);
    console.log(`   Recent Flags Count: ${summary.recentFlags.length}`);

    // Assertions
    if (summary.totalFlags !== 2) {
      throw new Error(`Expected 2 flags, got: ${summary.totalFlags}`);
    }

    if (summary.flaggedStudentsCount !== 1) {
      throw new Error(`Expected 1 flagged student, got: ${summary.flaggedStudentsCount}`);
    }

    if (summary.flagsByType.TAB_SWITCH !== 2) {
      throw new Error(`Expected 2 TAB_SWITCH flags, got: ${summary.flagsByType.TAB_SWITCH}`);
    }

    const firstFlag = summary.recentFlags[0];
    if (!firstFlag.studentEmail || firstFlag.flagType !== 'TAB_SWITCH') {
      throw new Error(`Invalid flag record in recentFlags: ${JSON.stringify(firstFlag)}`);
    }

    // 8. Submit Attempt
    console.log('\n8️⃣ Submitting student attempt...');
    await post(`/attempts/${attemptId}/submit`, {}, studentToken);
    console.log('   ✅ Exam attempt submitted.');

    console.log('\n🎉 ALL PHASE 5 BEHAVIORAL ANALYTICS & ANTI-CHEATING TESTS PASSED WITH 100% PRECISION!');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTest();
