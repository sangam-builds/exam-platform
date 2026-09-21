import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Role, InviteStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalAdmins,
      pendingInvites,
      activeExams,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.TEACHER } }),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.invite.count({ where: { status: InviteStatus.PENDING } }),
      this.prisma.exam.count({ where: { isPublished: true } }),
    ]);

    return {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalAdmins,
      pendingInvites,
      activeExams,
    };
  }

  async getAuditLogs(params?: { action?: string; entity?: string; limit?: number; page?: number }) {
    const { action, entity, limit = 50, page = 1 } = params || {};
    const skip = (page - 1) * limit;

    return this.prisma.auditLog.findMany({
      where: {
        ...(action ? { action } : {}),
        ...(entity ? { entity } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    });
  }
}
