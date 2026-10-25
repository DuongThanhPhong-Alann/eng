"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Check, Clock3, Sparkles, Target } from "lucide-react";
import { getLearnerId } from "@/lib/learner";
import { formatDate, formatDuration } from "@/lib/format";
import type { AttemptSummary, Exam } from "@/lib/types";

export function HomeScreen({ exams }: { exams: Exam[] }) {
  const [examList, setExamList] = useState(exams);
  const [recent, setRecent] = useState<AttemptSummary[]>([]);
  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);

  useEffect(() => {
    const learnerId = getLearnerId();
    fetch("/api/exams").then(async (response) => {
      const data = await response.json();
      setDatabaseReady(response.ok && data.databaseReady === true);
      if (response.ok && Array.isArray(data.exams)) setExamList(data.exams);
    }).catch(() => setDatabaseReady(false));
    fetch(`/api/history?learnerId=${encodeURIComponent(learnerId)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.attempts) setRecent(data.attempts); })
      .catch(() => undefined);
  }, []);

  const completed = recent.filter((attempt) => attempt.status === "completed");
  const average = completed.length
    ? Math.round(completed.reduce((sum, attempt) => sum + (attempt.correctCount ?? 0), 0) / completed.length)
    : null;

  return (
    <div className="page-shell home-shell">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="eyebrow"><Sparkles size={15} /> GÓC HỌC TẬP CỦA BẠN</span>
          <h1>Học tiếng Anh<br /><span>thật vui nhé!</span></h1>
          <p>Mỗi câu trả lời đúng là một bước tiến nhỏ. Chọn bộ câu hỏi và bắt đầu thôi!</p>
          <a className="button button-primary" href="#de-hoc">Chọn bài học <ArrowRight size={17} /></a>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-book"><BookOpen size={69} strokeWidth={1.55} /></div>
          <span className="art-star star-one">✦</span><span className="art-star star-two">✦</span>
          <span className="art-sparkle">✧</span>
          <div className="art-caption">little steps,<br />big progress!</div>
        </div>
        <div className="banner-footnote"><span className="banner-dot" /> Học theo nhịp độ của riêng bạn</div>
      </section>

      <section className="stats-row" aria-label="Tổng quan học tập">
        <div className="stat-card stat-mint"><span className="stat-icon"><BookOpen size={19} /></span><div><strong>{examList.length}</strong><span>Bộ câu hỏi</span></div></div>
        <div className="stat-card stat-lilac"><span className="stat-icon"><Target size={19} /></span><div><strong>{completed.length}</strong><span>Lần hoàn thành</span></div></div>
        <div className="stat-card stat-peach"><span className="stat-icon"><Check size={19} /></span><div><strong>{average === null ? "—" : average}</strong><span>Điểm đúng TB / đề</span></div></div>
      </section>

      <section className="section-block" id="de-hoc">
        <div className="section-heading">
          <div><span className="eyebrow muted-eyebrow">THƯ VIỆN CÂU HỎI</span><h2>Chọn một bài học</h2></div>
          <span className="section-caption">Bài mới sẽ được thêm khi bạn gửi đề</span>
        </div>
        {databaseReady === false && <div className="database-note">Để lưu bài làm và lịch sử vào MongoDB, hãy cấu hình <code>MONGODB_URI</code> trong tệp <code>.env.local</code>.</div>}
        <div className="exam-grid">
          {examList.map((exam) => (
            <article className="exam-card" key={exam.id}>
              <div className="exam-card-top"><span className="subject-icon"><BookOpen size={21} /></span><span className="new-pill">ĐANG LUYỆN TẬP</span></div>
              <p className="exam-unit">UNIT 3 <span>·</span> COMMUNITY SERVICE</p>
              <h3>{exam.title}</h3>
              <p className="exam-subtitle">{exam.subtitle}</p>
              <p className="exam-description">{exam.description}</p>
              <div className="exam-meta"><span><BookOpen size={15} /> {exam.questions.length} câu</span><span><Clock3 size={15} /> Tự chọn thời gian</span></div>
              <Link className="button button-soft" href={`/exams/${exam.id}`}>Xem bài học <ArrowRight size={16} /></Link>
            </article>
          ))}
          <div className="coming-card"><span className="coming-icon">✿</span><strong>Còn nhiều bài học<br />đang chờ bạn</strong><span>Các bộ đề tiếp theo sẽ xuất hiện ở đây.</span></div>
        </div>
      </section>

      <section className="recent-section">
        <div className="section-heading"><div><span className="eyebrow muted-eyebrow">HÀNH TRÌNH CỦA BẠN</span><h2>Lần học gần đây</h2></div><Link className="text-link" href="/history">Xem tất cả <ArrowRight size={15} /></Link></div>
        {recent.length === 0 ? (
          <div className="empty-strip"><span className="empty-bubble">☀</span><div><strong>Chưa có lần làm bài nào</strong><span>Bài đầu tiên đang đợi bạn ở phía trên đó!</span></div></div>
        ) : (
          <div className="recent-list">
            {recent.slice(0, 3).map((attempt) => (
              <Link className="recent-row" key={attempt.id} href={`/history/${attempt.id}`}>
                <span className="recent-row-icon"><BookOpen size={18} /></span>
                <span className="recent-row-main"><strong>{attempt.examTitle}</strong><small>{formatDate(attempt.completedAt ?? attempt.startedAt)}</small></span>
                <span className={`status-pill ${attempt.status === "completed" ? "status-done" : "status-progress"}`}>{attempt.status === "completed" ? `${attempt.correctCount}/${attempt.totalQuestions} câu đúng` : "Đang làm dở"}</span>
                <span className="recent-duration">{formatDuration(attempt.durationSeconds)}</span><ArrowRight size={16} className="recent-arrow" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
