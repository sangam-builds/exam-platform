import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  CreateOrgUserDto,
  BatchCreateOrgUsersDto,
  BatchCreateOrgUsersResponse,
  GeneratedUserCredential,
  Organization,
  OrganizationWithStats,
} from '@exam-platform/shared-types';
import { Role } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Generates an 8-character password containing both letters (upper/lower) and numbers
  generatePassword(length = 8): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const allChars = uppercase + lowercase + numbers;

    let password = '';
    // Ensure at least one uppercase, one lowercase, and one number
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the generated characters
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);

    if (!slug) {
      throw new BadRequestException('Invalid organization name or slug.');
    }

    const existingName = await this.prisma.organization.findUnique({
      where: { name: dto.name.trim() },
    });
    if (existingName) {
      throw new ConflictException(`Organization with name "${dto.name}" already exists.`);
    }

    const existingSlug = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Organization with domain identifier "${slug}.io" already exists.`);
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim(),
      },
      include: {
        _count: { select: { users: true } },
      },
    });

    return org as any;
  }

  async findAll(): Promise<OrganizationWithStats[]> {
    const orgs = await this.prisma.organization.findMany({
      include: {
        users: {
          select: { role: true },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((org) => {
      const teachersCount = org.users.filter((u) => u.role === Role.TEACHER).length;
      const studentsCount = org.users.filter((u) => u.role === Role.STUDENT).length;
      const { users, ...rest } = org;
      return {
        ...rest,
        teachersCount,
        studentsCount,
      } as any;
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }

    const teachers = org.users.filter((u) => u.role === Role.TEACHER);
    const students = org.users.filter((u) => u.role === Role.STUDENT);

    return {
      ...org,
      teachersCount: teachers.length,
      studentsCount: students.length,
    };
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    await this.findOne(id);

    let slug: string | undefined = undefined;
    if (dto.slug) {
      slug = this.slugify(dto.slug);
      const existingSlug = await this.prisma.organization.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existingSlug) {
        throw new ConflictException(`Organization domain identifier "${slug}.io" already exists.`);
      }
    }

    if (dto.name) {
      const existingName = await this.prisma.organization.findFirst({
        where: { name: dto.name.trim(), NOT: { id } },
      });
      if (existingName) {
        throw new ConflictException(`Organization with name "${dto.name}" already exists.`);
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug,
        description: dto.description?.trim(),
      },
      include: {
        _count: { select: { users: true } },
      },
    });

    return updated as any;
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    await this.findOne(id);
    await this.prisma.organization.delete({ where: { id } });
    return { success: true, id };
  }

  async createUserUnderOrg(
    orgId: string,
    dto: CreateOrgUserDto,
  ): Promise<GeneratedUserCredential> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID ${orgId} not found.`);
    }

    // Determine clean identifier
    let memberId = dto.customId?.trim();
    if (!memberId) {
      const prefix = dto.role === Role.TEACHER ? 'teacher' : 'student';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      memberId = `${prefix}_${randomSuffix}`;
    }

    // Clean memberId (alphanumeric, dot, underscore, dash)
    const sanitizedId = memberId.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const email = `${sanitizedId}@${org.slug}.io`;

    // Check email uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(
        `User with generated email "${email}" already exists. Please choose a different identifier.`,
      );
    }

    // Generate 8-character password
    const rawPassword = this.generatePassword(8);
    const passwordHash = await this.authService.hashPassword(rawPassword);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash,
        role: dto.role as any,
        organizationId: org.id,
        isActive: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      rawPassword,
      organizationId: org.id,
      organizationName: org.name,
    };
  }

  async batchCreateUsersUnderOrg(
    orgId: string,
    dto: BatchCreateOrgUsersDto,
  ): Promise<BatchCreateOrgUsersResponse> {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID ${orgId} not found.`);
    }

    const count = Math.min(Math.max(dto.count || 1, 1), 100);
    const prefix = (dto.prefix || (dto.role === Role.TEACHER ? 'T' : 'S')).toLowerCase();
    const startNumber = dto.startNumber || 101;

    const credentials: GeneratedUserCredential[] = [];

    for (let i = 0; i < count; i++) {
      const currentNum = startNumber + i;
      const customId = `${prefix}${currentNum}`;
      const defaultName = dto.names?.[i] || `${dto.role === Role.TEACHER ? 'Teacher' : 'Student'} ${currentNum}`;

      try {
        const cred = await this.createUserUnderOrg(orgId, {
          role: dto.role,
          name: defaultName,
          customId,
        });
        credentials.push(cred);
      } catch (err: any) {
        // If conflict on customId, generate unique suffix
        const cred = await this.createUserUnderOrg(orgId, {
          role: dto.role,
          name: defaultName,
          customId: `${customId}_${Date.now().toString().slice(-4)}`,
        });
        credentials.push(cred);
      }
    }

    return {
      organizationId: org.id,
      organizationName: org.name,
      totalCreated: credentials.length,
      credentials,
    };
  }
}
