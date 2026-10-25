import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { AttemptRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const learnerId = new URL(request.url).searchParams.get("learnerId")?.slice(0, 80);
  if (!learnerId) return NextResponse.json({ error: "Thiếu mã người học." }, { status: 400 });

  try {
    const db = await getDatabase();
    const attempts = await db
      .collection<AttemptRecord>("attempts")
      .find({ learnerId }, { projection: { answers: 0, learnerId: 0, focusLossEvents: 0, ipAddress: 0, location: 0 } })
      .sort({ startedAt: -1 })
      .limit(100)
      .toArray();
    return NextResponse.json({
      attempts: attempts.map((attempt) => ({
        ...attempt,
        id: attempt._id,
        _id: undefined,
        startedAt: new Date(attempt.startedAt).toISOString(),
        completedAt: attempt.completedAt ? new Date(attempt.completedAt).toISOString() : null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tải lịch sử.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
