import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTopicDto, UpdateTopicDto, Topic } from '@exam-platform/shared-types';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTopicDto): Promise<Topic> {
    const existing = await this.prisma.topic.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Topic with name "${dto.name}" already exists.`);
    }

    const topic = await this.prisma.topic.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        parentId: dto.parentId || null,
      },
      include: {
        parent: true,
        subtopics: true,
        _count: {
          select: { questions: true },
        },
      },
    });

    return topic as any;
  }

  async findAll(): Promise<Topic[]> {
    const topics = await this.prisma.topic.findMany({
      include: {
        parent: true,
        subtopics: true,
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return topics as any;
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        parent: true,
        subtopics: true,
        questions: true,
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found.`);
    }

    return topic as any;
  }

  async update(id: string, dto: UpdateTopicDto): Promise<Topic> {
    await this.findOne(id);

    if (dto.name) {
      const duplicate = await this.prisma.topic.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException(`Topic with name "${dto.name}" already exists.`);
      }
    }

    const updated = await this.prisma.topic.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        parentId: dto.parentId !== undefined ? dto.parentId : undefined,
      },
      include: {
        parent: true,
        subtopics: true,
        _count: {
          select: { questions: true },
        },
      },
    });

    return updated as any;
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    await this.findOne(id);
    await this.prisma.topic.delete({ where: { id } });
    return { success: true, id };
  }
}
