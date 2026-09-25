import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Admins bypass ownership checks
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check exam ownership
    if (params.examId || params.id) {
      const examId = params.examId || params.id;
      const exam = await this.prisma.exam.findUnique({
        where: { id: examId },
        select: { teacherId: true },
      });

      if (!exam) {
        throw new NotFoundException(`Exam with ID ${examId} not found`);
      }

      if (exam.teacherId !== user.id) {
        throw new ForbiddenException('You do not have permission to modify this exam');
      }
    }

    return true;
  }
}
