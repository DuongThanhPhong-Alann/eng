"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Eye, Lightbulb, RotateCcw, XCircle } from "lucide-react";
import { getLearnerId } from "@/lib/learner";
import { formatDate, formatDuration } from "@/lib/format";
import type { AttemptDetail } from "@/lib/types";

export function HistoryDetailScreen({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const learnerId = getLearnerId();
    fetch(`/api/history/${attemptId}?learnerId=${encodeURIComponent(learnerId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải chi tiết lần làm bài.");
        setAttempt(data.attempt);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không thể kết nối máy chủ."))
      .finally(() => setLoading(false));
  }, [attemptId]);

  return (
    <div className="page-shell history-detail-shell">
      <Link href="/history" className="back-link"><ArrowLeft size={16} /> Về lịch sử</Link>
      {loading ? <div className="loading-card">Đang tải chi tiết…</div> : error ? <div className="database-note">{error.includes("MONGODB_URI") ? <>Hãy cấu hình <code>MONGODB_URI</code> trong <code>.env.local</code> để xem lịch sử.</> : error}</div> : attempt ? (
        <>
          <section className="attempt-detail-head">
            <span className="eyebrow muted-eyebrow">CHI TIẾT LẦN LÀM BÀI</span>
            <h1>{attempt.examTitle}</h1>
            <p>{attempt.level === "typing" ? "Level 2 · Tự nhập đáp án" : "Level 1 · Trắc nghiệm"}<span> · </span>{formatDate(attempt.completedAt ?? attempt.startedAt)}</p>
            <div className="attempt-stats">
              <div className="attempt-score"><span>Điểm số</span><strong>{attempt.correctCount ?? 0}<small> / {attempt.totalQuestions}</small></strong></div>
              <div><span><CheckCircle2 size={15} /> Câu đúng</span><strong>{attempt.correctCount ?? 0}</strong></div>
              <div><span><XCircle size={15} /> Câu sai</span><strong>{attempt.wrongCount ?? 0}</strong></div>
              <div><span><Clock3 size={15} /> Thời gian</span><strong>{formatDuration(attempt.durationSeconds)}</strong></div>
              <div><span><Eye size={15} /> Rời màn hình</span><strong>{attempt.focusLossCount} lần</strong></div>
            </div>
          </section>
          {attempt.status === "in_progress" && <div className="database-note">Lần làm bài này chưa hoàn tất, nên chưa có điểm cuối cùng.</div>}
          <section className="answer-review">
            <div className="section-heading"><div><span className="eyebrow muted-eyebrow">ÔN LẠI CÂU TRẢ LỜI</span><h2>{attempt.answers.length} câu đã trả lời</h2></div></div>
            {attempt.answers.length === 0 ? <div className="empty-strip"><span className="empty-bubble"><BookOpen size={20} /></span><div><strong>Chưa có câu trả lời được lưu</strong><span>Bạn có thể tiếp tục làm một bài mới từ trang chủ.</span></div></div> : <div className="review-list">
              {attempt.answers.map((answer) => (
                <article className={`review-card ${answer.isCorrect ? "review-correct" : "review-wrong"}`} key={answer.questionId}>
                  <div className="review-top"><span className="review-number">Câu {answer.number} · {answer.section}</span><span className={`review-mark ${answer.isCorrect ? "mark-correct" : "mark-wrong"}`}>{answer.isCorrect ? <><CheckCircle2 size={15} /> Đúng</> : <><XCircle size={15} /> Sai</>}</span></div>
                  <p className="review-question">{answer.prompt}</p>
                  <div className="review-answers"><span>Câu trả lời của bạn <strong>{answer.submittedAnswer || "(để trống)"}</strong></span>{!answer.isCorrect && <span>Đáp án đúng <strong>{answer.correctAnswer}</strong></span>}</div>
                  <div className="review-explanation"><Lightbulb size={16} /><span>{answer.explanation}</span></div>
                </article>
              ))}
            </div>}
          </section>
          <div className="detail-actions"><Link className="button button-primary" href={`/exams/${attempt.examId}`}><RotateCcw size={16} /> Làm lại bài này</Link><Link className="text-link" href="/">Về trang chủ <ArrowRight size={15} /></Link></div>
        </>
      ) : null}
    </div>
  );
}
