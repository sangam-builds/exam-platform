import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @Roles(Role.TEACHER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.uploadsService.uploadFile(file);
  }

  @Post('parse-csv')
  @Roles(Role.TEACHER, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  }))
  async parseCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    const questions = this.uploadsService.parseQuestionsCsv(file.buffer);
    return { count: questions.length, questions };
  }
}
