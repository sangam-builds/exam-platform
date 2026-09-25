import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateTopicDto, UpdateTopicDto } from '@exam-platform/shared-types';

@Controller('topics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Get()
  findAll() {
    return this.topicsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }
}
