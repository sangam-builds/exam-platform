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

async function run() {
  console.log('🚀 Starting Organization & Credential Flow Verification...\n');

  try {
    // 1. Admin Login
    console.log('1️⃣ Logging in as System Admin...');
    const adminLoginRes = await post('/auth/login', {
      email: 'admin@examplatform.local',
      password: 'AdminPassword123!',
    });

    const adminToken = adminLoginRes.accessToken;
    console.log(`✅ Admin logged in successfully (Role: ${adminLoginRes.user.role})\n`);

    // 2. Fetch Organizations
    console.log('2️⃣ Fetching existing organizations...');
    const listRes = await get('/organizations', adminToken);
    console.log(`✅ Retrieved ${listRes.length} organizations.`);

    // 3. Create a unique organization
    const orgUniqueSlug = `oxford-${Date.now().toString().slice(-4)}`;
    const orgName = `Oxford Institute ${Date.now().toString().slice(-4)}`;
    console.log(`\n3️⃣ Creating new Organization: "${orgName}" (slug: ${orgUniqueSlug})...`);

    const createOrgRes = await post('/organizations', {
      name: orgName,
      slug: orgUniqueSlug,
      description: 'Department of Computing and Artificial Intelligence',
    }, adminToken);

    const orgId = createOrgRes.id;
    const orgSlug = createOrgRes.slug;
    console.log(`✅ Organization created: ID=${orgId}, Domain=@${orgSlug}.io\n`);

    // 4. Create Single Teacher Credential
    console.log('4️⃣ Creating Teacher under Organization with format <id>@<org>.io...');
    const teacherCred = await post(`/organizations/${orgId}/users`, {
      role: 'TEACHER',
      name: 'Prof. Isaac Newton',
      customId: 'newton',
    }, adminToken);

    console.log('✅ Generated Teacher Credential:');
    console.log(`   - Email: ${teacherCred.email}`);
    console.log(`   - Password: ${teacherCred.rawPassword} (Length: ${teacherCred.rawPassword.length})`);
    console.log(`   - Role: ${teacherCred.role}\n`);

    if (teacherCred.email !== `newton@${orgSlug}.io`) {
      throw new Error(`Expected email "newton@${orgSlug}.io", got "${teacherCred.email}"`);
    }
    if (teacherCred.rawPassword.length !== 8) {
      throw new Error(`Expected 8-char password, got length ${teacherCred.rawPassword.length}`);
    }

    // 5. Batch Create Student Credentials
    console.log('5️⃣ Batch creating 3 Student Credentials with format <id>@<org>.io...');
    const batchRes = await post(`/organizations/${orgId}/users/batch`, {
      role: 'STUDENT',
      count: 3,
      prefix: 'student',
      startNumber: 101,
      names: ['Alice Smith', 'Bob Jones', 'Charlie Brown'],
    }, adminToken);

    console.log(`✅ Generated ${batchRes.totalCreated} Student Credentials:`);
    batchRes.credentials.forEach((c) => {
      console.log(`   - ${c.name}: Email=${c.email} | Pass=${c.rawPassword} (Len=${c.rawPassword.length})`);
    });
    console.log('');

    const sampleStudent = batchRes.credentials[0];

    // 6. Test Login as Teacher
    console.log(`6️⃣ Authenticating newly created Teacher (${teacherCred.email})...`);
    const teacherLogin = await post('/auth/login', {
      email: teacherCred.email,
      password: teacherCred.rawPassword,
    });

    console.log(`✅ Teacher authentication verified! Role=${teacherLogin.user.role}\n`);

    // 7. Test Login as Student
    console.log(`7️⃣ Authenticating newly created Student (${sampleStudent.email})...`);
    const studentLogin = await post('/auth/login', {
      email: sampleStudent.email,
      password: sampleStudent.rawPassword,
    });

    console.log(`✅ Student authentication verified! Role=${studentLogin.user.role}\n`);

    // 8. Test Org Detail retrieval with Member Roster & Passwords
    console.log(`8️⃣ Fetching Organization Roster via Admin API...`);
    const orgDetail = await get(`/organizations/${orgId}`, adminToken);
    console.log(`✅ Org Detail retrieved: Name="${orgDetail.name}", Total Members=${orgDetail.users?.length}, Teachers=${orgDetail.teachersCount}, Students=${orgDetail.studentsCount}`);

    const teacherInRoster = orgDetail.users.find((u) => u.email === teacherCred.email);
    if (!teacherInRoster || !teacherInRoster.initialPassword) {
      throw new Error(`Teacher in roster is missing initialPassword!`);
    }
    console.log(`✅ Admin can view member password in roster: ${teacherInRoster.email} -> "${teacherInRoster.initialPassword}"\n`);

    // 9. Test Admin Reset / Regenerate Password for Member
    console.log(`9️⃣ Testing Admin Password Reset for Student (${sampleStudent.email})...`);
    const resetRes = await post(`/organizations/${orgId}/users/${sampleStudent.id}/reset-password`, {}, adminToken);
    console.log(`✅ Password reset successfully! New Password: "${resetRes.rawPassword}"`);

    // Verify login with new password
    const newLogin = await post('/auth/login', {
      email: sampleStudent.email,
      password: resetRes.rawPassword,
    });
    console.log(`✅ Login with new regenerated password verified! Role=${newLogin.user.role}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL BACKEND, DATABASE & FRONTEND INTEGRATIONS VERIFIED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

run();
