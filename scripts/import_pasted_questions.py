"""Convert the pasted English word-form exercise and its key to the app's exam JSON."""

import json
import re
import sys
from pathlib import Path
from add_mcq_choices import add_choices_to_exam


DEFAULT_SOURCE = Path(
    r"C:\Users\duong\.codex\attachments\32a99662-f8e2-4fa3-9efa-b6c779c032b9\Pasted text.txt"
)
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "unit-3-community-service-ex14-24.json"


def is_heading(line: str) -> bool:
    return bool(re.fullmatch(r"\d+\.\s+[A-Z][A-Z ]+", line.strip()))


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    lines = source.read_text(encoding="utf-8-sig").splitlines()
    try:
        part_one = next(i for i, line in enumerate(lines) if "PART 1:" in line)
        part_two = next(i for i, line in enumerate(lines) if "PART 2:" in line)
    except StopIteration as exc:
        raise SystemExit("Could not find both exercise and answer-key sections.") from exc

    questions: dict[int, dict[str, str]] = {}
    section = ""
    question_pattern = re.compile(r"^(\d+)\.\s+(.*?)\s+\((.*?)\)$")
    for raw_line in lines[part_one + 1 : part_two]:
        line = raw_line.strip()
        match = question_pattern.match(line)
        if match:
            number, prompt, source_word = match.groups()
            questions[int(number)] = {
                "section": section,
                "prompt": re.sub(r"_{2,}", "_____", prompt),
                "sourceWord": source_word,
            }
        elif is_heading(line):
            section = line

    answers: dict[int, tuple[str, str]] = {}
    answer_pattern = re.compile(r"^(\d+)\.\s+(.*?)\s+[–—-]\s+(.*)$")
    for raw_line in lines[part_two + 1 :]:
        line = raw_line.strip()
        match = answer_pattern.match(line)
        if match:
            number, answer, explanation = match.groups()
            answers[int(number)] = (answer, explanation)

    if questions.keys() != answers.keys():
        missing = sorted(questions.keys() ^ answers.keys())
        raise SystemExit(f"Question and answer numbers do not match: {missing}")
    if len(questions) != 110:
        raise SystemExit(f"Expected 110 questions, found {len(questions)}.")

    result = []
    for number, item in questions.items():
        answer, explanation = answers[number]
        result.append(
            {
                "id": f"q-{number:03d}",
                "number": number,
                **item,
                "answer": answer,
                "explanation": explanation,
            }
        )

    exam = add_choices_to_exam(
        {
                "id": "unit-3-community-service-word-form-ex14-24",
                "title": "Unit 3 · Community Service — Exercises 14–24",
                "subtitle": "Word Form · 110 câu",
                "description": "Luyện dạng từ theo Exercises 14–24, có đáp án và giải thích tiếng Việt.",
                "sourceFile": source.name,
                "questionCount": len(result),
                "questions": result,
        }
    )
    OUTPUT.write_text(json.dumps(exam, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Imported {len(result)} questions to {OUTPUT}")


if __name__ == "__main__":
    main()
