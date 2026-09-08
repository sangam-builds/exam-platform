export interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  teacherId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
