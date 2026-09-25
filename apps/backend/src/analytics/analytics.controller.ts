import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('attempts/:attemptId/topics')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  getAttemptTopicAnalytics(
    @Param('attemptId') attemptId: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getAttemptTopicAnalytics(
      attemptId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('exams/:examId/topics')
  @Roles(Role.TEACHER, Role.ADMIN)
  getExamTopicAnalytics(
    @Param('examId') examId: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getExamTopicAnalytics(
      examId,
      req.user.id,
    );
  }
}
