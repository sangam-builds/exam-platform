import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const adminEmail = 'admin@examplatform.local';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Administrator',
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Seeded default admin user: ${admin.email}`);
  } else {
    console.log(`ℹ️ Default admin already exists: ${existingAdmin.email}`);
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
