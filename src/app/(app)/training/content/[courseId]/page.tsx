"use client";

import { useParams } from "next/navigation";
import { TrainingCourseEditor } from "@/components/training-course-manager";

export default function Page() {
  const { courseId } = useParams<{ courseId: string }>();
  return <TrainingCourseEditor courseId={courseId} />;
}
