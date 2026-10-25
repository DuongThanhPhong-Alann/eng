import type { Db } from "mongodb";
import { seedExams, getSeedExam } from "@/lib/exams";
import { getDatabase } from "@/lib/mongodb";
import type { Exam } from "@/lib/types";

type StoredExam = Exam & { _id: string; createdAt?: Date };

export async function seedExamCollection(db: Db) {
  const collection = db.collection("exams");
  await Promise.all(
    seedExams.map((exam) =>
      collection.updateOne(
        { _id: exam.id },
        {
          $set: { ...exam, updatedAt: new Date() },
          $setOnInsert: { _id: exam.id, createdAt: new Date() },
        },
        { upsert: true },
      ),
    ),
  );
}

export async function readExam(db: Db, examId: string) {
  const stored = await db.collection<StoredExam>("exams").findOne({ _id: examId }, { projection: { _id: 0 } });
  return stored as Exam | null;
}

export async function getExam(examId: string) {
  const fallback = getSeedExam(examId);
  try {
    const db = await getDatabase();
    await seedExamCollection(db);
    return (await readExam(db, examId)) ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getExamCatalog() {
  try {
    const db = await getDatabase();
    await seedExamCollection(db);
    const exams = await db
      .collection<StoredExam>("exams")
      .find({ _id: { $in: seedExams.map((exam) => exam.id) } }, { projection: { _id: 0 } })
      .toArray();
    return { exams: (exams.length ? exams : seedExams) as Exam[], databaseReady: true };
  } catch {
    return { exams: seedExams, databaseReady: false };
  }
}

export async function getExams() {
  return (await getExamCatalog()).exams;
}
