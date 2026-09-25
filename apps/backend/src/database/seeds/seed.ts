import { PrismaClient, Role, QuestionType, DifficultyLevel } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

  // 1. Seed Admin User
  const adminEmail = 'admin@examplatform.local';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Administrator',
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Seeded Admin: ${admin.email}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${admin.email}`);
  }

  // 2. Seed Default Organization
  let org = await prisma.organization.findUnique({
    where: { slug: 'stanford' },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Stanford Academy',
        slug: 'stanford',
        description: 'Department of Computer Science & Applied Mathematics',
      },
    });
    console.log(`✅ Seeded Organization: ${org.name} (@${org.slug}.io)`);
  } else {
    console.log(`ℹ️ Organization already exists: ${org.name}`);
  }

  // 3. Seed Teachers under Organization
  const teachersData = [
    { email: 't_alan@stanford.io', name: 'Prof. Alan Turing' },
    { email: 't_ada@stanford.io', name: 'Dr. Ada Lovelace' },
  ];

  let primaryTeacher: any = null;

  for (const t of teachersData) {
    let teacher = await prisma.user.findUnique({ where: { email: t.email } });
    if (!teacher) {
      teacher = await prisma.user.create({
        data: {
          email: t.email,
          name: t.name,
          passwordHash,
          initialPassword: 'Password123!',
          role: Role.TEACHER,
          organizationId: org.id,
          isActive: true,
        },
      });
      console.log(`✅ Seeded Teacher: ${teacher.name} (${teacher.email})`);
    } else if (!teacher.initialPassword) {
      teacher = await prisma.user.update({
        where: { id: teacher.id },
        data: { initialPassword: 'Password123!' },
      });
    }
    if (!primaryTeacher) primaryTeacher = teacher;
  }

  // 4. Seed Students under Organization
  const studentsData = [
    { email: 's_john@stanford.io', name: 'John von Neumann' },
    { email: 's_grace@stanford.io', name: 'Grace Hopper' },
    { email: 's_claude@stanford.io', name: 'Claude Shannon' },
  ];

  for (const s of studentsData) {
    let student = await prisma.user.findUnique({ where: { email: s.email } });
    if (!student) {
      student = await prisma.user.create({
        data: {
          email: s.email,
          name: s.name,
          passwordHash,
          initialPassword: 'Password123!',
          role: Role.STUDENT,
          organizationId: org.id,
          isActive: true,
        },
      });
      console.log(`✅ Seeded Student: ${student.name} (${student.email})`);
    } else if (!student.initialPassword) {
      student = await prisma.user.update({
        where: { id: student.id },
        data: { initialPassword: 'Password123!' },
      });
    }
  }

  // 5. Seed Topics
  let csTopic = await prisma.topic.findUnique({ where: { name: 'Computer Science' } });
  if (!csTopic) {
    csTopic = await prisma.topic.create({
      data: {
        name: 'Computer Science',
        description: 'Core concepts in computer systems and software engineering',
      },
    });
    console.log(`✅ Seeded Topic: ${csTopic.name}`);
  }

  // 6. Seed Sample Exam
  if (primaryTeacher) {
    let exam = await prisma.exam.findFirst({
      where: { title: 'CS101: Fundamentals of Computer Systems' },
    });

    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          title: 'CS101: Fundamentals of Computer Systems',
          description:
            'Comprehensive midterm exam covering algorithms, data structures, and database principles.',
          durationMinutes: 45,
          isPublished: true,
          teacherId: primaryTeacher.id,
          questions: {
            create: [
              {
                text: 'What is the worst-case time complexity of binary search on a sorted array?',
                type: QuestionType.MCQ,
                options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
                correctAnswer: 'O(log n)',
                difficulty: DifficultyLevel.EASY,
                points: 2.0,
                orderIndex: 0,
                topicId: csTopic.id,
              },
              {
                text: 'Which data structure operates on a Last-In-First-Out (LIFO) order?',
                type: QuestionType.MCQ,
                options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'],
                correctAnswer: 'Stack',
                difficulty: DifficultyLevel.EASY,
                points: 2.0,
                orderIndex: 1,
                topicId: csTopic.id,
              },
              {
                text: 'Explain the four ACID properties in database transactions and briefly describe why Atomicity is critical in financial transactions.',
                type: QuestionType.SUBJECTIVE,
                rubric:
                  '1. Clearly defines Atomicity, Consistency, Isolation, Durability (2 pts)\n2. Explains rollback mechanism in case of failures for financial safety (3 pts)',
                difficulty: DifficultyLevel.MEDIUM,
                points: 5.0,
                orderIndex: 2,
                topicId: csTopic.id,
              },
            ],
          },
        },
      });
      console.log(`✅ Seeded Exam: ${exam.title} with 3 questions`);
    } else {
      console.log(`ℹ️ Exam already exists: ${exam.title}`);
    }
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:       admin@examplatform.local | AdminPassword123!');
  console.log('Teacher:     t_alan@stanford.io       | Password123!');
  console.log('Student:     s_john@stanford.io       | Password123!');
  console.log('Organization: Stanford Academy (@stanford.io)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
