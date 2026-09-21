import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Roles(Role.ADMIN)
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('logs')
  @Roles(Role.ADMIN)
  async getAuditLogs(
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.adminService.getAuditLogs({
      action,
      entity,
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    });
  }
}
