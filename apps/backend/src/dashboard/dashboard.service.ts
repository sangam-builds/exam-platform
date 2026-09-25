import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  LiveExamMonitorResponse,
  LiveStudentStatus,
  LiveMonitorStats,
  AttemptStatus,
  IntegrityFlag,
} from '@exam-platform/shared-types';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getExamLiveMonitor(
    examId: string,
    userId: string,
    userRole: string,
    organizationId?: string,
  ): Promise<LiveExamMonitorResponse> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        teacher: {
          select: { id: true, organizationId: true },
        },
        questions: {
          select: { id: true, points: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (userRole !== 'ADMIN' && exam.teacherId !== userId) {
      if (organizationId && exam.teacher.organizationId !== organizationId) {
        throw new ForbiddenException(
          'You do not have permission to view the live dashboard for this exam',
        );
      }
    }

    const totalQuestions = exam.questions.length;
    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);

    // Fetch all attempts for this exam with answers and integrity flags
    const attempts = await this.prisma.attempt.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        answers: true,
        flags: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    // Map attempts to live student statuses
    const students: LiveStudentStatus[] = attempts.map((att) => {
      const answeredCount = att.answers.filter(
        (a) =>
          (a.selectedAnswer !== null && a.selectedAnswer !== '') ||
          (a.textAnswer !== null && a.textAnswer.trim() !== ''),
      ).length;

      const progressPercentage =
        totalQuestions > 0
          ? Math.round((answeredCount / totalQuestions) * 100)
          : 0;

      const totalTimeSpent = att.answers.reduce(
        (sum, a) => sum + (a.timeSpentSeconds || 0),
        0,
      );

      // Find latest activity timestamp from answers or startedAt
      let lastActivityAt: string = att.startedAt.toISOString();
      for (const ans of att.answers) {
        if (ans.updatedAt && new Date(ans.updatedAt) > new Date(lastActivityAt)) {
          lastActivityAt = ans.updatedAt.toISOString();
        }
      }

      const score = att.score ?? null;
      const percentage =
        score !== null && totalPoints > 0
          ? Math.round((score / totalPoints) * 100)
          : null;

      const flags: IntegrityFlag[] = att.flags.map((f) => ({
        id: f.id,
        attemptId: f.attemptId,
        studentId: f.studentId,
        flagType: f.flagType as any,
        details: f.details as any,
        createdAt: f.createdAt.toISOString(),
      }));

      const isFlagged = flags.length > 0;

      return {
        studentId: att.studentId,
        studentName: att.student?.name || 'Unknown Student',
        studentEmail: att.student?.email || 'N/A',
        attemptId: att.id,
        status: att.status as AttemptStatus,
        startedAt: att.startedAt.toISOString(),
        submittedAt: att.submittedAt?.toISOString() ?? null,
        lastActivityAt,
        answeredCount,
        totalQuestions,
        progressPercentage,
        timeSpentSeconds: totalTimeSpent,
        score,
        totalPoints,
        percentage,
        isFlagged,
        flagsCount: flags.length,
        recentFlags: flags,
      };
    });

    const activeStudents = students.filter((s) => s.status === 'IN_PROGRESS');
    const submittedStudents = students.filter(
      (s) => s.status === 'SUBMITTED' || s.status === 'GRADED',
    );
    const flaggedStudents = students.filter((s) => s.isFlagged);

    const totalSubmittedScore = submittedStudents.reduce(
      (sum, s) => sum + (s.score ?? 0),
      0,
    );
    const averageScore =
      submittedStudents.length > 0
        ? Math.round((totalSubmittedScore / submittedStudents.length) * 10) / 10
        : null;

    const totalProgress = students.reduce(
      (sum, s) => sum + s.progressPercentage,
      0,
    );
    const averageProgressPercent =
      students.length > 0 ? Math.round(totalProgress / students.length) : 0;

    const stats: LiveMonitorStats = {
      totalStudents: students.length,
      activeCount: activeStudents.length,
      submittedCount: submittedStudents.length,
      notStartedCount: 0,
      flaggedCount: flaggedStudents.length,
      averageScore,
      averageProgressPercent,
    };

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        startTime: exam.startTime?.toISOString() ?? null,
        endTime: exam.endTime?.toISOString() ?? null,
        totalQuestions,
        totalPoints,
      },
      stats,
      students,
      timestamp: new Date().toISOString(),
    };
  }
}
