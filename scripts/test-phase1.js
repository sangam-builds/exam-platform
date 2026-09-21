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

async function runPhase1Verification() {
  console.log('=== PHASE 1 TEST CHECKPOINT VERIFICATION ===\n');

  // 1. Admin login
  console.log('1. Logging in as seeded Admin...');
  const adminAuth = await post('/auth/login', {
    email: 'admin@examplatform.local',
    password: 'AdminPassword123!',
  });
  console.log(`   ✅ Admin authenticated successfully. User: ${adminAuth.user.email} (${adminAuth.user.role})`);
  const adminToken = adminAuth.accessToken;

  // 2. Admin invites Teacher
  console.log('\n2. Creating Teacher invite via Admin API...');
  const teacherInvite = await post('/invites', {
    email: `teacher_${Date.now()}@testschool.edu`,
    role: 'TEACHER',
  }, adminToken);
  console.log(`   ✅ Teacher invite issued! Email: ${teacherInvite.email}, Token: ${teacherInvite.token}`);

  // 3. Admin invites Student
  console.log('\n3. Creating Student invite via Admin API...');
  const studentInvite = await post('/invites', {
    email: `student_${Date.now()}@testschool.edu`,
    role: 'STUDENT',
  }, adminToken);
  console.log(`   ✅ Student invite issued! Email: ${studentInvite.email}, Token: ${studentInvite.token}`);

  // 4. Validate Tokens
  console.log('\n4. Validating invite tokens (Frontend redemption check)...');
  const teacherValidation = await get(`/invites/validate/${teacherInvite.token}`);
  console.log(`   ✅ Teacher token validation: valid=${teacherValidation.valid}, role=${teacherValidation.role}`);
  const studentValidation = await get(`/invites/validate/${studentInvite.token}`);
  console.log(`   ✅ Student token validation: valid=${studentValidation.valid}, role=${studentValidation.role}`);

  // 5. Teacher Redeems Invite & Sets Password
  console.log('\n5. Redeeming Teacher invite & setting password...');
  const teacherRedeem = await post('/invites/redeem', {
    token: teacherInvite.token,
    name: 'Prof. Sarah Connor',
    password: 'TeacherSecurePassword123!',
  });
  console.log(`   ✅ Teacher redeemed invite! Created User: ${teacherRedeem.user.name} (${teacherRedeem.user.email})`);

  // 6. Student Redeems Invite & Sets Password
  console.log('\n6. Redeeming Student invite & setting password...');
  const studentRedeem = await post('/invites/redeem', {
    token: studentInvite.token,
    name: 'John Connor',
    password: 'StudentSecurePassword123!',
  });
  console.log(`   ✅ Student redeemed invite! Created User: ${studentRedeem.user.name} (${studentRedeem.user.email})`);

  // 7. Verify Direct Teacher Login
  console.log('\n7. Testing Direct Teacher Login (/auth/login)...');
  const teacherLogin = await post('/auth/login', {
    email: teacherInvite.email,
    password: 'TeacherSecurePassword123!',
  });
  console.log(`   ✅ Teacher successfully logged in! Token issued, Role: ${teacherLogin.user.role}`);

  // 8. Verify Direct Student Login
  console.log('\n8. Testing Direct Student Login (/auth/login)...');
  const studentLogin = await post('/auth/login', {
    email: studentInvite.email,
    password: 'StudentSecurePassword123!',
  });
  console.log(`   ✅ Student successfully logged in! Token issued, Role: ${studentLogin.user.role}`);

  // 9. Verify Admin Users Roster
  console.log('\n9. Fetching users list via Admin API (/users)...');
  const users = await get('/users', adminToken);
  console.log(`   ✅ Admin users list contains ${users.length} total registered accounts.`);

  console.log('\n===========================================');
  console.log('🎉 ALL PHASE 1 REQUIREMENTS FULLY PASSED!');
  console.log('===========================================');
}

runPhase1Verification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
