import { notFound } from "next/navigation";
import { PracticeScreen } from "@/components/practice-screen";
import { getExam } from "@/lib/exam-store";

type Props = { params: Promise<{ examId: string }> };

export default async function PracticePage({ params }: Props) {
  const { examId } = await params;
  const exam = await getExam(examId);
  if (!exam) notFound();
  return <PracticeScreen exam={exam} />;
}
