import { HomeScreen } from "@/components/home-screen";
import { getExams } from "@/lib/exam-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const exams = await getExams();
  return <HomeScreen exams={exams} />;
}
