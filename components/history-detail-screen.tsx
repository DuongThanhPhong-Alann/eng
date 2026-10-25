"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Lightbulb,
  MapPin,
  Network,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { getLearnerId } from "@/lib/learner";
import { formatDate, formatDuration } from "@/lib/format";
import { playClickSound, playSelectSound, playStartSound } from "@/lib/sound";
import type { AttemptDetail } from "@/lib/types";

export function HistoryDetailScreen({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "wrong" | "correct">("all");

  useEffect(() => {
    const learnerId = getLearnerId();
    fetch(`/api/history/${attemptId}?learnerId=${encodeURIComponent(learnerId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Không thể tải chi tiết lần làm bài.");
        setAttempt(data.attempt);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : "Không thể kết nối máy chủ.")
      )
      .finally(() => setLoading(false));
  }, [attemptId]);

  const filteredAnswers = useMemo(() => {
    if (!attempt?.answers) return [];
    if (filterMode === "wrong") {
      return attempt.answers.filter((a) => !a.isCorrect);
    }
    if (filterMode === "correct") {
      return attempt.answers.filter((a) => a.isCorrect);
    }
    return attempt.answers;
  }, [attempt, filterMode]);

  return (
    <div className="page-shell history-detail-shell">
      <Link href="/history" className="back-link" onClick={() => playClickSound()}>
        <ArrowLeft size={18} />
        <span>Quay lại danh sách lịch sử</span>
      </Link>

      {loading ? (
        <div className="loading-card">
          <span className="loading-spinner" />
          <span>Đang tải chi tiết bài làm…</span>
        </div>
      ) : error ? (
        <div className="database-note">
          {error.includes("MONGODB_URI") ? (
            <>
              💡 Hãy cấu hình <code>MONGODB_URI</code> trong <code>.env.local</code> để xem lịch
              sử chi tiết.
            </>
          ) : (
            error
          )}
        </div>
      ) : attempt ? (
        <>
          {/* Header tổng quan kết quả */}
          <section className="attempt-detail-head">
            <div className="eyebrow-tag">
              <Sparkles size={14} /> CHI TIẾT BÀI ÔN TẬP
            </div>
            <h1 className="attempt-title">{attempt.examTitle}</h1>
            <p className="attempt-subtitle">
              <span>{attempt.level === "typing" ? "✍️ Level 2: Tự gõ đáp án" : "⚡ Level 1: Trắc nghiệm"}</span>
              <span>·</span>
              <span>{formatDate(attempt.completedAt ?? attempt.startedAt)}</span>
            </p>

            <div className="attempt-stats-row">
              <div className="stat-pill-box main-score-box">
                <span className="stat-box-label">Điểm số</span>
                <div className="stat-box-val score-highlight">
                  {attempt.correctCount ?? 0}
                  <small> / {attempt.totalQuestions}</small>
                </div>
              </div>

              <div className="stat-pill-box">
                <span className="stat-box-label">
                  <CheckCircle2 size={15} className="correct-icon" /> Câu đúng
                </span>
                <strong className="stat-box-val">{attempt.correctCount ?? 0}</strong>
              </div>

              <div className="stat-pill-box">
                <span className="stat-box-label">
                  <XCircle size={15} className="wrong-icon" /> Câu chưa đúng
                </span>
                <strong className="stat-box-val">{attempt.wrongCount ?? 0}</strong>
              </div>

              <div className="stat-pill-box">
                <span className="stat-box-label">
                  <Clock3 size={15} /> Thời gian làm
                </span>
                <strong className="stat-box-val">{formatDuration(attempt.durationSeconds)}</strong>
              </div>

              <div className="stat-pill-box">
                <span className="stat-box-label">
                  <Eye size={15} /> Rời màn hình
                </span>
                <strong className="stat-box-val">{attempt.focusLossCount} lần</strong>
              </div>
            </div>

            <div className="attempt-location-details">
              <div>
                <Network size={16} />
                <span>IP kết nối máy làm bài</span>
                <strong>{attempt.ipAddress || "Không có dữ liệu IP"}</strong>
              </div>
              <div>
                <MapPin size={16} />
                <span>Vị trí làm bài</span>
                {attempt.location ? (
                  <strong>
                    {attempt.location.latitude.toFixed(5)}, {attempt.location.longitude.toFixed(5)}
                    <small> · sai số khoảng {Math.round(attempt.location.accuracyMeters)} m</small>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${attempt.location.latitude}&mlon=${attempt.location.longitude}#map=16/${attempt.location.latitude}/${attempt.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Mở bản đồ
                    </a>
                  </strong>
                ) : (
                  <strong>Không có dữ liệu vị trí (chưa cấp quyền hoặc lượt làm cũ)</strong>
                )}
              </div>
            </div>
          </section>

          <section className="focus-loss-history">
            <div className="focus-loss-heading">
              <Eye size={17} />
              <h2>Thời điểm rời màn hình</h2>
              <span>{attempt.focusLossEvents?.length ?? 0} lần</span>
            </div>
            {attempt.focusLossEvents?.length ? (
              <ol>
                {attempt.focusLossEvents.map((event, index) => {
                  const awaySeconds = event.returnedAt
                    ? Math.max(
                        0,
                        Math.round(
                          (new Date(event.returnedAt).getTime() - new Date(event.leftAt).getTime()) /
                            1000,
                        ),
                      )
                    : null;
                  return (
                    <li key={`${event.leftAt}-${index}`}>
                      <span className="focus-loss-index">{index + 1}</span>
                      <div>
                        <strong>Rời màn hình lúc {formatDate(event.leftAt)}</strong>
                        {event.returnedAt ? (
                          <small>
                            Quay lại lúc {formatDate(event.returnedAt)} · ngoài màn hình {formatDuration(awaySeconds)}
                          </small>
                        ) : (
                          <small>Chưa ghi nhận thời điểm quay lại</small>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p>Chưa ghi nhận lần rời màn hình nào trong lượt làm bài này.</p>
            )}
          </section>

          {attempt.status === "in_progress" && (
            <div className="database-note">
              <span>⚠️ Lần làm bài này chưa hoàn tất, bạn có thể luyện lại từ đầu nhé!</span>
            </div>
          )}

          {/* Khu vực ôn tập từng câu hỏi */}
          <section className="answer-review">
            <div className="review-section-header">
              <div>
                <div className="eyebrow-tag">
                  <BookOpen size={14} /> ÔN TẬP & SỬA LỖI
                </div>
                <h2>Chi tiết từng câu hỏi ({attempt.answers.length} câu)</h2>
              </div>

              {/* Bộ lọc câu đúng / sai cực kỳ hữu ích cho học sinh */}
              <div className="review-filter-tabs">
                <button
                  type="button"
                  className={`filter-btn ${filterMode === "all" ? "filter-active" : ""}`}
                  onClick={() => {
                    playSelectSound();
                    setFilterMode("all");
                  }}
                >
                  Tất cả ({attempt.answers.length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${filterMode === "wrong" ? "filter-active" : ""}`}
                  onClick={() => {
                    playSelectSound();
                    setFilterMode("wrong");
                  }}
                >
                  ❌ Chỉ câu sai ({attempt.wrongCount ?? 0})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${filterMode === "correct" ? "filter-active" : ""}`}
                  onClick={() => {
                    playSelectSound();
                    setFilterMode("correct");
                  }}
                >
                  ✅ Câu đúng ({attempt.correctCount ?? 0})
                </button>
              </div>
            </div>

            {filteredAnswers.length === 0 ? (
              <div className="empty-strip">
                <span className="empty-bubble">🎉</span>
                <div>
                  <strong>
                    {filterMode === "wrong"
                      ? "Tuyệt vời! Bạn không làm sai câu nào cả!"
                      : "Không có câu hỏi nào trong mục này"}
                  </strong>
                  <span>Bạn đang làm rất xuất sắc, hãy tiếp tục phát huy nhé!</span>
                </div>
              </div>
            ) : (
              <div className="review-cards-list">
                {filteredAnswers.map((answer) => (
                  <article
                    className={`review-card ${
                      answer.isCorrect ? "review-card-correct" : "review-card-wrong"
                    }`}
                    key={answer.questionId}
                  >
                    <div className="review-card-top">
                      <span className="review-index-pill">
                        Câu {answer.number} <span>·</span> {answer.section}
                      </span>
                      <span
                        className={`review-status-tag ${
                          answer.isCorrect ? "status-tag-correct" : "status-tag-wrong"
                        }`}
                      >
                        {answer.isCorrect ? (
                          <>
                            <CheckCircle2 size={16} /> Chính xác
                          </>
                        ) : (
                          <>
                            <XCircle size={16} /> Chưa đúng
                          </>
                        )}
                      </span>
                    </div>

                    <p className="review-prompt">{answer.prompt}</p>

                    <div className="review-answers-box">
                      <div className="answer-line-user">
                        <span className="line-label">Đáp án của bạn:</span>
                        <strong
                          className={answer.isCorrect ? "answer-val-correct" : "answer-val-wrong"}
                        >
                          {answer.submittedAnswer || "(Bỏ trống)"}
                        </strong>
                      </div>

                      {!answer.isCorrect && (
                        <div className="answer-line-correct">
                          <span className="line-label">Đáp án đúng chuẩn:</span>
                          <strong className="answer-val-key">{answer.correctAnswer}</strong>
                        </div>
                      )}
                    </div>

                    <div className="review-explanation-box">
                      <div className="explanation-head">
                        <Lightbulb size={17} />
                        <span>Lời giải thích chi tiết:</span>
                      </div>
                      <p className="explanation-body">{answer.explanation}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Nút hành động */}
          <div className="detail-actions-bar">
            <Link
              className="button button-primary button-lg"
              href={`/exams/${attempt.examId}`}
              onClick={() => playStartSound()}
            >
              <RotateCcw size={18} />
              <span>Luyện lại đề này</span>
            </Link>

            <Link
              className="button button-ghost button-lg"
              href="/"
              onClick={() => playClickSound()}
            >
              <span>Về trang chủ</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
