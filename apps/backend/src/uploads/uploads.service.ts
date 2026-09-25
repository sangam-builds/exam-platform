import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { parse } from 'csv-parse/sync';
import { CreateQuestionDto, DifficultyLevel, QuestionType } from '@exam-platform/shared-types';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || 'exam-platform-dev';

    if (accountId && accessKeyId && secretAccessKey && !accessKeyId.includes('dummy')) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const key = `uploads/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    if (this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
        return {
          url: `https://${this.bucketName}.r2.dev/${key}`,
          key,
        };
      } catch (err) {
        this.logger.error('Failed to upload to R2, falling back to data URL', err);
      }
    }

    // Local / Dev Fallback: Data URI
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    return {
      url: dataUrl,
      key,
    };
  }

  parseQuestionsCsv(fileBuffer: Buffer | string): Omit<CreateQuestionDto, 'examId'>[] {
    try {
      const records = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!records || records.length === 0) {
        throw new BadRequestException('CSV file is empty or formatted improperly.');
      }

      return records.map((row: any, index: number) => {
        const text = row.text || row.question || row.Question || row.Text;
        if (!text) {
          throw new BadRequestException(`Row ${index + 1}: Missing question text`);
        }

        const rawType = (row.type || row.Type || 'MCQ').toUpperCase();
        const type: QuestionType = rawType === 'SUBJECTIVE' ? 'SUBJECTIVE' : 'MCQ';

        let options: string[] = [];
        if (row.options || row.Options) {
          try {
            const rawOptions = row.options || row.Options;
            if (rawOptions.startsWith('[')) {
              options = JSON.parse(rawOptions);
            } else {
              options = rawOptions.split('|').map((o: string) => o.trim());
            }
          } catch {
            options = (row.options || row.Options).split('|').map((o: string) => o.trim());
          }
        } else if (type === 'MCQ') {
          // Check for OptionA, OptionB, OptionC, OptionD columns
          const optA = row.optionA || row.OptionA || row['Option A'];
          const optB = row.optionB || row.OptionB || row['Option B'];
          const optC = row.optionC || row.OptionC || row['Option C'];
          const optD = row.optionD || row.OptionD || row['Option D'];
          if (optA && optB) {
            options = [optA, optB, optC, optD].filter(Boolean);
          }
        }

        const correctAnswer = row.correctAnswer || row.CorrectAnswer || row.answer || row.Answer || undefined;
        const rubric = row.rubric || row.Rubric || undefined;

        const rawDiff = (row.difficulty || row.Difficulty || 'MEDIUM').toUpperCase();
        let difficulty: DifficultyLevel = 'MEDIUM';
        if (rawDiff === 'EASY' || rawDiff === 'HARD') {
          difficulty = rawDiff;
        }

        const points = parseFloat(row.points || row.Points || '1.0') || 1.0;

        return {
          text,
          type,
          options: options.length > 0 ? options : undefined,
          correctAnswer,
          rubric,
          difficulty,
          points,
          orderIndex: index,
        };
      });
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Failed to parse questions CSV file');
    }
  }
}
