import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  BulkCreateQuestionsDto,
  Question,
} from '@exam-platform/shared-types';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto): Promise<Question> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${dto.examId} not found.`);
    }

    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
      });
      if (!topic) {
        throw new NotFoundException(`Topic with ID ${dto.topicId} not found.`);
      }
    }

    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined) {
      const count = await this.prisma.question.count({
        where: { examId: dto.examId },
      });
      orderIndex = count;
    }

    const question = await this.prisma.question.create({
      data: {
        examId: dto.examId,
        topicId: dto.topicId || null,
        text: dto.text.trim(),
        type: (dto.type || 'MCQ') as any,
        options: dto.options ? (dto.options as any) : undefined,
        correctAnswer: dto.correctAnswer?.trim(),
        rubric: dto.rubric?.trim(),
        difficulty: (dto.difficulty || 'MEDIUM') as any,
        points: dto.points !== undefined ? dto.points : 1.0,
        orderIndex,
      },
      include: {
        topic: true,
      },
    });

    return question as any;
  }

  async bulkCreate(dto: BulkCreateQuestionsDto): Promise<{ count: number; questions: Question[] }> {
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${dto.examId} not found.`);
    }

    const existingCount = await this.prisma.question.count({
      where: { examId: dto.examId },
    });

    const createdQuestions: Question[] = [];

    for (let i = 0; i < dto.questions.length; i++) {
      const q = dto.questions[i];
      const created = await this.create({
        ...q,
        examId: dto.examId,
        orderIndex: q.orderIndex !== undefined ? q.orderIndex : existingCount + i,
      });
      createdQuestions.push(created);
    }

    return {
      count: createdQuestions.length,
      questions: createdQuestions,
    };
  }

  async findByExam(examId: string): Promise<Question[]> {
    const questions = await this.prisma.question.findMany({
      where: { examId },
      include: {
        topic: true,
      },
      orderBy: { orderIndex: 'asc' },
    });

    return questions as any;
  }

  async findOne(id: string): Promise<Question> {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        topic: true,
        exam: true,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found.`);
    }

    return question as any;
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<Question> {
    await this.findOne(id);

    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
      });
      if (!topic) {
        throw new NotFoundException(`Topic with ID ${dto.topicId} not found.`);
      }
    }

    const updated = await this.prisma.question.update({
      where: { id },
      data: {
        topicId: dto.topicId !== undefined ? (dto.topicId || null) : undefined,
        text: dto.text?.trim(),
        type: dto.type ? (dto.type as any) : undefined,
        options: dto.options !== undefined ? (dto.options as any) : undefined,
        correctAnswer: dto.correctAnswer !== undefined ? dto.correctAnswer.trim() : undefined,
        rubric: dto.rubric !== undefined ? dto.rubric.trim() : undefined,
        difficulty: dto.difficulty ? (dto.difficulty as any) : undefined,
        points: dto.points !== undefined ? dto.points : undefined,
        orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : undefined,
      },
      include: {
        topic: true,
      },
    });

    return updated as any;
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    await this.findOne(id);
    await this.prisma.question.delete({ where: { id } });
    return { success: true, id };
  }
}
