import { NextResponse } from "next/server";
import { readExam } from "@/lib/exam-store";
import { getDatabase } from "@/lib/mongodb";
import type { AttemptRecord } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ attemptId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  const learnerId = new URL(request.url).searchParams.get("learnerId")?.slice(0, 80);
  if (!learnerId) return NextResponse.json({ error: "Thiếu mã người học." }, { status: 400 });

  try {
    const db = await getDatabase();
    const attempt = await db.collection<AttemptRecord>("attempts").findOne({ _id: attemptId, learnerId });
    if (!attempt) return NextResponse.json({ error: "Không tìm thấy lần làm bài." }, { status: 404 });
    const exam = await readExam(db, attempt.examId);
    const questionById = new Map(exam?.questions.map((question) => [question.id, question] as const) ?? []);
    const answers = (attempt.answers ?? []).map((answer) => {
      const question = questionById.get(answer.questionId);
      return {
        ...answer,
        number: question?.number ?? 0,
        section: question?.section ?? "",
        prompt: question?.prompt ?? "",
        correctAnswer: question?.answer ?? "",
        explanation: question?.explanation ?? "",
      };
    });
    return NextResponse.json({
      attempt: {
        ...attempt,
        correctCount: attempt.status === "completed" ? attempt.correctCount : answers.filter((answer: { isCorrect: boolean }) => answer.isCorrect).length,
        wrongCount: attempt.status === "completed" ? attempt.wrongCount : answers.filter((answer: { isCorrect: boolean }) => !answer.isCorrect).length,
        answeredCount: answers.length,
        id: attempt._id,
        _id: undefined,
        startedAt: new Date(attempt.startedAt).toISOString(),
        completedAt: attempt.completedAt ? new Date(attempt.completedAt).toISOString() : null,
        answers,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tải chi tiết lần làm bài.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
