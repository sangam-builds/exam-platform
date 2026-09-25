import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('exam/:examId/live-monitor')
  @Roles(Role.TEACHER, Role.ADMIN)
  getExamLiveMonitor(@Param('examId') examId: string, @Request() req: any) {
    return this.dashboardService.getExamLiveMonitor(
      examId,
      req.user.id,
      req.user.role,
      req.user.organizationId,
    );
  }
}
