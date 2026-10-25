import { HomeScreen } from "@/components/home-screen";
import { seedExams } from "@/lib/exams";

export default function HomePage() {
  return <HomeScreen exams={seedExams} />;
}
