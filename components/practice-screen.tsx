"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleHelp, Clock3, Eye, Lightbulb, XCircle } from "lucide-react";
import { getLearnerId } from "@/lib/learner";
import { formatDuration, normalizeAnswer } from "@/lib/format";
import type { Exam } from "@/lib/types";

type Mode = "choice" | "typing";
type Phase = "ready" | "question" | "feedback" | "result";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const awayRef = useRef(false);
  const learnerIdRef = useRef("");
  const current = exam.questions[index];
  const recordedAnswer = current ? answers[current.id] : undefined;
  const isCorrect = recordedAnswer !== undefined && normalizeAnswer(recordedAnswer) === normalizeAnswer(current.answer);

  useEffect(() => {
    learnerIdRef.current = getLearnerId();
  }, []);

  useEffect(() => {
    if (!startedAt || phase === "result") return;
    const interval = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(interval);
  }, [startedAt, phase]);

  const markAway = useCallback(() => {
    if (!attemptId || phase === "ready" || phase === "result" || awayRef.current) return;
    awayRef.current = true;
    setAwayCount((count) => count + 1);
    fetch(`/api/attempts/${attemptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: learnerIdRef.current, event: "focus_lost" }),
    }).catch(() => undefined);
  }, [attemptId, phase]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") markAway();
      else awayRef.current = false;
    };
    const onBlur = () => markAway();
    const onFocus = () => { awayRef.current = false; };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [markAway]);

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: learnerIdRef.current, examId: exam.id, level: mode }),
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
    setAnswers((existing) => ({ ...existing, [current.id]: answer }));
    setPhase("feedback");
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: learnerIdRef.current, answer: { questionId: current.id, answer } }),
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
    const payload = exam.questions.map((question) => ({ questionId: question.id, answer: finalAnswers[question.id] ?? "" }));
    try {
      const response = await fetch(`/api/attempts/${attemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: learnerIdRef.current, complete: true, answers: payload }),
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
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setDraft(answers[exam.questions[nextIndex].id] ?? "");
    setPhase("question");
  };

  const score = useMemo(
    () => exam.questions.reduce((sum, question) => sum + (answers[question.id] && normalizeAnswer(answers[question.id]) === normalizeAnswer(question.answer) ? 1 : 0), 0),
    [answers, exam.questions],
  );

  if (phase === "ready") {
    return (
      <div className="page-shell narrow-shell">
        <Link href={`/exams/${params.examId}`} className="back-link"><ArrowLeft size={16} /> Chọn lại cách luyện</Link>
        <section className="ready-card">
          <span className="ready-icon">✏️</span><span className="eyebrow muted-eyebrow">{mode === "typing" ? "LEVEL 2 · TỰ NHẬP ĐÁP ÁN" : "LEVEL 1 · TRẮC NGHIỆM"}</span>
          <h1>Sẵn sàng bắt đầu?</h1><p>{exam.title} · {exam.questions.length} câu hỏi</p>
          <div className="ready-list"><span><CheckCircle2 size={17} /> Mỗi câu có lời giải sau khi bạn trả lời</span><span><Clock3 size={17} /> Thời gian được tính từ lúc bắt đầu</span><span><Eye size={17} /> Số lần rời tab được ghi vào lịch sử</span></div>
          {error && <p className="inline-error">{error}</p>}
          <button className="button button-primary button-wide" onClick={() => void start()} disabled={busy}>{busy ? "Đang chuẩn bị…" : "Bắt đầu làm bài"}<ArrowRight size={17} /></button>
        </section>
      </div>
    );
  }

  if (phase === "result") {
    const percent = Math.round((score / exam.questions.length) * 100);
    return (
      <div className="page-shell narrow-shell">
        <section className="result-card">
          <div className="result-confetti" aria-hidden="true">✦　✧　✦</div>
          <span className="result-icon"><Check size={33} /></span>
          <span className="eyebrow muted-eyebrow">HOÀN THÀNH BÀI LUYỆN TẬP</span>
          <h1>{percent >= 80 ? "Tuyệt vời lắm!" : percent >= 50 ? "Bạn đã rất cố gắng!" : "Cùng luyện thêm nhé!"}</h1>
          <p className="result-score">{score}<span> / {exam.questions.length}</span></p>
          <p className="result-caption">câu trả lời đúng <span>·</span> {percent}%</p>
          <div className="result-stats"><div><strong>{exam.questions.length - score}</strong><span>Câu cần ôn thêm</span></div><div><strong>{formatDuration(elapsed)}</strong><span>Thời gian làm</span></div><div><strong>{awayCount}</strong><span>Lần rời màn hình</span></div></div>
          <div className="result-actions"><Link className="button button-primary" href={`/history/${attemptId}`}>Xem chi tiết <ArrowRight size={16} /></Link><Link className="button button-outline" href="/">Về trang chủ</Link></div>
        </section>
      </div>
    );
  }

  if (!current) return null;
  const progress = Math.round(((index + 1) / exam.questions.length) * 100);

  return (
    <div className="page-shell practice-shell">
      <div className="practice-topline"><Link href={`/exams/${exam.id}`} className="back-link"><ArrowLeft size={16} /> Thoát bài</Link><span className="timer-pill"><Clock3 size={15} /> {formatDuration(elapsed)}</span></div>
      <div className="practice-progress"><div className="progress-copy"><span>Câu <strong>{index + 1}</strong> / {exam.questions.length}</span><span>{progress}% hoàn thành</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>
      <section className="question-card">
        <div className="question-meta"><span className="question-section">{current.section}</span><span className="question-counter">CÂU {current.number}</span></div>
        <h1 className="question-prompt">{current.prompt.split("_____").map((part, partIndex, allParts) => <span key={`${partIndex}-${part}`}>{part}{partIndex < allParts.length - 1 && <span className="blank-mark">{recordedAnswer ?? draft ?? "?"}</span>}</span>)}</h1>
        <div className="source-word">Từ gợi ý <strong>{current.sourceWord}</strong></div>

        {mode === "choice" ? (
          <div className="choice-list">{(current.choices ?? []).map((choice, choiceIndex) => <button key={choice} className={`choice-button ${draft === choice ? "choice-selected" : ""} ${phase === "feedback" && choice === current.answer ? "choice-correct" : ""}`} onClick={() => phase === "question" && setDraft(choice)} disabled={phase === "feedback"}><span>{String.fromCharCode(65 + choiceIndex)}</span>{choice}{phase === "feedback" && choice === current.answer && <CheckCircle2 size={18} />}</button>)}</div>
        ) : (
          <label className={`answer-input-wrap ${phase === "feedback" ? (isCorrect ? "input-correct" : "input-wrong") : ""}`}>
            <span>Đáp án của bạn</span>
            <input autoComplete="off" value={phase === "feedback" ? recordedAnswer ?? "" : draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && phase === "question") checkAnswer(); }} disabled={phase === "feedback"} placeholder="Nhập đáp án tiếng Anh…" autoFocus />
            {phase === "feedback" && (isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />)}
          </label>
        )}

        {phase === "feedback" && <div className={`answer-feedback ${isCorrect ? "feedback-correct" : "feedback-wrong"}`}><div className="feedback-title">{isCorrect ? <><CheckCircle2 size={19} /> Chính xác, giỏi lắm!</> : <><Lightbulb size={19} /> Đáp án đúng là: <strong>{current.answer}</strong></>}</div><p>{current.explanation}</p></div>}
        {error && <p className="inline-error">{error}</p>}
        {phase === "question" ? <button className="button button-primary button-wide" onClick={() => void checkAnswer()} disabled={!draft.trim() || busy}>{busy ? "Đang kiểm tra…" : "Kiểm tra đáp án"}<Check size={17} /></button> : <button className="button button-primary button-wide" onClick={nextQuestion} disabled={busy}>{busy ? "Đang lưu câu trả lời…" : index === exam.questions.length - 1 ? "Hoàn thành bài" : "Câu tiếp theo"}<ArrowRight size={17} /></button>}
      </section>
      <p className="practice-footer-note"><CircleHelp size={15} /> Trả lời xong mới xem được giải thích nhé!</p>
    </div>
  );
}

export function PracticeScreen({ exam }: { exam: Exam }) {
  return <Suspense fallback={<div className="page-shell narrow-shell"><div className="loading-card">Đang mở bài học…</div></div>}><PracticeContent exam={exam} /></Suspense>;
}
