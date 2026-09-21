import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { InvitesModule } from './invites/invites.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { TopicsModule } from './topics/topics.module';
import { UploadsModule } from './uploads/uploads.module';
import { QuestionsModule } from './questions/questions.module';
import { ExamsModule } from './exams/exams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    PermissionsModule,
    InvitesModule,
    UsersModule,
    AdminModule,
    TopicsModule,
    UploadsModule,
    QuestionsModule,
    ExamsModule,
  ],
})
export class AppModule {}
