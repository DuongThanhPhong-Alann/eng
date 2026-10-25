import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { readExam, seedExamCollection } from "@/lib/exam-store";
import { getDatabase } from "@/lib/mongodb";
import type { AttemptRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const learnerId = typeof body?.learnerId === "string" ? body.learnerId.slice(0, 80) : "";
  const examId = typeof body?.examId === "string" ? body.examId : "";
  const level = body?.level === "choice" ? "choice" : body?.level === "typing" ? "typing" : null;

  if (!learnerId || !level || !examId) {
    return NextResponse.json({ error: "Thông tin bắt đầu bài làm chưa hợp lệ." }, { status: 400 });
  }

  try {
    const db = await getDatabase();
    await seedExamCollection(db);
    const exam = await readExam(db, examId);
    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề." }, { status: 404 });
    if (level === "choice" && exam.questions.some((question) => !question.choices?.length)) {
      return NextResponse.json({ error: "Đề này chưa có câu hỏi trắc nghiệm." }, { status: 409 });
    }
    const id = randomUUID();
    const startedAt = new Date();
    await db.collection<AttemptRecord>("attempts").insertOne({
      _id: id,
      learnerId,
      examId,
      examTitle: exam.title,
      level,
      status: "in_progress",
      totalQuestions: exam.questions.length,
      answeredCount: 0,
      correctCount: null,
      wrongCount: null,
      focusLossCount: 0,
      startedAt,
      completedAt: null,
      durationSeconds: null,
      answers: [],
    });
    return NextResponse.json({ attemptId: id, startedAt: startedAt.toISOString() }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể lưu bài làm.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
