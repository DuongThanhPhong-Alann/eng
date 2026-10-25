"""Add four word-form choices to the supplied exam JSON files."""

import json
import random
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
EXAMS = [
    "unit-3-community-service.json",
    "unit-3-community-service-ex14-24.json",
    "unit-3-community-service-word-form-10-tu.json",
]

# Distractors use related word forms. A few items have custom distractors so
# that a valid alternative from the source word family is not shown as wrong.
DISTRACTORS = {
    "community": ["communities", "communal", "communally"],
    "communities": ["community", "communal", "communitarianism"],
    "community-minded": ["community", "communities", "communitarianism"],
    "community service": ["community serviced", "community servicing", "service community"],
    "serve": ["serves", "served", "serving"],
    "serviceable": ["service", "servicing", "serviced"],
    "community-service": ["serviceable community", "community serviced", "community serving"],
    "service": ["services", "serving", "serviceable"],
    "services": ["service", "serve", "serviceable"],
    "servant": ["service", "serve", "serving"],
    "activity": ["activities", "active", "activate"],
    "activities": ["activity", "active", "activate"],
    "active": ["activity", "actively", "activate"],
    "actively": ["active", "activity", "activities"],
    "activate": ["active", "activity", "actively"],
    "board game": ["board games", "gaming", "gamer"],
    "board games": ["board game", "gaming", "gamer"],
    "gaming": ["gamer", "games", "gameful"],
    "fun": ["gamer", "gaming", "games"],
    "gamer": ["game", "gaming", "games"],
    "game": ["gamer", "games", "game-based"],
    "enjoyable": ["gamer", "games", "game-based"],
    "game-based": ["gamer", "games", "gaming"],
    "plant": ["plants", "planter", "plant-based"],
    "plants": ["plant", "planting", "planter"],
    "planting": ["plant", "planted", "plants"],
    "planted": ["plant", "planting", "plants"],
    "plant trees": ["plant tree", "planting trees", "planted trees"],
    "trees": ["tree", "treed", "tree's"],
    "water": ["watering", "watered", "waterless"],
    "watering": ["waterless", "watered", "watery"],
    "waterless": ["water", "watering", "watered"],
    "watery": ["water", "watering", "watered"],
    "water vegetables": ["watering vegetables", "watered vegetables", "water vegetable"],
    "vegetable": ["vegetables", "vegetarian", "vegetatively"],
    "vegetables": ["vegetable", "vegetarian", "vegetatively"],
    "healthy": ["health", "healthily", "healthiness"],
    "donate": ["donates", "donated", "donating"],
    "donations": ["donation", "donor", "donating"],
    "donor": ["donation", "donate", "donated"],
    "donors": ["donor", "donating", "donated"],
    "donating": ["donate", "donated", "donation"],
    "donation": ["donate", "donating", "donor"],
    "donated": ["donate", "donating", "donation"],
    "donate old clothes": ["donating old clothes", "donated old clothes", "donation old clothes"],
    "clothes": ["clothing", "clothed", "clothesline"],
    "cloth": ["clothes", "clothed", "cloths"],
    "teacher": ["teach", "teaching", "teaches"],
    "teach": ["teaches", "teaching", "taught"],
    "teaching": ["teach", "teacher", "taught"],
    "taught": ["teach", "teaching", "teachable"],
    "teachable": ["teach", "teaching", "taught"],
    "clean": ["cleaning", "cleanly", "cleaned"],
    "cleaning": ["clean", "cleanly", "cleaned"],
    "cleaner": ["clean", "cleaning", "cleanly"],
    "cleanly": ["clean", "cleaning", "cleaner"],
    "cleanliness": ["clean", "cleanly", "cleaning"],
    "pick up": ["picked up", "picking up", "pickup"],
    "picking up": ["pick up", "picked up", "pickup"],
    "pickup": ["picked up", "picking", "picks up"],
    "recycle": ["recycles", "recycled", "recycling"],
    "recycling": ["recycle", "recycled", "recyclable"],
    "recyclable": ["recycle", "recycling", "recycleable"],
    "recycled": ["recycle", "recycling", "recyclable"],
    "paper": ["papered", "papering", "papery"],
    "used paper": ["use paper", "using paper", "paper use"],
    "exchange": ["exchanges", "exchanging", "exchanged"],
    "exchanging": ["exchange", "exchanged", "exchanges"],
    "exchanged": ["exchange", "exchanging", "exchanges"],
    "exchange used paper for notebooks": [
        "exchanging used paper for notebooks",
        "exchanged used paper for notebooks",
        "exchange used paper of notebooks",
    ],
    "volunteer": ["volunteering", "volunteered", "voluntarily"],
    "volunteers": ["volunteer", "volunteering", "voluntary"],
    "volunteering": ["volunteer", "volunteered", "voluntary"],
    "voluntarily": ["voluntary", "volunteer", "volunteering"],
    "voluntary": ["voluntarily", "volunteerism", "volunteered"],
    "tutor": ["tutoring", "tutored", "tutorship"],
    "tutoring": ["tutor", "tutored", "tutorship"],
    "litter": ["litters", "littered", "littering"],
    "littering": ["litter", "littered", "litters"],
    "littered": ["litter", "littering", "litter-free"],
    "litter-free": ["littered", "littering", "litter"],
    "nursing": ["nurse", "nursed", "nurses"],
    "nurse": ["nursing", "nursed", "nurses"],
    "nursing home": ["nurse home", "nursing house", "nursing homes"],
    "homeless": ["homelessly", "homeliness", "homely"],
    "homeless people": ["homeless person", "homely people", "homelessness"],
    "home": ["homely", "homes", "homeless"],
    "homelessness": ["homeless", "homely", "homelessly"],
    "child": ["children", "childish", "childhood"],
    "children": ["child", "childish", "childhood"],
    "child-friendly": ["childless", "childish", "childlike"],
    "childhood": ["child", "children", "childishness"],
    "education": ["educate", "educated", "educational"],
    "gently": ["gentle", "gentleness", "gentler"],
    "orphan": ["orphaned", "orphanage", "orphans"],
    "orphaned": ["orphan", "orphaning", "orphanage"],
    "orphans": ["orphan", "orphaned", "orphanage"],
    "orphanage": ["orphan", "orphaned", "orphans"],
    "rural": ["rurally", "rurality", "ruralism"],
    "countryside": ["rural", "rurally", "rurality"],
    "elderly": ["elder", "elderliness", "elder's"],
    "respect": ["respectful", "respectfully", "respective"],
    "older": ["oldish", "oldness", "olden"],
    "aged": ["age", "ageism", "oldness"],
    "elders": ["elder's", "elderliness", "elderhood"],
    "ageing": ["ageism", "agedness", "elderliness"],
    "emotional": ["emotion", "emotionally", "emotionless"],
    "growth": ["grow", "growing", "grown"],
    "grow": ["grows", "growing", "grown"],
    "growing": ["grow", "growth", "grower"],
    "grown": ["grow", "growing", "growth"],
    "development": ["develop", "developing", "developmental"],
    "develop": ["develops", "developed", "developing"],
    "developed": ["develop", "development", "developer"],
    "developer": ["develop", "developing", "development"],
    "developing": ["develop", "developed", "development"],
    "developmental": ["develop", "developer", "developmentally"],
    "developments": ["develop", "developed", "developing"],
    "project": ["projects", "projected", "projecting"],
    "present": ["presentation", "presented", "presenting"],
    "initiative": ["initiate", "initial", "initially"],
    "success": ["successful", "successfully", "succeed"],
    "successfully": ["success", "successful", "succeed"],
    "planning": ["plan", "planned", "planner"],
    "learning opportunity": ["learner opportunity", "learn opportunity", "learned opportunity"],
    "aims": ["aim", "aiming", "aimless"],
    "quickly": ["quick", "quickness", "quicken"],
}

