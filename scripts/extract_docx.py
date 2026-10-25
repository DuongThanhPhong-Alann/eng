"""Extract question, answer, and Vietnamese explanation paragraphs from the supplied DOCX."""

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from add_mcq_choices import add_choices_to_exam


DEFAULT_SOURCE = Path(
    r"C:\Users\duong\Downloads\Unit_3_Community_Service_130_Word_Form_REVISED.docx"
)
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "unit-3-community-service.json"
WORD_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def paragraphs(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as archive:
        document = ET.fromstring(archive.read("word/document.xml"))
    return [
        "".join(node.text or "" for node in paragraph.iter(f"{WORD_NS}t")).strip()
        for paragraph in document.iter(f"{WORD_NS}p")
    ]


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    lines = paragraphs(source)
    answer_heading = next(
        (index for index, line in enumerate(lines) if line.startswith("ĐÁP ÁN")),
        None,
    )
    if answer_heading is None:
        raise SystemExit("Could not find the answer section in the DOCX.")

    question_rows: dict[int, dict[str, str]] = {}
    section = ""
    question_pattern = re.compile(r"^(\d+)\.\s+(.*?)\s+\((.*?)\)$")
    for line in lines[:answer_heading]:
        match = question_pattern.match(line)
        if match:
            number, prompt, source_word = match.groups()
            question_rows[int(number)] = {
                "prompt": prompt,
                "sourceWord": source_word,
                "section": section,
            }
        elif line and not line.startswith(("UNIT 3:", "Bản chỉnh sửa:", "Hướng dẫn:")):
            section = line

    explanations: dict[int, tuple[str, str]] = {}
    section = ""
    explanation_pattern = re.compile(r"^(\d+)\.\s+(.*?)\s+—\s+(.*)$")
    for line in lines[answer_heading + 1 :]:
        match = explanation_pattern.match(line)
        if match:
            number, answer, explanation = match.groups()
            explanations[int(number)] = (answer, explanation)
        elif line:
            section = line

    if question_rows.keys() != explanations.keys():
        missing = sorted(question_rows.keys() ^ explanations.keys())
        raise SystemExit(f"Question and answer numbers do not match: {missing}")

    questions = []
    for number, row in question_rows.items():
        answer, explanation = explanations[number]
        questions.append(
            {
                "id": f"q-{number:03d}",
                "number": number,
                **row,
                "prompt": re.sub(r"_{2,}", "_____", row["prompt"]),
                "answer": answer,
                "explanation": explanation,
            }
        )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    exam = add_choices_to_exam(
        {
                "id": "unit-3-community-service-word-form",
                "title": "Unit 3 · Community Service",
                "subtitle": "Word Form · 130 câu",
                "description": "Luyện dạng từ với đáp án và giải thích tiếng Việt từ tài liệu bạn gửi.",
                "sourceFile": source.name,
                "questionCount": len(questions),
                "questions": questions,
        }
    )
    OUTPUT.write_text(json.dumps(exam, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(questions)} questions to {OUTPUT}")


if __name__ == "__main__":
    main()
