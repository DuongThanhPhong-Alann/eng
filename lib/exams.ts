import source130 from "@/data/unit-3-community-service.json";
import source110 from "@/data/unit-3-community-service-ex14-24.json";
import sourceTenWords from "@/data/unit-3-community-service-word-form-10-tu.json";
import exam1 from "@/data/unit-3-community-service-exam-1.json";
import exam2 from "@/data/unit-3-community-service-exam-2.json";
import exam3 from "@/data/unit-3-community-service-exam-3.json";
import exam4 from "@/data/unit-3-community-service-exam-4.json";
import exam5 from "@/data/unit-3-community-service-exam-5.json";
import exam6 from "@/data/unit-3-community-service-exam-6.json";
import type { Exam } from "@/lib/types";

export const sourceExams: Exam[] = [source130 as Exam, source110 as Exam, sourceTenWords as Exam];
export const seedExams: Exam[] = [exam1 as Exam, exam2 as Exam, exam3 as Exam, exam4 as Exam, exam5 as Exam, exam6 as Exam];

export function getSeedExam(examId: string) {
  return [...seedExams, ...sourceExams].find((exam) => exam.id === examId);
}
