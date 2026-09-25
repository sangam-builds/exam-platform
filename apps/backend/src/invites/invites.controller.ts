import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateInviteDto, RedeemInviteDto, ValidateInviteResponse, AuthResponse } from '@exam-platform/shared-types';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async createInvite(
    @Body() dto: CreateInviteDto,
    @CurrentUser() adminUser: any,
  ) {
    return this.invitesService.createInvite(dto, adminUser.id);
  }

  @Get('validate/:token')
  async validateToken(@Param('token') token: string): Promise<ValidateInviteResponse> {
    return this.invitesService.validateToken(token);
  }

  @Post('redeem')
  async redeemInvite(@Body() dto: RedeemInviteDto): Promise<AuthResponse> {
    return this.invitesService.redeemInvite(dto);
  }
}
