import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateInviteDto, RedeemInviteDto, ValidateInviteResponse, AuthResponse } from '@exam-platform/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async createInvite(dto: CreateInviteDto, adminUserId: string) {
    const email = dto.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    // Check if there is an existing pending invite
    const existingInvite = await this.prisma.invite.findUnique({
      where: { email },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

    let invite;
    if (existingInvite) {
      invite = await this.prisma.invite.update({
        where: { email },
        data: {
          token,
          role: dto.role as any,
          status: 'PENDING',
          expiresAt,
          invitedById: adminUserId,
        },
      });
    } else {
      invite = await this.prisma.invite.create({
        data: {
          email,
          role: dto.role as any,
          token,
          expiresAt,
          invitedById: adminUserId,
        },
      });
    }

    this.logger.log(`📧 [INVITE DISPATCH] Created invite token for ${email} (${dto.role}): ${token}`);
    this.logger.log(`🔗 Redemption URL: http://localhost:3000/set-password?token=${token}`);

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      invitedById: invite.invitedById,
      createdAt: invite.createdAt.toISOString(),
    };
  }

  async validateToken(token: string): Promise<ValidateInviteResponse> {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) {
      return { valid: false, message: 'Invalid or nonexistent invitation token.' };
    }

    if (invite.status !== 'PENDING') {
      return { valid: false, message: `This invitation has already been ${invite.status.toLowerCase()}.` };
    }

    if (new Date() > invite.expiresAt) {
      return { valid: false, message: 'This invitation token has expired.' };
    }

    return {
      valid: true,
      email: invite.email,
      role: invite.role as any,
    };
  }

  async redeemInvite(dto: RedeemInviteDto): Promise<AuthResponse> {
    const validation = await this.validateToken(dto.token);
    if (!validation.valid || !validation.email || !validation.role) {
      throw new BadRequestException(validation.message || 'Invalid invite token');
    }

    const passwordHash = await this.authService.hashPassword(dto.password);

    // Create user and update invite in a transaction
    const [user] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          email: validation.email,
          name: dto.name,
          passwordHash,
          role: validation.role as any,
          isActive: true,
        },
      }),
      this.prisma.invite.update({
        where: { token: dto.token },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    this.logger.log(`✅ [INVITE REDEEMED] User created: ${user.email} (${user.role})`);

    // Log the user in immediately and return session token
    return this.authService.login({
      email: validation.email,
      password: dto.password,
    });
  }
}
