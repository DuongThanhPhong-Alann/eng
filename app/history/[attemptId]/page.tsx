import { HistoryDetailScreen } from "@/components/history-detail-screen";

type Props = { params: Promise<{ attemptId: string }> };

export default async function AttemptDetailPage({ params }: Props) {
  const { attemptId } = await params;
  return <HistoryDetailScreen attemptId={attemptId} />;
}
