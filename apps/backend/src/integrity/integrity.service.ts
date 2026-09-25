import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  RecordFlagDto,
  IntegrityFlag,
  ExamIntegritySummary,
  FlagType,
} from '@exam-platform/shared-types';

@Injectable()
export class IntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record an integrity flag for an attempt (e.g. Tab switch, rapid guess)
   */
  async recordFlag(
    studentId: string,
    dto: RecordFlagDto,
  ): Promise<IntegrityFlag> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: dto.attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('Cannot record flag for an attempt you do not own');
    }

    const flag = await this.prisma.flag.create({
      data: {
        attemptId: dto.attemptId,
        studentId,
        flagType: dto.flagType as any,
        details: (dto.details as any) ?? {},
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      id: flag.id,
      attemptId: flag.attemptId,
      studentId: flag.studentId,
      studentName: flag.student?.name,
      studentEmail: flag.student?.email,
      flagType: flag.flagType as FlagType,
      details: flag.details as Record<string, any>,
      createdAt: flag.createdAt.toISOString(),
    };
  }

  /**
   * Get all integrity flags for an exam with summary statistics (Teacher/Admin)
   */
  async getExamIntegritySummary(
    examId: string,
    userId: string,
    userRole: string,
  ): Promise<ExamIntegritySummary> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (userRole === 'TEACHER' && exam.teacherId !== userId) {
      throw new ForbiddenException('You do not have permission to view flags for this exam');
    }

    const flags = await this.prisma.flag.findMany({
      where: {
        attempt: {
          examId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const flagsByType: Record<FlagType, number> = {
      TAB_SWITCH: 0,
      TIME_ANOMALY: 0,
      SIMILARITY_MATCH: 0,
      RAPID_GUESS: 0,
    };

    const uniqueStudents = new Set<string>();

    for (const flag of flags) {
      uniqueStudents.add(flag.studentId);
      const type = flag.flagType as FlagType;
      if (flagsByType[type] !== undefined) {
        flagsByType[type]++;
      }
    }

    const formattedFlags: IntegrityFlag[] = flags.map((f) => ({
      id: f.id,
      attemptId: f.attemptId,
      studentId: f.studentId,
      studentName: f.student?.name,
      studentEmail: f.student?.email,
      flagType: f.flagType as FlagType,
      details: f.details as Record<string, any>,
      createdAt: f.createdAt.toISOString(),
    }));

    return {
      examId,
      totalFlags: flags.length,
      flaggedStudentsCount: uniqueStudents.size,
      flagsByType,
      recentFlags: formattedFlags,
    };
  }

  /**
   * Get flags for a single attempt
   */
  async getAttemptFlags(
    attemptId: string,
    userId: string,
    userRole: string,
  ): Promise<IntegrityFlag[]> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (
      userRole === 'STUDENT' &&
      attempt.studentId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    if (
      userRole === 'TEACHER' &&
      attempt.exam.teacherId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const flags = await this.prisma.flag.findMany({
      where: { attemptId },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return flags.map((f) => ({
      id: f.id,
      attemptId: f.attemptId,
      studentId: f.studentId,
      studentName: f.student?.name,
      studentEmail: f.student?.email,
      flagType: f.flagType as FlagType,
      details: f.details as Record<string, any>,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  /**
   * Deterministic shuffle algorithm for questions and options per attempt
   */
  shuffleArray<T>(array: T[], seedStr: string): T[] {
    const arr = [...array];
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed << 5) - seed + seedStr.charCodeAt(i);
      seed |= 0;
    }

    // Mulberry32 pseudo-random generator
    const random = () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }
}
