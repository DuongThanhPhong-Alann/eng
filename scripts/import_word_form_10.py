"""Import the supplied 130-question word-form DOCX into a source exam JSON."""

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


DEFAULT_SOURCE = Path(r"C:\Users\duong\Downloads\word_form_130_cau_10_tu.docx")
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "unit-3-community-service-word-form-10-tu.json"
WORD_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def paragraphs(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    return [
        "".join(node.text or "" for node in paragraph.iter(f"{WORD_NS}t")).strip()
        for paragraph in document.iter(f"{WORD_NS}p")
    ]


def is_heading(line: str) -> bool:
    return bool(re.fullmatch(r"\d+\.\s+[A-Z][A-Z ]+", line.strip()))


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    lines = paragraphs(source)
    answer_section = next((i for i, line in enumerate(lines) if line.startswith("ĐÁP ÁN")), None)
    if answer_section is None:
        raise SystemExit("Could not find the answer and explanation section.")

    questions: dict[int, dict[str, str]] = {}
    section = ""
    question_pattern = re.compile(r"^(\d+)\.\s+(.*?)\s+\((.*?)\)$")
    for raw_line in lines[:answer_section]:
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
    for raw_line in lines[answer_section + 1 :]:
        match = answer_pattern.match(raw_line.strip())
        if match:
            number, answer, explanation = match.groups()
            answers[int(number)] = (answer, explanation)

    if questions.keys() != answers.keys() or len(questions) != 130:
        raise SystemExit(
            f"Question/answer numbers differ or count is not 130: questions={len(questions)}, answers={len(answers)}"
        )

    question_data = []
    for number, item in questions.items():
        answer, explanation = answers[number]
        question_data.append(
            {
                "id": f"q-{number:03d}",
                "number": number,
                **item,
                "answer": answer,
                "explanation": explanation,
            }
        )

    exam = {
        "id": "unit-3-community-service-word-form-10-tu",
        "title": "Unit 3 · Community Service — Word Form",
        "subtitle": "10 từ/cụm từ · 130 câu",
        "description": "Bài tập điền dạng từ theo 10 nhóm từ, có đáp án và giải thích tiếng Việt.",
        "sourceFile": source.name,
        "questionCount": len(question_data),
        "questions": question_data,
    }
    OUTPUT.write_text(json.dumps(exam, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Imported {len(question_data)} questions to {OUTPUT}")


if __name__ == "__main__":
    main()
