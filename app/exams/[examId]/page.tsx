import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Keyboard, ListChecks, ShieldCheck } from "lucide-react";
import { getExam } from "@/lib/exam-store";

type Props = { params: Promise<{ examId: string }> };

export default async function ExamPage({ params }: Props) {
  const { examId } = await params;
  const exam = await getExam(examId);
  if (!exam) notFound();
  const hasChoices = exam.questions.every((question) => question.choices && question.choices.length > 1);

  return (
    <div className="page-shell narrow-shell">
      <Link href="/" className="back-link"><ArrowLeft size={16} /> Về trang chủ</Link>
      <section className="exam-detail-hero">
        <span className="eyebrow"><span className="eyebrow-dot" /> BỘ LUYỆN TẬP · UNIT 3</span>
        <h1>{exam.title}</h1>
        <p>{exam.description}</p>
        <div className="detail-pills"><span><ListChecks size={16} /> {exam.questions.length} câu hỏi</span><span><CircleHelp size={16} /> Có đáp án và giải thích</span></div>
      </section>

      <section className="mode-section">
        <div className="section-heading"><div><span className="eyebrow muted-eyebrow">CHỌN CÁCH LUYỆN</span><h2>Bạn muốn làm bài thế nào?</h2></div></div>
        <div className="mode-grid">
          <article className="mode-card mode-choice">
            <span className="mode-icon"><ListChecks size={22} /></span><span className="mode-level">LEVEL 1</span>
            <h3>Chọn đáp án</h3><p>Chọn A, B, C hoặc D rồi xem đáp án và lời giải cho từng câu.</p>
            {hasChoices ? <Link href={`/practice/${exam.id}?mode=choice`} className="button button-primary">Bắt đầu chọn đáp án <ArrowRight size={16} /></Link> : <button className="button button-disabled" disabled>Chưa có câu trắc nghiệm</button>}
            {!hasChoices && <small className="mode-note">Tài liệu hiện tại là bài điền dạng từ và chưa có phương án A, B, C, D.</small>}
          </article>
          <article className="mode-card mode-typing">
            <span className="mode-icon"><Keyboard size={22} /></span><span className="mode-level">LEVEL 2</span>
            <h3>Tự nhập đáp án</h3><p>Điền dạng đúng của từ vào chỗ trống. Đáp án cần đúng cả cụm từ.</p>
            <Link href={`/practice/${exam.id}?mode=typing`} className="button button-green">Bắt đầu điền đáp án <ArrowRight size={16} /></Link>
          </article>
        </div>
      </section>

      <div className="privacy-note"><ShieldCheck size={18} /><span>Trong lúc làm bài, hệ thống ghi số lần bạn chuyển khỏi tab hoặc cửa sổ bài thi để hiển thị trong lịch sử.</span></div>
      <div className="source-note"><CheckCircle2 size={17} /><span>Nội dung và giải thích được lấy từ tệp <strong>{exam.sourceFile}</strong>.</span></div>
    </div>
  );
}
