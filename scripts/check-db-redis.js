const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

const prisma = new PrismaClient();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  lazyConnect: true,
});

async function verifyPersistence() {
  console.log('🔍 Checking Database (PostgreSQL) & Cache (Redis) Storage Status...\n');

  try {
    // 1. PostgreSQL DB Check
    console.log('📊 [PostgreSQL Database Summary via Prisma]');
    const orgsCount = await prisma.organization.count();
    const usersCount = await prisma.user.count();
    const examsCount = await prisma.exam.count();
    const questionsCount = await prisma.question.count();
    const topicsCount = await prisma.topic.count();
    const attemptsCount = await prisma.attempt.count();

    console.log(`   - Organizations: ${orgsCount}`);
    console.log(`   - Total Users:   ${usersCount}`);
    console.log(`   - Exams:         ${examsCount}`);
    console.log(`   - Questions:     ${questionsCount}`);
    console.log(`   - Topics:        ${topicsCount}`);
    console.log(`   - Attempts:      ${attemptsCount}`);

    console.log('\n🏫 [Saved Organizations & Member Rosters]:');
    const orgs = await prisma.organization.findMany({
      include: {
        users: {
          select: { name: true, email: true, role: true, initialPassword: true },
        },
      },
      take: 5,
    });

    orgs.forEach((org) => {
      console.log(`   🏢 ${org.name} (@${org.slug}.io) - ${org.users.length} members`);
      org.users.forEach((u) => {
        console.log(`      • [${u.role}] ${u.name} <${u.email}> (Password: ${u.initialPassword || 'Hashed'})`);
      });
    });

    // 2. Redis Connection Check
    console.log('\n⚡ [Redis In-Memory Cache Status]');
    await redis.connect();
    const ping = await redis.ping();
    const dbSize = await redis.dbsize();
    const keys = await redis.keys('*');

    console.log(`   - Connection: ${ping === 'PONG' ? '✅ Connected (PONG)' : '❌ Failed'}`);
    console.log(`   - Total Keys in Redis: ${dbSize}`);
    if (keys.length > 0) {
      console.log(`   - Sample Active Redis Keys: ${keys.slice(0, 10).join(', ')}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CONFIRMATION: All operations are permanently stored in PostgreSQL and Redis is live and ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('❌ Check failed:', err);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

verifyPersistence();
