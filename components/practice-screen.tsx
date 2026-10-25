"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Flame,
  HelpCircle,
  Lightbulb,
  PartyPopper,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from "lucide-react";
import { getLearnerId } from "@/lib/learner";
import { formatDuration, normalizeAnswer } from "@/lib/format";
import {
  isSoundEnabled,
  playClickSound,
  playCorrectSound,
  playFanfareSound,
  playNextSound,
  playSelectSound,
  playStartSound,
  playWrongSound,
  setSoundEnabled,
} from "@/lib/sound";
import type { Exam } from "@/lib/types";

type Mode = "choice" | "typing";
type Phase = "ready" | "question" | "feedback" | "result";
type LocationSnapshot = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
} | null;

function requestDeviceLocation(): Promise<LocationSnapshot> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracy,
          capturedAt: new Date(timestamp).toISOString(),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 7_000 },
    );
  });
}

const PRAISE_MESSAGES = [
  "Chính xác, bạn làm quá đỉnh! 🎉",
  "Tuyệt vời, thêm một điểm 10 kiến thức! 🌟",
  "Xuất sắc! Phong độ rất vững vàng! 🚀",
  "Đỉnh nóc! Bạn nhớ từ siêu chuẩn! 💯",
  "Rất tốt! Cứ tiếp tục phát huy nhé! 👏",
];

const ENCOURAGE_MESSAGES = [
  "Không sao cả, sai là mẹ thành công! Cùng nhớ từ này nhé! 💪",
  "Đừng nản nhé, xem giải thích bên dưới để nhớ lâu hơn nè! 🌱",
  "Một chút nhầm lẫn thôi, ghi nhớ mẹo này cho lần sau nha! 💡",
  "Học là một hành trình, bạn đang tiến bộ qua từng câu đấy! ✨",
];

