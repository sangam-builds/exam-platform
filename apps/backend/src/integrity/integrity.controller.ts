import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IntegrityService } from './integrity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RecordFlagDto } from '@exam-platform/shared-types';

@Controller('integrity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrityController {
  constructor(private readonly integrityService: IntegrityService) {}

  @Post('flags')
  @Roles(Role.STUDENT, Role.ADMIN)
  recordFlag(@Body() dto: RecordFlagDto, @Request() req: any) {
    return this.integrityService.recordFlag(req.user.id, dto);
  }

  @Get('flags/exam/:examId')
  @Roles(Role.TEACHER, Role.ADMIN)
  getExamFlags(@Param('examId') examId: string, @Request() req: any) {
    return this.integrityService.getExamIntegritySummary(
      examId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('flags/attempt/:attemptId')
  @Roles(Role.STUDENT, Role.TEACHER, Role.ADMIN)
  getAttemptFlags(@Param('attemptId') attemptId: string, @Request() req: any) {
    return this.integrityService.getAttemptFlags(
      attemptId,
      req.user.id,
      req.user.role,
    );
  }
}