CUSTOM_DISTRACTORS = {
    # The alternatives "community-minded", "communal", or "communities" can
    # also fit some of these original sentences, so use forms that do not.
    ("unit-3-community-service-word-form", 3): ["communities", "communally", "communitarianism"],
    ("unit-3-community-service-word-form", 4): ["communities", "communally", "communitarianism"],
    ("unit-3-community-service-word-form", 8): ["communities", "communally", "communitarianism"],
    ("unit-3-community-service-word-form", 9): ["communally", "communal", "communitarian"],
    ("unit-3-community-service-word-form", 10): ["community", "communities", "communally"],
    # Both fun/enjoyable can fit as adjectives; keep each out of the other's options.
    ("unit-3-community-service-word-form", 34): ["gamer", "gaming", "game"],
    ("unit-3-community-service-word-form", 38): ["gamer", "games", "game-based"],
    ("unit-3-community-service-word-form", 40): ["gamer", "games", "gaming"],
    # These prompts allow another common form or count interpretation.
    ("unit-3-community-service-word-form", 45): ["plants", "planter", "plant-based"],
    ("unit-3-community-service-word-form", 64): ["water", "watering", "watered"],
    ("unit-3-community-service-word-form", 68): ["water", "watering", "waterless"],
    ("unit-3-community-service-word-form", 80): ["waterless", "watered", "watery"],
    ("unit-3-community-service-word-form", 91): ["donating old clothes", "donated old clothes", "donation old clothes"],
    ("unit-3-community-service-word-form", 93): ["clothes", "clothed", "cloths"],
    ("unit-3-community-service-word-form", 99): ["clothed", "clothesline", "clothe"],
    ("unit-3-community-service-word-form", 100): ["donate", "donated", "donator"],
    ("unit-3-community-service-word-form", 105): ["teach", "teaches", "teachery"],
    ("unit-3-community-service-word-form", 107): ["teach", "taught", "teachable"],
    ("unit-3-community-service-word-form", 113): ["cleaning", "cleanly", "cleaned"],
    ("unit-3-community-service-word-form", 120): ["cleaned", "cleanly", "cleanliness"],
    ("unit-3-community-service-word-form", 119): ["clean", "cleanly", "cleaned"],
    ("unit-3-community-service-word-form", 124): ["pick up", "picked up", "picks up"],
    ("unit-3-community-service-word-form", 126): ["pick up", "picked up", "picking"],
    ("unit-3-community-service-word-form", 128): ["pickups", "picked up", "picks up"],
    ("unit-3-community-service-word-form", 130): ["picked up", "picking", "picks up"],
    ("unit-3-community-service-word-form-ex14-24", 3): ["recycle", "recycling", "recycles"],
    ("unit-3-community-service-word-form-ex14-24", 5): ["recycle", "recycles", "recyclability"],
    ("unit-3-community-service-word-form-ex14-24", 17): ["papering", "papered", "papery"],
    ("unit-3-community-service-word-form-ex14-24", 20): ["papering", "papered", "papery"],
    ("unit-3-community-service-word-form-ex14-24", 22): ["use paper", "using paper", "paper use"],
    ("unit-3-community-service-word-form-ex14-24", 26): ["use paper", "using paper", "paper use"],
    ("unit-3-community-service-word-form-ex14-24", 38): ["exchanges", "exchanging", "exchangeable"],
    ("unit-3-community-service-word-form-ex14-24", 42): ["exchanges", "exchanging", "exchangeable"],
    ("unit-3-community-service-word-form-ex14-24", 44): ["exchanges", "exchanged", "exchangeable"],
    ("unit-3-community-service-word-form-ex14-24", 50): ["exchanger", "exchanged", "exchangeable"],
    ("unit-3-community-service-word-form-ex14-24", 55): ["volunteered", "voluntarily", "volunteerism"],
    ("unit-3-community-service-word-form-ex14-24", 59): ["voluntarily", "volunteerism", "volunteered"],
    ("unit-3-community-service-word-form-ex14-24", 60): ["voluntary", "voluntarily", "volunteered"],
    ("unit-3-community-service-word-form-ex14-24", 63): ["tutored", "tutorship", "tutor's"],
    ("unit-3-community-service-word-form-ex14-24", 70): ["tutors", "tutored", "tutorship"],
    ("unit-3-community-service-word-form-ex14-24", 74): ["littering", "litters", "litterer"],
    ("unit-3-community-service-word-form-ex14-24", 76): ["littering", "litter", "litters"],
    ("unit-3-community-service-word-form-ex14-24", 77): ["littered", "litters", "litter-free"],
    ("unit-3-community-service-word-form-ex14-24", 94): ["nurse home", "nursing house", "nursed home"],
    ("unit-3-community-service-word-form-ex14-24", 98): ["nurse home", "nursing house", "nursed home"],
    ("unit-3-community-service-word-form-ex14-24", 83): ["nursed", "nurses", "nurse-like"],
    ("unit-3-community-service-word-form-ex14-24", 86): ["nursed", "nurses", "nurse-like"],
    ("unit-3-community-service-word-form-ex14-24", 87): ["nursed", "nurses", "nurse-like"],
    ("unit-3-community-service-word-form-ex14-24", 89): ["nurses", "nursed", "nurse-like"],
    ("unit-3-community-service-word-form-ex14-24", 90): ["nursed", "nurses", "nurse's"],
    ("unit-3-community-service-word-form-ex14-24", 100): ["nurse home", "nursing house", "nursed home"],
    ("unit-3-community-service-word-form-ex14-24", 101): ["homeless person", "homely people", "homelessness"],
    ("unit-3-community-service-word-form-ex14-24", 102): ["homelessly", "homeliness", "homely"],
    ("unit-3-community-service-word-form-ex14-24", 107): ["homelessly", "homeliness", "homely"],
    ("unit-3-community-service-word-form-ex14-24", 110): ["homelessly", "homelessness", "homeless person"],
    ("unit-3-community-service-word-form-10-tu", 1): ["homeless", "homeliness", "homely"],
    ("unit-3-community-service-word-form-10-tu", 12): ["homeless", "homely", "homelessly"],
    ("unit-3-community-service-word-form-10-tu", 19): ["childless", "children", "childhood"],
    ("unit-3-community-service-word-form-10-tu", 27): ["orphanage", "orphaned", "orphans"],
    ("unit-3-community-service-word-form-10-tu", 29): ["orphanage", "orphaning", "orphans"],
    ("unit-3-community-service-word-form-10-tu", 30): ["orphanage's", "orphaning", "orphan's"],
    ("unit-3-community-service-word-form-10-tu", 34): ["orphanhood", "orphaning", "orphan's"],
    ("unit-3-community-service-word-form-10-tu", 35): ["orphaned", "orphanage", "orphans"],
    ("unit-3-community-service-word-form-10-tu", 38): ["orphanage's", "orphaning", "orphan's"],
    ("unit-3-community-service-word-form-10-tu", 39): ["orphanedness", "orphaning", "orphan's"],
    ("unit-3-community-service-word-form-10-tu", 40): ["orphaned", "orphaning", "orphans"],
    ("unit-3-community-service-word-form-10-tu", 49): ["orphaned", "orphaning", "orphans"],
    ("unit-3-community-service-word-form-10-tu", 54): ["rurality", "rurally", "ruralism"],
    ("unit-3-community-service-word-form-10-tu", 60): ["rurality", "rurally", "ruralism"],
    ("unit-3-community-service-word-form-10-tu", 79): ["elder", "elder's", "elderliness"],
    ("unit-3-community-service-word-form-10-tu", 81): ["elder", "elder's", "elderliness"],
    ("unit-3-community-service-word-form-10-tu", 83): ["elderliness", "elder's", "elderhood"],
    ("unit-3-community-service-word-form-10-tu", 84): ["age", "ageism", "oldness"],
    ("unit-3-community-service-word-form-10-tu", 85): ["elder", "elder's", "elderliness"],
    ("unit-3-community-service-word-form-10-tu", 87): ["ageism", "agedness", "elderliness"],
    ("unit-3-community-service-word-form-10-tu", 88): ["elder's", "elderliness", "elderhood"],
    ("unit-3-community-service-word-form-10-tu", 91): ["age", "ageism", "oldness"],
    ("unit-3-community-service-word-form-10-tu", 95): ["grow", "growth", "grower"],
    ("unit-3-community-service-word-form-10-tu", 99): ["grow", "grows", "growth"],
    ("unit-3-community-service-word-form-10-tu", 107): ["develop", "developer", "developmentally"],
    ("unit-3-community-service-word-form-10-tu", 110): ["develop", "developer", "developmentally"],
    ("unit-3-community-service-word-form-10-tu", 115): ["develop", "developer", "developmentally"],
    ("unit-3-community-service-word-form-10-tu", 117): ["develop", "developed", "developing"],
    ("unit-3-community-service-word-form-10-tu", 126): ["planned", "planner", "planful"],
}

