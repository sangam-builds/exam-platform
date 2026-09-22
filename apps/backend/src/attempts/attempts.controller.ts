import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  StartAttemptDto,
  AnswerSubmissionDto,
} from '@exam-platform/shared-types';

@Controller('attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start')
  @Roles(Role.STUDENT, Role.ADMIN)
  startAttempt(@Body() dto: StartAttemptDto, @Request() req: any) {
    return this.attemptsService.startAttempt(req.user.id, dto);
  }

  @Get('my-attempts')
  @Roles(Role.STUDENT, Role.ADMIN)
  getMyAttempts(@Request() req: any) {
    return this.attemptsService.findStudentAttempts(req.user.id);
  }

  @Get('exam/:examId')
  @Roles(Role.STUDENT, Role.ADMIN)
  getAttemptByExam(@Param('examId') examId: string, @Request() req: any) {
    return this.attemptsService.getAttemptByExam(req.user.id, examId);
  }

  @Get(':id')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  getAttempt(@Param('id') id: string, @Request() req: any) {
    return this.attemptsService.getAttempt(req.user.id, id);
  }

  @Post(':id/answers')
  @Roles(Role.STUDENT, Role.ADMIN)
  saveAnswer(
    @Param('id') id: string,
    @Body() dto: AnswerSubmissionDto,
    @Request() req: any,
  ) {
    return this.attemptsService.saveAnswer(req.user.id, id, dto);
  }

  @Post(':id/submit')
  @Roles(Role.STUDENT, Role.ADMIN)
  submitAttempt(@Param('id') id: string, @Request() req: any) {
    return this.attemptsService.submitAttempt(req.user.id, id);
  }

  @Get(':id/result')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  getResult(@Param('id') id: string, @Request() req: any) {
    return this.attemptsService.getAttemptResult(req.user.id, id);
  }
}
