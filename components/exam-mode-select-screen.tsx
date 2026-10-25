"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Keyboard,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { playClickSound, playStartSound } from "@/lib/sound";
import type { Exam } from "@/lib/types";

export function ExamModeSelectScreen({
  exam,
  hasChoices,
}: {
  exam: Exam;
  hasChoices: boolean;
}) {
  return (
    <div className="page-shell narrow-shell exam-select-shell">
      <Link href="/" className="back-link" onClick={() => playClickSound()}>
        <ArrowLeft size={18} />
        <span>Về trang chủ chọn đề khác</span>
      </Link>

      {/* Hero giới thiệu bài ôn tập */}
      <section className="exam-detail-hero">
        <div className="eyebrow-tag hero-badge">
          <Sparkles size={14} /> BỘ ÔN LUYỆN · UNIT 3: COMMUNITY SERVICE
        </div>
        <h1 className="hero-exam-title">{exam.title}</h1>
        <p className="hero-exam-desc">{exam.description}</p>

        <div className="detail-pills-row">
          <span className="pill-item">
            <ListChecks size={16} /> <strong>{exam.questions.length}</strong> câu hỏi
          </span>
          <span className="pill-item">
            <HelpCircle size={16} /> Có giải thích tiếng Việt
          </span>
          <span className="pill-item">
            <Zap size={16} /> Nhớ từ siêu tốc
          </span>
        </div>
      </section>

      {/* Lựa chọn chế độ làm bài */}
      <section className="mode-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow-tag">CHỌN THỬ THÁCH HÔM NAY</div>
            <h2>Bạn muốn luyện tập theo cách nào?</h2>
          </div>
        </div>

        <div className="mode-grid">
          {/* Card Level 1 */}
          <article className="mode-card mode-choice">
            <div className="mode-card-top">
              <span className="mode-icon">
                <ListChecks size={26} />
              </span>
              <span className="mode-level-badge badge-lvl1">⚡ LEVEL 1</span>
            </div>

            <h3 className="mode-title">Trắc nghiệm 4 lựa chọn</h3>
            <p className="mode-desc">
              Chọn phương án đúng nhất giữa <strong>A, B, C, D</strong>. Thích hợp để khởi động phản xạ từ vựng và nhận diện ngữ pháp nhanh.
            </p>

            <ul className="mode-perks">
              <li>✓ Phù hợp cho ôn tập nhanh mỗi ngày</li>
              <li>✓ Hỗ trợ bấm phím tắt 1, 2, 3, 4 trên bàn phím</li>
              <li>✓ Có ngay lời giải chi tiết sau mỗi câu</li>
            </ul>

            {hasChoices ? (
              <Link
                href={`/practice/${exam.id}?mode=choice`}
                className="button button-primary button-mode-cta"
                onClick={() => playStartSound()}
              >
                <span>Bắt đầu Level 1 (Trắc nghiệm)</span>
                <ArrowRight size={17} />
              </Link>
            ) : (
              <button className="button button-disabled button-mode-cta" disabled>
                Đề chưa có câu trắc nghiệm
              </button>
            )}
          </article>

          {/* Card Level 2 */}
          <article className="mode-card mode-typing">
            <div className="mode-card-top">
              <span className="mode-icon">
                <Keyboard size={26} />
              </span>
              <span className="mode-level-badge badge-lvl2">✍️ LEVEL 2</span>
            </div>

            <h3 className="mode-title">Tự gõ đáp án (Word Form)</h3>
            <p className="mode-desc">
              Tự tay điền dạng đúng của từ vào ô trống. Rèn luyện trí nhớ đỉnh cao và thói quen viết chính tả chuẩn xác 100%.
            </p>

            <ul className="mode-perks">
              <li>✓ Thử thách nhớ sâu từ vựng & cấu trúc</li>
              <li>✓ Chuẩn bị vững vàng cho bài kiểm tra tự luận</li>
              <li>✓ Nhấn phím Enter để kiểm tra siêu tiện lợi</li>
            </ul>

            <Link
              href={`/practice/${exam.id}?mode=typing`}
              className="button button-green button-mode-cta"
              onClick={() => playStartSound()}
            >
              <span>Bắt đầu Level 2 (Tự gõ từ)</span>
              <ArrowRight size={17} />
            </Link>
          </article>
        </div>
      </section>

      {/* Ghi chú tạo động lực và lưu ý */}
      <div className="privacy-note">
        <ShieldCheck size={20} />
        <div>
          <strong>Mẹo rèn luyện sự tập trung:</strong>
          <span> Hệ thống sẽ ghi nhận số lần chuyển tab để giúp bạn tự theo dõi và rèn luyện thói quen tập trung cao độ khi làm bài.</span>
        </div>
      </div>

      <div className="source-note">
        <CheckCircle2 size={18} />
        <span>
          Nội dung kiến thức và giải thích được trích xuất chuẩn xác từ tệp <strong>{exam.sourceFile}</strong>.
        </span>
      </div>
    </div>
  );
}
