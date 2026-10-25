import { notFound } from "next/navigation";
import { getExam } from "@/lib/exam-store";
import { ExamModeSelectScreen } from "@/components/exam-mode-select-screen";

type Props = { params: Promise<{ examId: string }> };

export default async function ExamPage({ params }: Props) {
  const { examId } = await params;
  const exam = await getExam(examId);
  if (!exam) notFound();
  const hasChoices = exam.questions.every(
    (question) => question.choices && question.choices.length > 1
  );

  return <ExamModeSelectScreen exam={exam} hasChoices={hasChoices} />;
}
