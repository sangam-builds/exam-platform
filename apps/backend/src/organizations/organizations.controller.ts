import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  CreateOrgUserDto,
  BatchCreateOrgUsersDto,
} from '@exam-platform/shared-types';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createOrgDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrgDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateOrgDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrgDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Post(':id/users')
  @Roles(Role.ADMIN)
  createUser(
    @Param('id') id: string,
    @Body() createOrgUserDto: CreateOrgUserDto,
  ) {
    return this.organizationsService.createUserUnderOrg(id, createOrgUserDto);
  }

  @Post(':id/users/batch')
  @Roles(Role.ADMIN)
  batchCreateUsers(
    @Param('id') id: string,
    @Body() batchDto: BatchCreateOrgUsersDto,
  ) {
    return this.organizationsService.batchCreateUsersUnderOrg(id, batchDto);
  }

  @Post(':id/users/:userId/reset-password')
  @Roles(Role.ADMIN)
  resetMemberPassword(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.organizationsService.resetMemberPassword(id, userId);
  }
}
