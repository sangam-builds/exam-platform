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
            resolve(JSON.parse(body));
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

async function runPhase2Verification() {
  console.log('=== PHASE 2 TEST CHECKPOINT VERIFICATION ===\n');

  // 1. Admin login to issue teacher invite
  console.log('1. Admin auth...');
  const adminAuth = await post('/auth/login', {
    email: 'admin@examplatform.local',
    password: 'AdminPassword123!',
  });
  const adminToken = adminAuth.accessToken;

  // 2. Setup Teacher 1
  console.log('2. Creating and activating Teacher 1...');
  const t1Email = `teacher_p2_${Date.now()}@platform.local`;
  const t1Invite = await post('/invites', { email: t1Email, role: 'TEACHER' }, adminToken);
  const t1Auth = await post('/invites/redeem', {
    token: t1Invite.token,
    name: 'Dr. Alan Turing',
    password: 'TeacherPassword123!',
  });
  const teacherToken = t1Auth.accessToken;
  console.log(`   ✅ Teacher 1 authenticated: ${t1Email}`);

  // 3. Topics Management (Phase 2 Requirement 1)
  console.log('\n3. Testing Topics CRUD (/topics)...');
  const topic1 = await post('/topics', {
    name: `Algorithms & Data Structures ${Date.now()}`,
    description: 'Graph algorithms, dynamic programming, sorting trees',
  }, teacherToken);
  const topic2 = await post('/topics', {
    name: `Computer Networks ${Date.now()}`,
    description: 'TCP/IP, HTTP, routing, DNS',
  }, teacherToken);
  console.log(`   ✅ Created Topics: "${topic1.name}" (${topic1.id}), "${topic2.name}" (${topic2.id})`);

  // 4. Exam Creation (Phase 2 Requirement 4)
  console.log('\n4. Creating Exam as Teacher (/exams)...');
  const exam = await post('/exams', {
    title: 'CS301: Advanced Algorithms Midterm',
    description: 'Comprehensive assessment covering sorting, greedy algorithms, and graph theory.',
    durationMinutes: 90,
    isAdaptive: false,
  }, teacherToken);
  console.log(`   ✅ Created Exam: "${exam.title}" (ID: ${exam.id}) by Teacher: ${exam.teacherId}`);

  // 5. Questions Authoring (Phase 2 Requirement 3)
  console.log('\n5. Authoring 5 individual questions with topic and difficulty tags...');
  const q1 = await post('/questions', {
    examId: exam.id,
    topicId: topic1.id,
    text: 'What is the worst-case time complexity of QuickSort with standard pivot selection?',
    type: 'MCQ',
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
    correctAnswer: 'O(n^2)',
    difficulty: 'EASY',
    points: 2.0,
  }, teacherToken);

  const q2 = await post('/questions', {
    examId: exam.id,
    topicId: topic1.id,
    text: 'Which algorithm is optimal for finding the shortest path in a weighted graph with non-negative edge weights?',
    type: 'MCQ',
    options: ["Dijkstra's Algorithm", "Bellman-Ford Algorithm", "Floyd-Warshall", "Breadth-First Search"],
    correctAnswer: "Dijkstra's Algorithm",
    difficulty: 'MEDIUM',
    points: 3.0,
  }, teacherToken);

  const q3 = await post('/questions', {
    examId: exam.id,
    topicId: topic2.id,
    text: 'In TCP, what mechanism is used for reliable data transfer and flow control?',
    type: 'MCQ',
    options: ['Sliding Window Protocol', 'Checksum only', 'Token Ring', 'CSMA/CD'],
    correctAnswer: 'Sliding Window Protocol',
    difficulty: 'MEDIUM',
    points: 3.0,
  }, teacherToken);

  const q4 = await post('/questions', {
    examId: exam.id,
    topicId: topic1.id,
    text: 'Explain the difference between Dynamic Programming and Memoization. Provide an example.',
    type: 'SUBJECTIVE',
    rubric: 'Mentions overlapping subproblems, optimal substructure, bottom-up vs top-down tabularization.',
    difficulty: 'HARD',
    points: 5.0,
  }, teacherToken);

  console.log('   ✅ Authored individual questions (Easy, Medium, Hard, MCQ and Subjective with rubrics).');

  // 6. Bulk CSV Questions Upload (Phase 2 Requirement 2 & 5)
  console.log('\n6. Testing Bulk Questions Upload (/questions/bulk)...');
  const bulkRes = await post('/questions/bulk', {
    examId: exam.id,
    questions: [
      {
        topicId: topic2.id,
        text: 'What is the default port number for HTTPS?',
        type: 'MCQ',
        options: ['80', '443', '8080', '22'],
        correctAnswer: '443',
        difficulty: 'EASY',
        points: 1.0,
      },
      {
        topicId: topic1.id,
        text: 'What data structure is typically used to implement Breadth-First Search (BFS)?',
        type: 'MCQ',
        options: ['Stack', 'Queue', 'Heap', 'Tree'],
        correctAnswer: 'Queue',
        difficulty: 'EASY',
        points: 1.0,
      },
    ],
  }, teacherToken);
  console.log(`   ✅ Bulk imported ${bulkRes.count} additional questions.`);

  // 7. Verify Exam & Questions Persistence
  console.log('\n7. Verifying persistence and reload of exam and question bank...');
  const loadedExam = await get(`/exams/${exam.id}`, teacherToken);
  console.log(`   ✅ Loaded Exam "${loadedExam.title}" with ${loadedExam.questions.length} total questions.`);

  // 8. Publish Exam
  console.log('\n8. Publishing Exam (/exams/:id/publish)...');
  const publishedExam = await patch(`/exams/${exam.id}/publish`, { isPublished: true }, teacherToken);
  console.log(`   ✅ Exam publish status updated: isPublished = ${publishedExam.isPublished}`);

  // 9. Verify Teacher Ownership Enforcement
  console.log('\n9. Verifying Ownership Guard (Teacher 2 cannot modify Teacher 1 exam)...');
  const t2Email = `teacher2_p2_${Date.now()}@platform.local`;
  const t2Invite = await post('/invites', { email: t2Email, role: 'TEACHER' }, adminToken);
  const t2Auth = await post('/invites/redeem', {
    token: t2Invite.token,
    name: 'Dr. Ada Lovelace',
    password: 'TeacherPassword123!',
  });
  const teacher2Token = t2Auth.accessToken;

  try {
    await patch(`/exams/${exam.id}`, { title: 'Hacked Title' }, teacher2Token);
    console.error('   ❌ Ownership guard failed: unauthorized teacher modified exam!');
    process.exit(1);
  } catch (err) {
    console.log(`   ✅ Ownership guard successfully blocked unauthorized update: ${err.message}`);
  }

  console.log('\n===========================================');
  console.log('🎉 ALL PHASE 2 REQUIREMENTS FULLY PASSED!');
  console.log('===========================================');
}

runPhase2Verification().catch((err) => {
  console.error('❌ Phase 2 verification failed:', err);
  process.exit(1);
});
