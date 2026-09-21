'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function QuestionsRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.examId) {
      router.replace(`/exams/${params.examId}/edit`);
    }
  }, [params.examId, router]);

  return null;
}
