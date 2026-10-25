"""Mix the three supplied source sets into six shuffled review exams."""

import json
import random
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SOURCE_FILES = [
    "unit-3-community-service.json",
    "unit-3-community-service-ex14-24.json",
    "unit-3-community-service-word-form-10-tu.json",
]
EXAM_COUNT = 6
EXAM_SIZES = [62, 62, 62, 62, 61, 61]
SOURCE_QUOTAS = [
    [22, 22, 22, 22, 21, 21],  # 130-question source
    [18, 18, 18, 18, 19, 19],  # 110-question source
    [22, 22, 22, 22, 21, 21],  # 130-question source
]
RANDOM_SEED = "unit-3-community-service-six-mixed-exams-v1"


def main() -> None:
    rng = random.Random(RANDOM_SEED)
    sources = [json.loads((DATA_DIR / name).read_text(encoding="utf-8")) for name in SOURCE_FILES]
    source_counts = [len(source["questions"]) for source in sources]

    if sum(source_counts) != sum(EXAM_SIZES):
        raise SystemExit(f"Source total {sum(source_counts)} does not match exam total {sum(EXAM_SIZES)}.")
    if [sum(row) for row in SOURCE_QUOTAS] != source_counts:
        raise SystemExit("Source quotas do not cover each source question exactly once.")
    if [sum(SOURCE_QUOTAS[source_index][exam_index] for source_index in range(len(sources))) for exam_index in range(EXAM_COUNT)] != EXAM_SIZES:
        raise SystemExit("Source quotas do not match the requested exam sizes.")

    buckets: list[list[dict]] = [[] for _ in range(EXAM_COUNT)]
    for source_index, source in enumerate(sources):
        questions = list(source["questions"])
        rng.shuffle(questions)
        offset = 0
        for exam_index in range(EXAM_COUNT):
            quota = SOURCE_QUOTAS[source_index][exam_index]
            batch = questions[offset : offset + quota]
            offset += quota
            for question in batch:
                if len(question.get("choices", [])) != 4:
                    raise SystemExit(f"Missing ABCD choices in {source['id']} question {question['number']}.")
                if question["answer"].casefold() not in {choice.casefold() for choice in question["choices"]}:
                    raise SystemExit(f"Answer is not among choices in {source['id']} question {question['number']}.")
                question["sourceExamId"] = source["id"]
                question["sourceExamTitle"] = source["title"]
                question["sourceQuestionNumber"] = question["number"]
                question["id"] = f"{source['id']}-q-{question['number']:03d}"
                buckets[exam_index].append(question)

    for exam_index, questions in enumerate(buckets, start=1):
        rng.shuffle(questions)
        for question_number, question in enumerate(questions, start=1):
            question["number"] = question_number

        exam = {
            "id": f"unit-3-community-service-exam-{exam_index}",
            "title": f"Đề {exam_index}",
            "subtitle": f"Đề tổng hợp · {len(questions)} câu",
            "description": "Đề trộn từ ba bộ câu hỏi bạn đã gửi, có trắc nghiệm và phần tự nhập đáp án.",
            "sourceFile": "Ba tài liệu Word Form Unit 3 bạn đã gửi",
            "questionCount": len(questions),
            "questions": questions,
        }
        out = DATA_DIR / f"unit-3-community-service-exam-{exam_index}.json"
        out.write_text(json.dumps(exam, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Combined {sum(source_counts)} questions into exams with sizes {EXAM_SIZES}.")


if __name__ == "__main__":
    main()
