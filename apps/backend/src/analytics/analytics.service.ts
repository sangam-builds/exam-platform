import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  AttemptTopicAnalytics,
  TopicPerformance,
} from '@exam-platform/shared-types';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute topic-wise breakdown for a specific attempt
   */
  async getAttemptTopicAnalytics(
    attemptId: string,
    userId: string,
    userRole: string,
  ): Promise<AttemptTopicAnalytics> {
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
      throw new ForbiddenException('You cannot access analytics for this attempt');
    }

    return this.calculateTopicBreakdown(attempt);
  }

  /**
   * Helper to calculate topic performance breakdown from an attempt
   */
  calculateTopicBreakdown(attempt: any): AttemptTopicAnalytics {
    const questions = attempt.exam.questions || [];
    const answers = attempt.answers || [];
    const answerMap = new Map<string, any>(answers.map((a: any) => [a.questionId, a]));

    // Map: topicKey -> { topicId, topicName, questions, answers }
    const topicGroups = new Map<
      string,
      {
        topicId: string;
        topicName: string;
        questions: any[];
      }
    >();

    for (const q of questions) {
      const topicId = q.topicId || 'uncategorized';
      const topicName = q.topic?.name || 'General / Uncategorized';

      if (!topicGroups.has(topicId)) {
        topicGroups.set(topicId, {
          topicId,
          topicName,
          questions: [],
        });
      }
      topicGroups.get(topicId)!.questions.push(q);
    }

    let overallScore = 0;
    let overallTotalPoints = 0;

    const topics: TopicPerformance[] = [];

    for (const [, group] of topicGroups.entries()) {
      let topicTotalPoints = 0;
      let topicEarnedPoints = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      for (const q of group.questions) {
        topicTotalPoints += q.points;
        const answer = answerMap.get(q.id);

        if (!answer || (!answer.selectedAnswer && !answer.textAnswer)) {
          unansweredCount++;
        } else {
          const earned = answer.finalScore ?? 0;
          topicEarnedPoints += earned;

          if (earned >= q.points) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        }
      }

      overallScore += topicEarnedPoints;
      overallTotalPoints += topicTotalPoints;

      const percentage =
        topicTotalPoints > 0
          ? Math.round((topicEarnedPoints / topicTotalPoints) * 100)
          : 0;

      let proficiencyLevel: 'MASTERED' | 'DEVELOPING' | 'NEEDS_FOCUS' = 'DEVELOPING';
      let recommendation = '';

      if (percentage >= 80) {
        proficiencyLevel = 'MASTERED';
        recommendation =
          'Strong command of concepts in this area. Maintain proficiency with timed practice.';
      } else if (percentage >= 50) {
        proficiencyLevel = 'DEVELOPING';
        recommendation =
          'Good foundational knowledge with some conceptual gaps. Focus on reviewing missed questions.';
      } else {
        proficiencyLevel = 'NEEDS_FOCUS';
        recommendation =
          'High priority weakness area. Dedicate time to studying the core topics and re-attempting problems.';
      }

      topics.push({
        topicId: group.topicId,
        topicName: group.topicName,
        totalQuestions: group.questions.length,
        correctCount,
        incorrectCount,
        unansweredCount,
        totalPoints: topicTotalPoints,
        earnedPoints: topicEarnedPoints,
        percentage,
        proficiencyLevel,
        recommendation,
      });
    }

    // Sort topics by lowest percentage first to highlight weaknesses, or stable order
    topics.sort((a, b) => a.percentage - b.percentage);

    const strengths = topics
      .filter((t) => t.percentage >= 75)
      .map((t) => t.topicName);

    const weaknesses = topics
      .filter((t) => t.percentage < 60)
      .map((t) => t.topicName);

    const overallPercentage =
      overallTotalPoints > 0
        ? Math.round((overallScore / overallTotalPoints) * 100)
        : 0;

    return {
      attemptId: attempt.id,
      examId: attempt.examId,
      examTitle: attempt.exam.title,
      studentId: attempt.studentId,
      overallScore,
      overallTotalPoints,
      overallPercentage,
      topics,
      strengths,
      weaknesses,
    };
  }

  /**
   * Aggregate topic performance for an entire exam across all student attempts
   */
  async getExamTopicAnalytics(examId: string, teacherId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            topic: true,
          },
        },
        attempts: {
          where: {
            status: { in: ['SUBMITTED', 'GRADED'] },
          },
          include: {
            answers: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to view this exam analytics');
    }

    const questionMap = new Map<string, any>(exam.questions.map((q) => [q.id, q]));
    const topicStats = new Map<
      string,
      {
        topicId: string;
        topicName: string;
        totalResponses: number;
        correctResponses: number;
        totalPointsPossible: number;
        totalPointsEarned: number;
      }
    >();

    for (const q of exam.questions) {
      const topicId = q.topicId || 'uncategorized';
      const topicName = q.topic?.name || 'General / Uncategorized';

      if (!topicStats.has(topicId)) {
        topicStats.set(topicId, {
          topicId,
          topicName,
          totalResponses: 0,
          correctResponses: 0,
          totalPointsPossible: 0,
          totalPointsEarned: 0,
        });
      }
    }

    for (const attempt of exam.attempts) {
      for (const answer of attempt.answers) {
        const question = questionMap.get(answer.questionId);
        if (!question) continue;

        const topicId = question.topicId || 'uncategorized';
        const stat = topicStats.get(topicId);
        if (stat) {
          stat.totalResponses++;
          const earned = answer.finalScore ?? 0;
          stat.totalPointsEarned += earned;
          stat.totalPointsPossible += question.points;
          if (earned >= question.points) {
            stat.correctResponses++;
          }
        }
      }
    }

    const topicBreakdown = Array.from(topicStats.values()).map((stat) => {
      const avgAccuracy =
        stat.totalPointsPossible > 0
          ? Math.round((stat.totalPointsEarned / stat.totalPointsPossible) * 100)
          : 0;

      return {
        topicId: stat.topicId,
        topicName: stat.topicName,
        totalResponses: stat.totalResponses,
        correctResponses: stat.correctResponses,
        averageAccuracy: avgAccuracy,
        status:
          avgAccuracy >= 75
            ? 'HIGH_PERFORMING'
            : avgAccuracy >= 50
              ? 'AVERAGE'
              : 'CRITICAL_WEAKNESS',
      };
    });

    return {
      examId: exam.id,
      examTitle: exam.title,
      totalAttempts: exam.attempts.length,
      topicBreakdown,
    };
  }
}
