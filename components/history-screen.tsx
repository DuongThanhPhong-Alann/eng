"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  History,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { getLearnerId } from "@/lib/learner";
import { formatDate, formatDuration } from "@/lib/format";
import { playClickSound } from "@/lib/sound";
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
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Không thể kết nối máy chủ.")
      )
      .finally(() => setLoading(false));
  }, []);

  const completed = attempts.filter((item) => item.status === "completed");
  const totalCorrect = completed.reduce((sum, item) => sum + (item.correctCount ?? 0), 0);
  const totalQuestions = completed.reduce((sum, item) => sum + item.totalQuestions, 0);
  const overallPercent =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="page-shell history-shell">
      <Link href="/" className="back-link" onClick={() => playClickSound()}>
        <ArrowLeft size={18} />
        <span>Về trang chủ</span>
      </Link>

      <section className="history-heading">
        <div className="history-heading-icon">
          <Trophy size={28} />
        </div>
        <div>
          <div className="eyebrow-tag">
            <Sparkles size={14} /> NHẬT KÝ HỌC TẬP
          </div>
          <h1>Lịch sử ôn luyện</h1>
          <p>Xem lại hành trình tiến bộ và những điểm số bạn đã đạt được!</p>
        </div>
      </section>

      {error && (
        <div className="database-note">
          {error.includes("MONGODB_URI") ? (
            <>
              💡 Hãy cấu hình <code>MONGODB_URI</code> trong tệp <code>.env.local</code> để lưu
              kết quả làm bài vào cơ sở dữ liệu nhé!
            </>
          ) : (
            error
          )}
        </div>
      )}

      {loading ? (
        <div className="loading-card">
          <span className="loading-spinner" />
          <span>Đang tải lịch sử học tập của bạn…</span>
        </div>
      ) : attempts.length === 0 ? (
        <div className="history-empty">
          <div className="empty-bubble">🌱</div>
          <h2>Bạn chưa có lần làm bài nào</h2>
          <p>Mỗi bước đi đều bắt đầu từ câu hỏi đầu tiên. Hãy bắt đầu ngay bây giờ nhé!</p>
          <Link
            href="/"
            className="button button-primary button-lg"
            onClick={() => playClickSound()}
          >
            <span>Khám phá bộ đề ôn tập</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          {/* Thống kê tổng quan */}
          <div className="history-summary-grid">
            <div className="summary-box">
              <span className="summary-icon icon-trophy">
                <Trophy size={20} />
              </span>
              <div>
                <strong>{completed.length}</strong>
                <span>Bài đã hoàn thành</span>
              </div>
            </div>

            <div className="summary-box">
              <span className="summary-icon icon-zap">
                <Zap size={20} />
              </span>
              <div>
                <strong>
                  {totalCorrect} / {totalQuestions}
                </strong>
                <span>Tổng câu trả lời đúng ({overallPercent}%)</span>
              </div>
            </div>

            <div className="summary-box">
              <span className="summary-icon icon-eye">
                <Eye size={20} />
              </span>
              <div>
                <strong>{attempts.reduce((total, item) => total + item.focusLossCount, 0)}</strong>
                <span>Lần chuyển tab</span>
              </div>
            </div>
          </div>

          {/* Danh sách các lần thi */}
          <div className="history-list-wrap">
            <div className="history-list-header">
              <h3>Tất cả các lần làm bài ({attempts.length})</h3>
            </div>

            <div className="history-list">
              {attempts.map((attempt) => {
                const isDone = attempt.status === "completed";
                const percent =
                  isDone && attempt.totalQuestions > 0
                    ? Math.round(((attempt.correctCount ?? 0) / attempt.totalQuestions) * 100)
                    : 0;

                let scoreBadgeClass = "score-badge-neutral";
                if (isDone) {
                  if (percent >= 80) scoreBadgeClass = "score-badge-high";
                  else if (percent >= 50) scoreBadgeClass = "score-badge-med";
                  else scoreBadgeClass = "score-badge-low";
                }

                return (
                  <Link
                    className="history-item-row"
                    href={`/history/${attempt.id}`}
                    key={attempt.id}
                    onClick={() => playClickSound()}
                  >
                    <div className="history-item-left">
                      <span className={`history-item-icon ${isDone ? "item-done" : "item-progress"}`}>
                        {isDone ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
                      </span>

                      <div className="history-item-info">
                        <strong>{attempt.examTitle}</strong>
                        <div className="history-item-sub">
                          <span className="level-label">
                            {attempt.level === "typing" ? "✍️ Tự gõ đáp án" : "⚡ Trắc nghiệm A-B-C-D"}
                          </span>
                          <span>·</span>
                          <small>{formatDate(attempt.completedAt ?? attempt.startedAt)}</small>
                        </div>
                      </div>
                    </div>

                    <div className="history-item-right">
                      {isDone ? (
                        <div className={`history-score-badge ${scoreBadgeClass}`}>
                          <strong>{attempt.correctCount}/{attempt.totalQuestions}</strong>
                          <small>{percent}%</small>
                        </div>
                      ) : (
                        <span className="status-pill status-progress">Đang làm dở</span>
                      )}

                      <span className="history-item-stat">
                        <Clock3 size={15} />
                        <span>{formatDuration(attempt.durationSeconds)}</span>
                      </span>

                      <span className="history-item-stat">
                        <Eye size={15} />
                        <span>{attempt.focusLossCount} rời tab</span>
                      </span>

                      <ArrowRight size={18} className="history-item-arrow" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
