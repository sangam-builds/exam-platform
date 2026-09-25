import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  StartAttemptDto,
  AnswerSubmissionDto,
  AttemptDetailResponse,
  AttemptResult,
  AttemptStatus,
  StudentQuestion,
  ExamAttendanceResponse,
  StudentAttendanceRecord,
} from '@exam-platform/shared-types';

import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async startAttempt(
    studentId: string,
    dto: StartAttemptDto,
  ): Promise<AttemptDetailResponse> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            topic: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (!exam.isPublished) {
      throw new ForbiddenException('This exam is not published yet');
    }

    // Check scheduled start and end times
    const now = new Date();
    if (exam.startTime && now < new Date(exam.startTime)) {
      throw new ForbiddenException(
        `This exam is scheduled to begin at ${new Date(exam.startTime).toLocaleString()}. You cannot start before this time.`,
      );
    }

    if (exam.endTime && now > new Date(exam.endTime)) {
      throw new ForbiddenException(
        `This exam deadline passed on ${new Date(exam.endTime).toLocaleString()}.`,
      );
    }

    // Check if attempt already exists
    let attempt = await this.prisma.attempt.findUnique({
      where: {
        studentId_examId: {
          studentId,
          examId: dto.examId,
        },
      },
      include: {
        answers: true,
      },
    });

    if (attempt && (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED')) {
      throw new BadRequestException('Exam has already been submitted');
    }

    if (!attempt) {
      attempt = await this.prisma.attempt.create({
        data: {
          studentId,
          examId: dto.examId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
        include: {
          answers: true,
        },
      });
    }

    // Sanitize questions so correct answers & rubrics are NOT exposed to the student
    const sanitizedQuestions: StudentQuestion[] = exam.questions.map((q) => ({
      id: q.id,
      examId: q.examId,
      topicId: q.topicId,
      topic: q.topic ? { id: q.topic.id, name: q.topic.name } : null,
      text: q.text,
      type: q.type as 'MCQ' | 'SUBJECTIVE',
      options: Array.isArray(q.options) ? (q.options as string[]) : [],
      difficulty: q.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
      points: q.points,
      orderIndex: q.orderIndex,
    }));

    return {
      attempt: {
        id: attempt.id,
        studentId: attempt.studentId,
        examId: attempt.examId,
        status: attempt.status as AttemptStatus,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString(),
        score: undefined, // Hidden from student
        totalPoints: undefined,
      },
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        startTime: exam.startTime?.toISOString(),
        endTime: exam.endTime?.toISOString(),
        isAdaptive: exam.isAdaptive,
      },
      questions: sanitizedQuestions,
      answers: attempt.answers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        textAnswer: a.textAnswer,
        timeSpentSeconds: a.timeSpentSeconds,
        changeCount: a.changeCount,
        isFlagged: a.isFlagged,
      })),
    };
  }

  async saveAnswer(
    studentId: string,
    attemptId: string,
    dto: AnswerSubmissionDto,
  ): Promise<{ success: boolean }> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('You do not own this attempt');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Cannot modify answers for a completed exam');
    }

    await this.prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId: dto.questionId,
        },
      },
      update: {
        selectedAnswer: dto.selectedAnswer,
        textAnswer: dto.textAnswer,
        timeSpentSeconds: dto.timeSpentSeconds ?? 0,
        changeCount: {
          increment: 1,
        },
        isFlagged: dto.isFlagged ?? false,
      },
      create: {
        attemptId,
        questionId: dto.questionId,
        selectedAnswer: dto.selectedAnswer,
        textAnswer: dto.textAnswer,
        timeSpentSeconds: dto.timeSpentSeconds ?? 0,
        changeCount: dto.changeCount ?? 1,
        isFlagged: dto.isFlagged ?? false,
      },
    });

    return { success: true };
  }

  async submitAttempt(
    userId: string,
    userRole: string,
    attemptId: string,
  ): Promise<AttemptResult> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (userRole === 'STUDENT' && attempt.studentId !== userId) {
      throw new ForbiddenException('You do not own this attempt');
    }

    if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
      return this.getAttemptResult(userId, userRole, attemptId);
    }

    // Grade MCQs
    let totalScore = 0;
    let totalPoints = 0;

    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    for (const question of attempt.exam.questions) {
      totalPoints += question.points;
      const answer = answerMap.get(question.id);

      if (question.type === 'MCQ' && answer && answer.selectedAnswer) {
        const isCorrect =
          answer.selectedAnswer.trim().toLowerCase() ===
          (question.correctAnswer || '').trim().toLowerCase();

        const questionScore = isCorrect ? question.points : 0;
        totalScore += questionScore;

        await this.prisma.answer.update({
          where: { id: answer.id },
          data: {
            finalScore: questionScore,
          },
        });
      }
    }

    const updatedAttempt = await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        score: totalScore,
        totalPoints,
        submittedAt: new Date(),
      },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                topic: true,
              },
            },
          },
        },
        answers: true,
      },
    });

    const isStudent = userRole === 'STUDENT';
    const percentage =
      totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

    const topicAnalytics = this.analyticsService.calculateTopicBreakdown(updatedAttempt);

    return {
      attemptId: updatedAttempt.id,
      examId: updatedAttempt.examId,
      examTitle: updatedAttempt.exam.title,
      studentId: updatedAttempt.studentId,
      status: updatedAttempt.status as AttemptStatus,
      score: isStudent ? undefined : totalScore,
      totalPoints: isStudent ? undefined : totalPoints,
      percentage: isStudent ? undefined : percentage,
      startedAt: updatedAttempt.startedAt.toISOString(),
      submittedAt: (updatedAttempt.submittedAt || new Date()).toISOString(),
      totalQuestions: updatedAttempt.exam.questions.length,
      answeredCount: updatedAttempt.answers.filter(
        (a) => a.selectedAnswer || a.textAnswer,
      ).length,
      topicBreakdown: topicAnalytics.topics,
      strengths: topicAnalytics.strengths,
      weaknesses: topicAnalytics.weaknesses,
    };
  }

  async getAttemptResult(
    userId: string,
    userRole: string,
    attemptId: string,
  ): Promise<AttemptResult> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                topic: true,
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (userRole === 'STUDENT' && attempt.studentId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const isStudent = userRole === 'STUDENT';
    const score = attempt.score ?? 0;
    const totalPoints =
      attempt.totalPoints ??
      attempt.exam.questions.reduce((sum, q) => sum + q.points, 0);

    const percentage =
      totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    const topicAnalytics = this.analyticsService.calculateTopicBreakdown(attempt);

    return {
      attemptId: attempt.id,
      examId: attempt.examId,
      examTitle: attempt.exam.title,
      studentId: attempt.studentId,
      status: attempt.status as AttemptStatus,
      score: isStudent ? undefined : score,
      totalPoints: isStudent ? undefined : totalPoints,
      percentage: isStudent ? undefined : percentage,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: (attempt.submittedAt ?? new Date()).toISOString(),
      totalQuestions: attempt.exam.questions.length,
      answeredCount: attempt.answers.filter(
        (a) => a.selectedAnswer || a.textAnswer,
      ).length,
      topicBreakdown: topicAnalytics.topics,
      strengths: topicAnalytics.strengths,
      weaknesses: topicAnalytics.weaknesses,
    };
  }

  async getAttempt(
    userId: string,
    userRole: string,
    attemptId: string,
  ): Promise<AttemptDetailResponse> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              include: {
                topic: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (userRole === 'STUDENT' && attempt.studentId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const sanitizedQuestions: StudentQuestion[] = attempt.exam.questions.map(
      (q) => ({
        id: q.id,
        examId: q.examId,
        topicId: q.topicId,
        topic: q.topic ? { id: q.topic.id, name: q.topic.name } : null,
        text: q.text,
        type: q.type as 'MCQ' | 'SUBJECTIVE',
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
        difficulty: q.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
        points: q.points,
        orderIndex: q.orderIndex,
      }),
    );

    return {
      attempt: {
        id: attempt.id,
        studentId: attempt.studentId,
        examId: attempt.examId,
        status: attempt.status as AttemptStatus,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString(),
        score: userRole === 'STUDENT' ? undefined : (attempt.score ?? undefined),
        totalPoints:
          userRole === 'STUDENT' ? undefined : (attempt.totalPoints ?? undefined),
      },
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        description: attempt.exam.description,
        durationMinutes: attempt.exam.durationMinutes,
        startTime: attempt.exam.startTime?.toISOString(),
        endTime: attempt.exam.endTime?.toISOString(),
        isAdaptive: attempt.exam.isAdaptive,
      },
      questions: sanitizedQuestions,
      answers: attempt.answers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        textAnswer: a.textAnswer,
        timeSpentSeconds: a.timeSpentSeconds,
        changeCount: a.changeCount,
        isFlagged: a.isFlagged,
      })),
    };
  }

  async getAttemptByExam(
    userId: string,
    userRole: string,
    examId: string,
  ): Promise<AttemptDetailResponse | null> {
    const attempt = await this.prisma.attempt.findUnique({
      where: {
        studentId_examId: {
          studentId: userId,
          examId,
        },
      },
    });

    if (!attempt) {
      return null;
    }

    return this.getAttempt(userId, userRole, attempt.id);
  }

  async findStudentAttempts(studentId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return attempts.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      examId: a.examId,
      examTitle: a.exam.title,
      status: a.status,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt?.toISOString(),
      score: undefined, // Hidden from student
      totalPoints: undefined,
    }));
  }

  async getExamAttendance(
    userId: string,
    userRole: string,
    examId: string,
  ): Promise<ExamAttendanceResponse> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          select: { id: true, points: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (userRole !== 'ADMIN' && exam.teacherId !== userId) {
      throw new ForbiddenException('You do not have permission to view attendance for this exam');
    }

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
      },
      orderBy: { startedAt: 'desc' },
    });

    const totalQuestions = exam.questions.length;
    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);

    const students: StudentAttendanceRecord[] = attempts.map((att) => {
      const timeSpentSeconds = att.answers.reduce(
        (sum, a) => sum + (a.timeSpentSeconds || 0),
        0,
      );
      const answeredCount = att.answers.filter(
        (a) => a.selectedAnswer || a.textAnswer,
      ).length;

      const score = att.score ?? null;
      const percentage =
        score !== null && totalPoints > 0
          ? Math.round((score / totalPoints) * 100)
          : null;

      return {
        attemptId: att.id,
        studentId: att.studentId,
        studentName: att.student?.name || 'Unknown Student',
        studentEmail: att.student?.email || 'N/A',
        status: att.status as AttemptStatus,
        startedAt: att.startedAt.toISOString(),
        submittedAt: att.submittedAt?.toISOString() ?? null,
        score,
        totalPoints,
        percentage,
        answeredCount,
        totalQuestions,
        timeSpentSeconds,
      };
    });

    const submittedStudents = students.filter((s) => s.status === 'SUBMITTED' || s.status === 'GRADED');
    const inProgressStudents = students.filter((s) => s.status === 'IN_PROGRESS');

    const totalSubmittedScore = submittedStudents.reduce(
      (sum, s) => sum + (s.score ?? 0),
      0,
    );
    const averageScore =
      submittedStudents.length > 0
        ? Math.round((totalSubmittedScore / submittedStudents.length) * 10) / 10
        : null;

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
      totalAttended: students.length,
      submittedCount: submittedStudents.length,
      inProgressCount: inProgressStudents.length,
      averageScore,
      students,
    };
  }
}
