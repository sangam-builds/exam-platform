import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExamDto, UpdateExamDto, Exam } from '@exam-platform/shared-types';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExamDto, teacherId: string): Promise<Exam> {
    const exam = await this.prisma.exam.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        durationMinutes: dto.durationMinutes,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        isAdaptive: !!dto.isAdaptive,
        isPublished: false,
        teacherId,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return exam as any;
  }

  async findAll(query?: { teacherId?: string; isPublished?: boolean; search?: string }): Promise<Exam[]> {
    const where: any = {};

    if (query?.teacherId) {
      where.teacherId = query.teacherId;
    }

    if (query?.isPublished !== undefined) {
      where.isPublished = query.isPublished;
    }

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return exams as any;
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        questions: {
          include: { topic: true },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found.`);
    }

    return exam as any;
  }

  async update(id: string, dto: UpdateExamDto, user: { id: string; role: string }): Promise<Exam> {
    const exam = await this.findOne(id);

    if (user.role !== 'ADMIN' && exam.teacherId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this exam.');
    }

    const updated = await this.prisma.exam.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        durationMinutes: dto.durationMinutes,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        isPublished: dto.isPublished !== undefined ? dto.isPublished : undefined,
        isAdaptive: dto.isAdaptive !== undefined ? dto.isAdaptive : undefined,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        questions: {
          include: { topic: true },
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return updated as any;
  }

  async togglePublish(id: string, isPublished: boolean, user: { id: string; role: string }): Promise<Exam> {
    const exam = await this.findOne(id);

    if (user.role !== 'ADMIN' && exam.teacherId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this exam.');
    }

    const updated = await this.prisma.exam.update({
      where: { id },
      data: { isPublished },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return updated as any;
  }

  async remove(id: string, user: { id: string; role: string }): Promise<{ success: boolean; id: string }> {
    const exam = await this.findOne(id);

    if (user.role !== 'ADMIN' && exam.teacherId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this exam.');
    }

    await this.prisma.exam.delete({ where: { id } });
    return { success: true, id };
  }
}