function PracticeContent({ exam }: { exam: Exam }) {
  const params = useParams<{ examId: string }>();
  const searchParams = useSearchParams();
  const mode: Mode = searchParams.get("mode") === "choice" ? "choice" : "typing";

  const [phase, setPhase] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [awayCount, setAwayCount] = useState(0);
  const [showAwayToast, setShowAwayToast] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [feedbackCheer, setFeedbackCheer] = useState("");

  const awayRef = useRef(false);
  const learnerIdRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  const current = exam.questions[index];
  const recordedAnswer = current ? answers[current.id] : undefined;
  const isCorrect =
    recordedAnswer !== undefined &&
    normalizeAnswer(recordedAnswer) === normalizeAnswer(current.answer);

  useEffect(() => {
    learnerIdRef.current = getLearnerId();
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      setTimeout(() => playSelectSound(), 50);
    }
  };

  useEffect(() => {
    if (!startedAt || phase === "result") return;
    const interval = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000
    );
    return () => window.clearInterval(interval);
  }, [startedAt, phase]);

  const markAway = useCallback(() => {
    if (!attemptId || phase === "ready" || phase === "result" || awayRef.current) return;
    awayRef.current = true;
    setAwayCount((count) => count + 1);
    setShowAwayToast(true);
    window.setTimeout(() => setShowAwayToast(false), 3500);

    fetch(`/api/attempts/${attemptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: learnerIdRef.current, event: "focus_lost" }),
      keepalive: true,
    }).catch(() => undefined);
  }, [attemptId, phase]);

  const markReturn = useCallback(() => {
    if (!attemptId || !awayRef.current) return;
    awayRef.current = false;
    fetch(`/api/attempts/${attemptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: learnerIdRef.current, event: "focus_returned" }),
      keepalive: true,
    }).catch(() => undefined);
  }, [attemptId]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") markAway();
      else markReturn();
    };
    const onBlur = () => markAway();
    const onFocus = () => markReturn();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [markAway, markReturn]);

  const start = async () => {
    playStartSound();
    setBusy(true);
    setError("");
    try {
      const location = await requestDeviceLocation();
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: learnerIdRef.current,
          examId: exam.id,
          level: mode,
          location,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể bắt đầu bài làm.");
      setAttemptId(result.attemptId);
      const startTime = new Date(result.startedAt).getTime();
      setStartedAt(startTime);
      setPhase("question");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể kết nối máy chủ.");
    } finally {
      setBusy(false);
    }
  };

  const checkAnswer = async () => {
    const answer = draft.trim();
    if (!answer || !current) return;

    const answerIsCorrect = normalizeAnswer(answer) === normalizeAnswer(current.answer);

    if (answerIsCorrect) {
      playCorrectSound();
      const randomCheer = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      setFeedbackCheer(randomCheer);
    } else {
      playWrongSound();
      const randomEncourage =
        ENCOURAGE_MESSAGES[Math.floor(Math.random() * ENCOURAGE_MESSAGES.length)];
      setFeedbackCheer(randomEncourage);
    }

    setAnswers((existing) => ({ ...existing, [current.id]: answer }));
    setPhase("feedback");
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: learnerIdRef.current,
          answer: { questionId: current.id, answer },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể lưu câu trả lời.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể kết nối máy chủ.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async (finalAnswers: Record<string, string>) => {
    setBusy(true);
    setError("");
    playFanfareSound();

    const payload = exam.questions.map((question) => ({
      questionId: question.id,
      answer: finalAnswers[question.id] ?? "",
    }));

    try {
      const response = await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId: learnerIdRef.current,
          complete: true,
          answers: payload,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể nộp bài.");
      setPhase("result");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể kết nối máy chủ.");
    } finally {
      setBusy(false);
    }
  };

  const nextQuestion = () => {
    if (index === exam.questions.length - 1) {
      void finish(answers);
      return;
    }
    playNextSound();
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setDraft(answers[exam.questions[nextIndex].id] ?? "");
    setPhase("question");
    setFeedbackCheer("");
  };

  // Focus input automatically on question change in typing mode
  useEffect(() => {
    if (phase === "question" && mode === "typing") {
      inputRef.current?.focus();
    }
  }, [phase, index, mode]);

  // Keyboard shortcut listener for options (1-4, A-D) and Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts if typing in an input
      if (phase === "question" && mode === "choice") {
        const choices = current?.choices ?? [];
        if (["1", "2", "3", "4"].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (choices[idx]) {
            e.preventDefault();
            playSelectSound();
            setDraft(choices[idx]);
          }
        } else if (["a", "b", "c", "d", "A", "B", "C", "D"].includes(e.key)) {
          const charCode = e.key.toUpperCase().charCodeAt(0);
          const idx = charCode - 65;
          if (choices[idx]) {
            e.preventDefault();
            playSelectSound();
            setDraft(choices[idx]);
          }
        } else if (e.key === "Enter" && draft.trim()) {
          e.preventDefault();
          void checkAnswer();
        }
      } else if (phase === "feedback") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          nextQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, mode, current, draft, index, answers]);

  const score = useMemo(
    () =>
      exam.questions.reduce(
        (sum, question) =>
          sum +
          (answers[question.id] &&
          normalizeAnswer(answers[question.id]) === normalizeAnswer(question.answer)
            ? 1
            : 0),
        0
      ),
    [answers, exam.questions]
  );

  const answeredCount = Object.keys(answers).length;

  // 1. PHASE: READY TO START
  if (phase === "ready") {
    return (
      <div className="page-shell narrow-shell">
        <Link
          href={`/exams/${params.examId}`}
          className="back-link"
          onClick={() => playClickSound()}
        >
          <ArrowLeft size={18} />
          <span>Chọn lại chế độ làm bài</span>
        </Link>

        <section className="ready-card">
          <div className="ready-mascot-circle">
            <span className="ready-emoji">🎒</span>
          </div>

          <div className="eyebrow-tag">
            {mode === "typing" ? "✍️ LEVEL 2 · TỰ GÕ ĐÁP ÁN" : "⚡ LEVEL 1 · TRẮC NGHIỆM A-B-C-D"}
          </div>

          <h1 className="ready-title">Sẵn sàng chinh phục bài học?</h1>
          <p className="ready-desc">
            {exam.title} <span>·</span> {exam.questions.length} câu hỏi từ vựng hấp dẫn
          </p>

          <div className="ready-checklist">
            <div className="checklist-item">
              <span className="check-bullet">
                <Check size={16} />
              </span>
              <span>
                <strong>Học qua từng câu:</strong> Xem đáp án và lời giải tiếng Việt chi tiết ngay sau mỗi câu trả lời.
              </span>
            </div>
            <div className="checklist-item">
              <span className="check-bullet">
                <Sparkles size={16} />
              </span>
              <span>
                <strong>Phím tắt tiện lợi:</strong> {mode === "choice" ? "Nhấn 1-4 hoặc A-D để chọn đáp án, nhấn Enter để kiểm tra." : "Gõ đáp án và nhấn Enter để kiểm tra ngay."}
              </span>
            </div>
            <div className="checklist-item">
              <span className="check-bullet">
                <Clock3 size={16} />
              </span>
              <span>
                <strong>Tự do nhịp độ:</strong> Không đếm ngược ép thời gian, làm bài thật cẩn thận để nhớ lâu!
              </span>
            </div>
          </div>

          <p className="attempt-location-notice">
            Khi bắt đầu, hệ thống lưu IP kết nối. Trình duyệt sẽ hỏi quyền ghi nhận vị trí thiết bị; tính năng vị trí cần HTTPS hoặc localhost. Nếu không khả dụng hoặc bạn từ chối, bài làm vẫn bắt đầu và vị trí sẽ để trống.
          </p>

          {error && <p className="inline-error">{error}</p>}

          <button
            type="button"
            className="button button-primary button-start-practice"
            onClick={() => void start()}
            disabled={busy}
          >
            <span>{busy ? "Đang chuẩn bị đề thi…" : "Bắt đầu làm bài ngay"}</span>
            <ArrowRight size={20} />
          </button>
        </section>
      </div>
    );
  }

  // 2. PHASE: RESULT CELEBRATION
  if (phase === "result") {
    const percent = Math.round((score / exam.questions.length) * 100);

    let cheerHeading = "Tuyệt đỉnh xuất sắc! 🏆";
    let cheerSub = "Bạn nắm rất vững từ vựng và ngữ pháp của bài học này!";
    let starCount = 3;

    if (percent < 50) {
      cheerHeading = "Khởi đầu rất cố gắng! 🌱";
      cheerSub = "Đừng nản nhé! Xem lại các câu sai bên dưới và luyện lại một lần nữa sẽ nhớ như in!";
      starCount = 1;
    } else if (percent < 80) {
      cheerHeading = "Làm tốt lắm bạn ơi! 🌟";
      cheerSub = "Bạn đã hoàn thành rất tốt, chỉ cần ôn lại một vài từ nhỏ nữa là đạt điểm tối đa!";
      starCount = 2;
    }

    return (
      <div className="page-shell narrow-shell">
        <section className="result-card">
          <div className="result-sparkles-top" aria-hidden="true">
            ✨ ✦ 🌟 ✦ ✨
          </div>

          <div className="result-stars-row">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`star-pill ${s <= starCount ? "star-active" : "star-inactive"}`}
              >
                ★
              </span>
            ))}
          </div>

          <div className="eyebrow-tag">HOÀN THÀNH BÀI ÔN TẬP</div>
          <h1 className="result-heading">{cheerHeading}</h1>
          <p className="result-subheading">{cheerSub}</p>

          <div className="result-score-banner">
            <div className="score-big-number">
              {score}
              <span className="score-max">/{exam.questions.length}</span>
            </div>
            <div className="score-percent-badge">{percent}% chính xác</div>
          </div>

          <div className="result-stats-grid">
            <div className="stat-result-box box-correct">
              <span className="box-icon">
                <CheckCircle2 size={18} />
              </span>
              <strong>{score} câu</strong>
              <span>Trả lời đúng</span>
            </div>

            <div className="stat-result-box box-wrong">
              <span className="box-icon">
                <XCircle size={18} />
              </span>
              <strong>{exam.questions.length - score} câu</strong>
              <span>Cần ôn thêm</span>
            </div>

            <div className="stat-result-box box-time">
              <span className="box-icon">
                <Clock3 size={18} />
              </span>
              <strong>{formatDuration(elapsed)}</strong>
              <span>Thời gian làm</span>
            </div>

            <div className="stat-result-box box-focus">
              <span className="box-icon">
                <Eye size={18} />
              </span>
              <strong>{awayCount} lần</strong>
              <span>Rời màn hình</span>
            </div>
          </div>

          <div className="result-actions-group">
            <Link
              className="button button-primary button-lg"
              href={`/history/${attemptId}`}
              onClick={() => playClickSound()}
            >
              <BookOpen size={18} />
              <span>Xem lại chi tiết từng câu</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              className="button button-soft button-lg"
              href={`/exams/${exam.id}`}
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
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // 3. PHASE: QUESTION OR FEEDBACK
  if (!current) return null;
  const progressPercent = Math.round(((index + 1) / exam.questions.length) * 100);

  return (
    <div className="page-shell practice-shell">
      {/* Toast cảnh báo nhẹ nhàng khi rời màn hình */}
      {showAwayToast && (
        <div className="away-toast">
          <Eye size={18} />
          <span>Bạn vừa chuyển tab (lần thứ {awayCount}). Hãy tập trung để ghi điểm cao nhé!</span>
        </div>
      )}

      {/* Topline controls */}
      <div className="practice-topline">
        <Link
          href={`/exams/${exam.id}`}
          className="back-link practice-exit-btn"
          onClick={() => playClickSound()}
        >
          <ArrowLeft size={18} />
          <span>Tạm dừng</span>
        </Link>

        <div className="topline-center-pill">
          <span className="exam-name-pill">{exam.title}</span>
        </div>

        <div className="topline-right-group">
          <button
            type="button"
            className="practice-sound-btn"
            onClick={toggleSound}
            title={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <span className="timer-pill">
            <Clock3 size={15} />
            <span>{formatDuration(elapsed)}</span>
          </span>
        </div>
      </div>

      {/* Thanh tiến độ học tập sinh động */}
      <div className="practice-progress-block">
        <div className="progress-labels">
          <span className="progress-counter">
            Câu <strong>{index + 1}</strong> / {exam.questions.length}
          </span>
          <span className="live-score-pill">
            <CheckCircle2 size={14} className="score-check-icon" />
            <span>Đã làm đúng: {score}/{answeredCount}</span>
          </span>
          <span className="progress-percent">{progressPercent}%</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Card câu hỏi trung tâm */}
      <section className="question-card">
        <div className="question-meta-row">
          <span className="question-section-tag">{current.section}</span>
          <span className="question-number-pill">CÂU SỐ {current.number}</span>
        </div>

        {/* Nội dung câu hỏi với chỗ trống nổi bật */}
        <div className="question-prompt-box">
          <h2 className="question-prompt-text">
            {current.prompt.split("_____").map((part, partIndex, allParts) => (
              <span key={`${partIndex}-${part}`}>
                {part}
                {partIndex < allParts.length - 1 && (
                  <span
                    className={`blank-slot ${
                      phase === "feedback"
                        ? isCorrect
                          ? "blank-correct"
                          : "blank-wrong"
                        : draft
                        ? "blank-filled"
                        : "blank-empty"
                    }`}
                  >
                    {phase === "feedback"
                      ? recordedAnswer || "..."
                      : draft.trim()
                      ? draft
                      : "______"}
                  </span>
                )}
              </span>
            ))}
          </h2>
        </div>

        {/* Dạng từ gốc (Word Form hint) */}
        <div className="source-word-pill">
          <span className="source-word-label">Từ cần chia dạng:</span>
          <strong className="source-word-val">{current.sourceWord}</strong>
        </div>

        {/* Chế độ trắc nghiệm A-B-C-D */}
        {mode === "choice" ? (
          <div className="choice-grid">
            {(current.choices ?? []).map((choice, choiceIndex) => {
              const letter = String.fromCharCode(65 + choiceIndex);
              const isSelected = draft === choice;
              const isAnswerKey = phase === "feedback" && choice === current.answer;
              const isWrongSelection =
                phase === "feedback" && isSelected && choice !== current.answer;

              let buttonClass = "choice-card";
              if (isSelected) buttonClass += " choice-selected";
              if (isAnswerKey) buttonClass += " choice-correct-state";
              if (isWrongSelection) buttonClass += " choice-wrong-state";

              return (
                <button
                  key={choice}
                  type="button"
                  className={buttonClass}
                  onClick={() => {
                    if (phase === "question") {
                      playSelectSound();
                      setDraft(choice);
                    }
                  }}
                  disabled={phase === "feedback"}
                >
                  <span className="choice-letter-badge">{letter}</span>
                  <span className="choice-text">{choice}</span>
                  <span className="choice-shortcut-hint">[{letter}]</span>
                  {isAnswerKey && (
                    <CheckCircle2 size={20} className="choice-icon-state correct-icon" />
                  )}
                  {isWrongSelection && (
                    <XCircle size={20} className="choice-icon-state wrong-icon" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Chế độ tự gõ từ */
          <div className="typing-input-wrapper">
            <label htmlFor="answer-input" className="typing-label">
              <span>Nhập dạng đúng của từ:</span>
              <span className="typing-subhint">(Nhấn phím Enter để kiểm tra)</span>
            </label>
            <div
              className={`typing-input-box ${
                phase === "feedback"
                  ? isCorrect
                    ? "input-box-correct"
                    : "input-box-wrong"
                  : ""
              }`}
            >
              <input
                id="answer-input"
                ref={inputRef}
                type="text"
                autoComplete="off"
                spellCheck="false"
                value={phase === "feedback" ? recordedAnswer ?? "" : draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && phase === "question") {
                    void checkAnswer();
                  }
                }}
                disabled={phase === "feedback"}
                placeholder="Gõ từ tiếng Anh vào đây..."
                className="typing-field"
              />
              {phase === "feedback" && (
                <span className="typing-feedback-icon">
                  {isCorrect ? (
                    <CheckCircle2 size={22} className="correct-icon" />
                  ) : (
                    <XCircle size={22} className="wrong-icon" />
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Hộp phản hồi & Lời giải tiếng Việt sau khi trả lời */}
        {phase === "feedback" && (
          <div
            className={`feedback-box ${isCorrect ? "feedback-box-success" : "feedback-box-alert"}`}
          >
            <div className="feedback-header">
              {isCorrect ? (
                <>
                  <PartyPopper size={22} className="feedback-icon" />
                  <span className="feedback-cheer-title">{feedbackCheer}</span>
                </>
              ) : (
                <>
                  <AlertCircle size={22} className="feedback-icon" />
                  <div className="feedback-wrong-header">
                    <span className="feedback-cheer-title">{feedbackCheer}</span>
                    <div className="correct-answer-callout">
                      Đáp án đúng là: <strong>{current.answer}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="feedback-explanation">
              <div className="explanation-title">
                <Lightbulb size={18} />
                <span>Giải thích ngữ pháp & ngữ nghĩa:</span>
              </div>
              <p className="explanation-text">{current.explanation}</p>
            </div>
          </div>
        )}

        {error && <p className="inline-error">{error}</p>}

        {/* Nút kiểm tra hoặc tiếp tục */}
        <div className="practice-action-row">
          {phase === "question" ? (
            <button
              type="button"
              className="button button-primary button-action-main"
              onClick={() => void checkAnswer()}
              disabled={!draft.trim() || busy}
            >
              <span>{busy ? "Đang chấm điểm…" : "Kiểm tra đáp án"}</span>
              <Check size={18} />
              <span className="key-hint">Enter ↵</span>
            </button>
          ) : (
            <button
              type="button"
              className="button button-primary button-action-main"
              onClick={nextQuestion}
              disabled={busy}
              autoFocus
            >
              <span>
                {busy
                  ? "Đang lưu câu trả lời…"
                  : index === exam.questions.length - 1
                  ? "Xem kết quả bài làm"
                  : "Câu tiếp theo"}
              </span>
              <ArrowRight size={18} />
              <span className="key-hint">Enter ↵</span>
            </button>
          )}
        </div>
      </section>

      {/* Mẹo nhỏ dưới chân trang */}
      <div className="practice-footer-tip">
        <Sparkles size={16} />
        <span>
          {mode === "choice"
            ? "Mẹo: Bạn có thể nhấn phím 1, 2, 3, 4 trên bàn phím để chọn nhanh đáp án!"
            : "Mẹo: Hãy kiểm tra kỹ chính tả tiếng Anh trước khi bấm Kiểm tra nhé!"}
        </span>
      </div>
    </div>
  );
}

export function PracticeScreen({ exam }: { exam: Exam }) {
  return (
    <Suspense
      fallback={
        <div className="page-shell narrow-shell">
          <div className="loading-card">
            <span className="loading-spinner" />
            <span>Đang chuẩn bị bài học vui cho bạn…</span>
          </div>
        </div>
      }
    >
      <PracticeContent exam={exam} />
    </Suspense>
  );
}
