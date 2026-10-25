"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  Flame,
  HelpCircle,
  Keyboard,
  ListChecks,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { getLearnerId } from "@/lib/learner";
import { formatDate, formatDuration } from "@/lib/format";
import { playClickSound, playStartSound } from "@/lib/sound";
import type { AttemptSummary, Exam } from "@/lib/types";

export function HomeScreen({ exams }: { exams: Exam[] }) {
  const [examList, setExamList] = useState<Exam[]>(exams);
  const [recent, setRecent] = useState<AttemptSummary[]>([]);
  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [greeting, setGreeting] = useState("Chào bạn học sinh chăm chỉ! 🎒");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Chào buổi sáng tràn đầy năng lượng! ☀️");
    } else if (hour >= 12 && hour < 18) {
      setGreeting("Chào buổi chiều, cùng bứt phá nào! 🚀");
    } else {
      setGreeting("Chào buổi tối, ôn bài thật vui nhé! 🌙");
    }

    const learnerId = getLearnerId();
    fetch("/api/exams")
      .then(async (response) => {
        const data = await response.json();
        setDatabaseReady(response.ok && data.databaseReady === true);
        if (response.ok && Array.isArray(data.exams)) setExamList(data.exams);
      })
      .catch(() => setDatabaseReady(false));

    fetch(`/api/history?learnerId=${encodeURIComponent(learnerId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.attempts) setRecent(data.attempts);
      })
      .catch(() => undefined);
  }, []);

  const completed = useMemo(
    () => recent.filter((attempt) => attempt.status === "completed"),
    [recent]
  );

  const totalAnswered = useMemo(
    () => completed.reduce((sum, item) => sum + (item.totalQuestions || 0), 0),
    [completed]
  );

  const totalCorrect = useMemo(
    () => completed.reduce((sum, item) => sum + (item.correctCount ?? 0), 0),
    [completed]
  );

  const accuracyRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  const filteredExams = useMemo(() => {
    if (!searchTerm.trim()) return examList;
    const term = searchTerm.toLowerCase();
    return examList.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.subtitle.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term)
    );
  }, [examList, searchTerm]);

  return (
    <div className="page-shell home-shell">
      {/* Hero Banner thân thiện với học sinh */}
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="greeting-pill">
            <Sparkles size={16} className="sparkle-anim" />
            <span>{greeting}</span>
          </div>
          <h1 className="hero-title">
            Học tiếng Anh<br />
            <span className="gradient-text">siêu dễ, nhớ siêu lâu!</span>
          </h1>
          <p className="hero-desc">
            Không lo áp lực điểm số! Cùng luyện từ vựng qua các câu trắc nghiệm thú vị và thử thách điền từ có giải thích chi tiết.
          </p>

          <div className="hero-cta-group">
            <a
              className="button button-primary button-lg"
              href="#de-hoc"
              onClick={() => playClickSound()}
            >
              <Zap size={18} />
              <span>Khám phá bộ đề ngay</span>
              <ArrowRight size={18} />
            </a>
            <Link
              className="button button-ghost"
              href="/history"
              onClick={() => playClickSound()}
            >
              <Trophy size={18} />
              <span>Xem thành tích của bạn</span>
            </Link>
          </div>
        </div>

        {/* Mascot / Floating elements */}
        <div className="welcome-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="mascot-card">
            <div className="mascot-emoji">🎓</div>
            <div className="mascot-speech">Hôm nay cùng làm 1 đề nhé!</div>
          </div>
          <span className="art-star star-one">⭐</span>
          <span className="art-star star-two">✨</span>
          <span className="art-star star-three">💡</span>
          <div className="floating-badge badge-streak">
            <Flame size={18} />
            <span>Mỗi ngày +1 kiến thức</span>
          </div>
        </div>
      </section>

      {/* Stats Cards Dashboard */}
      <section className="stats-row" aria-label="Tổng quan học tập">
        <div className="stat-card stat-mint">
          <div className="stat-icon">
            <BookOpen size={22} />
          </div>
          <div className="stat-details">
            <div className="stat-number">{examList.length}</div>
            <div className="stat-label">Bộ đề sẵn sàng</div>
          </div>
        </div>

        <div className="stat-card stat-lilac">
          <div className="stat-icon">
            <Trophy size={22} />
          </div>
          <div className="stat-details">
            <div className="stat-number">{completed.length}</div>
            <div className="stat-label">Lần làm hoàn thành</div>
          </div>
        </div>

        <div className="stat-card stat-peach">
          <div className="stat-icon">
            <Target size={22} />
          </div>
          <div className="stat-details">
            <div className="stat-number">
              {accuracyRate !== null ? `${accuracyRate}%` : "Chưa có"}
            </div>
            <div className="stat-label">Độ chính xác TB</div>
          </div>
        </div>

        <div className="stat-card stat-sky">
          <div className="stat-icon">
            <Star size={22} />
          </div>
          <div className="stat-details">
            <div className="stat-number">{totalCorrect}</div>
            <div className="stat-label">Câu trả lời đúng</div>
          </div>
        </div>
      </section>

      {/* Góc bí kíp học tập dành riêng cho học sinh */}
      <div className="study-tip-strip">
        <div className="tip-icon-wrap">
          <Sparkles size={20} />
        </div>
        <div className="tip-content">
          <strong>Bí kíp làm bài từ vựng đỉnh cao:</strong> Hãy quan sát từ loại đứng trước và sau chỗ trống (danh từ, động từ, tính từ hay trạng từ) để chọn dạng từ chính xác nhất nhé!
        </div>
      </div>

      {/* Danh sách bộ đề */}
      <section className="section-block" id="de-hoc">
        <div className="section-heading">
          <div>
            <div className="eyebrow-tag">
              <Compass size={14} /> THƯ VIỆN ĐỀ ÔN TẬP
            </div>
            <h2>Chọn bộ đề để bắt đầu</h2>
          </div>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm đề học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {databaseReady === false && (
          <div className="database-note">
            <span>💡 <strong>Lưu ý:</strong> Để lưu kết quả lâu dài, hãy thiết lập <code>MONGODB_URI</code> trong tệp <code>.env.local</code> nhé!</span>
          </div>
        )}

        <div className="exam-grid">
          {filteredExams.map((exam, idx) => (
            <article className="exam-card" key={exam.id}>
              <div className="exam-card-header">
                <span className="exam-badge">
                  <BookOpen size={14} /> UNIT 3 · BÀI {idx + 1}
                </span>
                <span className="ready-tag">SẴN SÀNG</span>
              </div>

              <h3 className="exam-title">{exam.title}</h3>
              <p className="exam-subtitle">{exam.subtitle}</p>
              <p className="exam-description">{exam.description}</p>

              <div className="exam-levels-preview">
                <span className="level-pill pill-choice">
                  <ListChecks size={13} /> Level 1: Trắc nghiệm A-B-C-D
                </span>
                <span className="level-pill pill-typing">
                  <Keyboard size={13} /> Level 2: Tự gõ từ đúng
                </span>
              </div>

              <div className="exam-meta">
                <span>
                  <CheckCircle2 size={15} /> <strong>{exam.questions.length}</strong> câu hỏi
                </span>
                <span>
                  <Clock3 size={15} /> Tự do thời gian
                </span>
                <span>
                  <HelpCircle size={15} /> Có lời giải chi tiết
                </span>
              </div>

              <Link
                className="button button-card-cta"
                href={`/exams/${exam.id}`}
                onClick={() => playStartSound()}
              >
                <span>Vào luyện ngay</span>
                <ArrowRight size={17} />
              </Link>
            </article>
          ))}

          {filteredExams.length === 0 && (
            <div className="no-result-card">
              <div className="no-result-icon">🔍</div>
              <h4>Không tìm thấy đề nào phù hợp</h4>
              <p>Thử tìm với từ khóa khác như "Đề 1", "Đề 2" hoặc xóa tìm kiếm nhé!</p>
              <button
                type="button"
                className="button button-soft"
                onClick={() => {
                  playClickSound();
                  setSearchTerm("");
                }}
              >
                Xem tất cả các đề
              </button>
            </div>
          )}

          <div className="coming-card">
            <span className="coming-icon">✨</span>
            <strong>Nhiều bài học mới<br />sắp ra mắt!</strong>
            <span>Đang chuẩn bị thêm các chủ đề Unit 4, Unit 5 cho bạn ôn luyện.</span>
          </div>
        </div>
      </section>

      {/* Lịch sử gần đây */}
      <section className="recent-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow-tag">
              <Trophy size={14} /> TIẾN TRÌNH CỦA BẠN
            </div>
            <h2>Lần học gần đây</h2>
          </div>
          <Link
            className="text-link"
            href="/history"
            onClick={() => playClickSound()}
          >
            <span>Xem tất cả lịch sử</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-strip">
            <span className="empty-bubble">🎈</span>
            <div>
              <strong>Chưa có bài làm nào được lưu</strong>
              <span>Hãy chọn một bộ đề ở trên để bắt đầu thử sức và ghi điểm ngay nhé!</span>
            </div>
          </div>
        ) : (
          <div className="recent-list">
            {recent.slice(0, 4).map((attempt) => {
              const isDone = attempt.status === "completed";
              const percent =
                isDone && attempt.totalQuestions > 0
                  ? Math.round(((attempt.correctCount ?? 0) / attempt.totalQuestions) * 100)
                  : 0;

              return (
                <Link
                  className="recent-row"
                  key={attempt.id}
                  href={`/history/${attempt.id}`}
                  onClick={() => playClickSound()}
                >
                  <span className={`recent-row-icon ${isDone ? "icon-done" : "icon-progress"}`}>
                    {isDone ? <Trophy size={20} /> : <BookOpen size={20} />}
                  </span>

                  <div className="recent-row-main">
                    <strong>{attempt.examTitle}</strong>
                    <div className="recent-row-sub">
                      <span className="mode-tag">
                        {attempt.level === "choice" ? "⚡ Trắc nghiệm" : "✍️ Tự gõ đáp án"}
                      </span>
                      <span>·</span>
                      <small>{formatDate(attempt.completedAt ?? attempt.startedAt)}</small>
                    </div>
                  </div>

                  <div className="recent-score-wrap">
                    {isDone ? (
                      <span className="score-pill">
                        <strong>{attempt.correctCount}</strong>/{attempt.totalQuestions} đúng ({percent}%)
                      </span>
                    ) : (
                      <span className="status-pill status-progress">Đang làm dở</span>
                    )}
                  </div>

                  <span className="recent-duration">
                    <Clock3 size={14} />
                    {formatDuration(attempt.durationSeconds)}
                  </span>

                  <ArrowRight size={18} className="recent-arrow" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
