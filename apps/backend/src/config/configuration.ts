export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/exam_platform?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-exam-platform-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origins: [
      process.env.FRONTEND_STUDENT_URL || 'http://localhost:3000',
      process.env.FRONTEND_TEACHER_URL || 'http://localhost:3001',
      process.env.FRONTEND_ADMIN_URL || 'http://localhost:3002',
    ],
  },
});
