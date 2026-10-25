"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, Eye, History } from "lucide-react";
import { getLearnerId } from "@/lib/learner";
import { formatDate, formatDuration } from "@/lib/format";
import type { AttemptSummary } from "@/lib/types";

export function HistoryScreen() {
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const learnerId = getLearnerId();
    fetch(`/api/history?learnerId=${encodeURIComponent(learnerId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải lịch sử.");
        setAttempts(data.attempts ?? []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không thể kết nối máy chủ."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell history-shell">
      <Link href="/" className="back-link"><ArrowLeft size={16} /> Về trang chủ</Link>
      <section className="history-heading"><span className="history-heading-icon"><History size={25} /></span><div><span className="eyebrow muted-eyebrow">HÀNH TRÌNH HỌC TẬP</span><h1>Lịch sử làm bài</h1><p>Xem lại điểm số và những lần bạn đã học.</p></div></section>
      {error && <div className="database-note">{error.includes("MONGODB_URI") ? <>Hãy cấu hình <code>MONGODB_URI</code> trong <code>.env.local</code> để lưu và xem lịch sử bài làm.</> : error}</div>}
      {loading ? <div className="loading-card">Đang tải lịch sử…</div> : attempts.length === 0 ? (
        <div className="history-empty"><span className="empty-bubble"><BookOpen size={22} /></span><h2>Chưa có lịch sử học tập</h2><p>Sau khi làm bài, kết quả sẽ được lưu ở đây.</p><Link href="/" className="button button-primary">Tìm bài học đầu tiên <ArrowRight size={16} /></Link></div>
      ) : (
        <>
          <div className="history-summary"><div><strong>{attempts.filter((item) => item.status === "completed").length}</strong><span>Bài đã hoàn thành</span></div><div><strong>{attempts.length}</strong><span>Tổng lần làm bài</span></div><div><strong>{attempts.reduce((total, item) => total + item.focusLossCount, 0)}</strong><span>Lần rời màn hình</span></div></div>
          <div className="history-list">
            {attempts.map((attempt) => (
              <Link className="history-row" href={`/history/${attempt.id}`} key={attempt.id}>
                <span className="history-row-icon"><BookOpen size={19} /></span>
                <span className="history-row-main"><strong>{attempt.examTitle}</strong><span>{attempt.level === "typing" ? "Level 2 · Tự nhập đáp án" : "Level 1 · Trắc nghiệm"}</span><small>{formatDate(attempt.completedAt ?? attempt.startedAt)}</small></span>
                <span className={`status-pill ${attempt.status === "completed" ? "status-done" : "status-progress"}`}>{attempt.status === "completed" ? "Đã hoàn thành" : "Đang làm dở"}</span>
                <span className="history-result">{attempt.status === "completed" ? <><strong>{attempt.correctCount}/{attempt.totalQuestions}</strong><small>câu đúng</small></> : <><strong>—</strong><small>chưa nộp</small></>}</span>
                <span className="history-small-stat"><Clock3 size={14} /> {formatDuration(attempt.durationSeconds)}</span>
                <span className="history-small-stat"><Eye size={14} /> {attempt.focusLossCount} lần</span>
                <ArrowRight size={17} className="recent-arrow" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
