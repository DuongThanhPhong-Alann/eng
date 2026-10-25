import { NextResponse } from "next/server";
import { readExam } from "@/lib/exam-store";
import { normalizeAnswer } from "@/lib/format";
import { getDatabase } from "@/lib/mongodb";
import type { AttemptRecord } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ attemptId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { attemptId } = await context.params;
  const body = await request.json().catch(() => null);
  const learnerId = typeof body?.learnerId === "string" ? body.learnerId : "";
  if (!learnerId) return NextResponse.json({ error: "Thiếu mã người học." }, { status: 400 });

  try {
    const db = await getDatabase();
    const attempts = db.collection<AttemptRecord>("attempts");
    const attempt = await attempts.findOne({ _id: attemptId, learnerId });
    if (!attempt) return NextResponse.json({ error: "Không tìm thấy lần làm bài." }, { status: 404 });
    if (attempt.status === "completed") {
      return NextResponse.json({ error: "Lần làm bài này đã hoàn thành." }, { status: 409 });
    }

    if (body?.event === "focus_lost") {
      const leftAt = new Date();
      await attempts.updateOne(
        { _id: attemptId, learnerId, status: "in_progress" },
        {
          $inc: { focusLossCount: 1 },
          $push: { focusLossEvents: { leftAt, returnedAt: null } },
        },
      );
      return NextResponse.json({ ok: true, leftAt: leftAt.toISOString() });
    }

    if (body?.event === "focus_returned") {
      const events = attempt.focusLossEvents ?? [];
      let openEventIndex = -1;
      for (let index = events.length - 1; index >= 0; index -= 1) {
        if (!events[index].returnedAt) {
          openEventIndex = index;
          break;
        }
      }
      const returnedAt = new Date();
      if (openEventIndex >= 0) {
        await attempts.updateOne(
          { _id: attemptId, learnerId, status: "in_progress" },
          { $set: { [`focusLossEvents.${openEventIndex}.returnedAt`]: returnedAt } },
        );
      }
      return NextResponse.json({ ok: true, returnedAt: returnedAt.toISOString() });
    }

    if (body?.answer && typeof body.answer.questionId === "string" && typeof body.answer.answer === "string") {
      const exam = await readExam(db, attempt.examId);
      const question = exam?.questions.find((item) => item.id === body.answer.questionId);
      if (!question) return NextResponse.json({ error: "Không tìm thấy câu hỏi." }, { status: 404 });
      if (attempt.answers.some((item) => item.questionId === question.id)) {
        return NextResponse.json({ ok: true });
      }
      const submittedAnswer = body.answer.answer.slice(0, 300);
      await attempts.updateOne(
        { _id: attemptId, learnerId, status: "in_progress" },
        {
          $addToSet: {
            answers: {
              questionId: question.id,
              submittedAnswer,
              isCorrect: normalizeAnswer(submittedAnswer) === normalizeAnswer(question.answer),
            },
          },
          $inc: { answeredCount: 1 },
        },
      );
      return NextResponse.json({ ok: true });
    }

    if (body?.complete !== true || !Array.isArray(body.answers)) {
      return NextResponse.json({ error: "Dữ liệu nộp bài chưa hợp lệ." }, { status: 400 });
    }

    const exam = await readExam(db, attempt.examId);
    if (!exam) return NextResponse.json({ error: "Không tìm thấy đề." }, { status: 404 });
    const submitted = new Map<string, string>();
    for (const entry of body.answers) {
      if (typeof entry?.questionId === "string" && typeof entry?.answer === "string") {
        submitted.set(entry.questionId, entry.answer.slice(0, 300));
      }
    }
    if (submitted.size !== exam.questions.length) {
      return NextResponse.json({ error: "Hãy hoàn thành tất cả câu hỏi trước khi nộp bài." }, { status: 400 });
    }

    const answers = exam.questions.map((question) => {
      const submittedAnswer = submitted.get(question.id) ?? "";
      return {
        questionId: question.id,
        submittedAnswer,
        isCorrect: normalizeAnswer(submittedAnswer) === normalizeAnswer(question.answer),
      };
    });
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const completedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((completedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000),
    );
    await attempts.updateOne(
      { _id: attemptId, learnerId, status: "in_progress" },
      {
        $set: {
          status: "completed",
          answers,
          answeredCount: answers.length,
          correctCount,
          wrongCount: answers.length - correctCount,
          completedAt,
          durationSeconds,
        },
      },
    );
    return NextResponse.json({
      correctCount,
      wrongCount: answers.length - correctCount,
      completedAt: completedAt.toISOString(),
      durationSeconds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể cập nhật bài làm.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
