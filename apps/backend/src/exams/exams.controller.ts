import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateExamDto, UpdateExamDto } from '@exam-platform/shared-types';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN)
  create(@Body() createExamDto: CreateExamDto, @Request() req: any) {
    return this.examsService.create(createExamDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('teacherId') teacherId?: string,
    @Query('isPublished') isPublished?: string,
    @Query('search') search?: string,
    @Request() req?: any,
  ) {
    const isPublishedBool = isPublished !== undefined ? isPublished === 'true' : undefined;
    // For students, default to only published exams
    const filterTeacherId = req?.user?.role === 'STUDENT' ? undefined : teacherId;
    const filterPublished = req?.user?.role === 'STUDENT' ? true : isPublishedBool;

    return this.examsService.findAll({
      teacherId: filterTeacherId,
      isPublished: filterPublished,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
    @Request() req: any,
  ) {
    return this.examsService.update(id, updateExamDto, req.user);
  }

  @Patch(':id/publish')
  @Roles(Role.TEACHER, Role.ADMIN)
  togglePublish(
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
    @Request() req: any,
  ) {
    return this.examsService.togglePublish(id, isPublished, req.user);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.examsService.remove(id, req.user);
  }
}
