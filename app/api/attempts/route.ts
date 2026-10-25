import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
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
  const rawLocation = body?.location;
  const hasValidCoordinates =
    rawLocation &&
    typeof rawLocation.latitude === "number" &&
    Number.isFinite(rawLocation.latitude) &&
    rawLocation.latitude >= -90 &&
    rawLocation.latitude <= 90 &&
    typeof rawLocation.longitude === "number" &&
    Number.isFinite(rawLocation.longitude) &&
    rawLocation.longitude >= -180 &&
    rawLocation.longitude <= 180;

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
    const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = request.headers.get("x-real-ip")?.trim();
    const candidateIp = realIp && isIP(realIp) ? realIp : forwardedIp;
    const ipAddress = candidateIp && isIP(candidateIp) ? candidateIp : null;
    const accuracyMeters = rawLocation?.accuracyMeters;
    const clientCapturedAt = Date.parse(rawLocation?.capturedAt ?? "");
    const location = hasValidCoordinates
      ? {
          latitude: rawLocation.latitude as number,
          longitude: rawLocation.longitude as number,
          accuracyMeters:
            typeof accuracyMeters === "number" && Number.isFinite(accuracyMeters) && accuracyMeters >= 0
              ? Math.min(accuracyMeters, 1_000_000)
              : 0,
          capturedAt: Number.isFinite(clientCapturedAt) ? new Date(clientCapturedAt) : startedAt,
        }
      : null;
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
      ipAddress,
      focusLossEvents: [],
      location,
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
