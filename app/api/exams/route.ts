import { NextResponse } from "next/server";
import { getExamCatalog } from "@/lib/exam-store";

export const runtime = "nodejs";

export async function GET() {
  const catalog = await getExamCatalog();
  return NextResponse.json(catalog);
}