def add_choices_to_exam(exam: dict) -> dict:
    for question in exam["questions"]:
        answer = question["answer"]
        candidates = CUSTOM_DISTRACTORS.get(
            (exam["id"], question["number"]),
            DISTRACTORS.get(answer.casefold()),
        )
        if candidates is None or len(candidates) < 3:
            raise SystemExit(f"No three distractors for {exam['id']} question {question['number']}: {answer}")

        wrong_answers = []
        for candidate in candidates:
            if candidate.casefold() != answer.casefold() and candidate.casefold() not in {item.casefold() for item in wrong_answers}:
                wrong_answers.append(candidate)
            if len(wrong_answers) == 3:
                break
        if len(wrong_answers) != 3:
            raise SystemExit(f"Distractors are not unique for {exam['id']} question {question['number']}.")

        randomizer = random.Random(f"{exam['id']}:{question['number']}")
        randomizer.shuffle(wrong_answers)
        correct_index = (question["number"] + len(exam["id"])) % 4
        options = wrong_answers
        options.insert(correct_index, answer)
        question["choices"] = options
    return exam


def main() -> None:
    for exam_file in EXAMS:
        path = DATA_DIR / exam_file
        exam = add_choices_to_exam(json.loads(path.read_text(encoding="utf-8")))
        path.write_text(json.dumps(exam, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Added four answer choices to {len(exam['questions'])} questions in {path.name}")


if __name__ == "__main__":
    main()
