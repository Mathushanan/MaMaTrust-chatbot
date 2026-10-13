"""
MamaTrustAI - Real Evaluation Script
=======================================
Owner: Chalana (Backend: Agreement & Integration)

Purpose:
    Measure actual accuracy of the scoring pipeline against the real
    ground-truth evaluation set (eval_questions.json), using the real
    chunk dataset (real_chunks.json). This replaces the earlier
    dummy_claims.json batch test with something that has known correct
    answers, so you can report a genuine accuracy number.

How chunk matching works:
    Each chunk in real_chunks.json has a "maps_to_question_id" field
    (a comma-separated list of question_ids it's relevant to, e.g.
    "Q_LEAP01, Q_LEAP02"). For each eval question, this script pulls
    together only the chunks mapped to it - this is standing in for
    what Gayathri's real retrieval step will eventually do.

Handling "Escalate" as an expected label:
    The eval set uses "Escalate" as one of its expected_classification
    values (8 questions). This isn't one of our 4 verdicts - it's
    checked separately against the escalate flag instead of the verdict.

Requires a real ANTHROPIC_API_KEY / GEMINI_API_KEY set - without one,
every question will fail and show up as an error, which is expected.
"""

import json
import time
from collections import defaultdict

from agreement_scoring import score_claim

# Gemini free tier allows ~15 requests/minute. This delay keeps us safely
# under that limit across a long run of 200+ questions.
SECONDS_BETWEEN_CALLS = 4.5


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def match_chunks_for_question(question_id: str, all_chunks: list[dict]) -> list[dict]:
    """Find every chunk whose maps_to_question_id field mentions this question_id."""
    matched = []
    for chunk in all_chunks:
        mapped_ids = [qid.strip() for qid in str(chunk.get("maps_to_question_id", "")).split(",")]
        if question_id in mapped_ids:
            matched.append(chunk)
    return matched


def evaluate(eval_questions: list[dict], all_chunks: list[dict], limit: int = None) -> list[dict]:
    if limit:
        eval_questions = eval_questions[:limit]

    results = []
    for i, q in enumerate(eval_questions, start=1):
        qid = q["question_id"]
        claim = q["parent_question"]
        expected = q["expected_classification"]

        print(f"[{i}/{len(eval_questions)}] {qid}: {claim[:60]}...")

        matched_chunks = match_chunks_for_question(qid, all_chunks)

        if not matched_chunks:
            results.append({
                "question_id": qid, "claim": claim, "expected": expected,
                "actual_verdict": None, "actual_escalate": None,
                "correct": False, "error": "No chunks mapped to this question_id",
            })
            continue

        try:
            result = score_claim(claim, matched_chunks)

            # "Escalate" is now a real verdict value (not just a flag),
            # so a plain verdict comparison handles every expected label,
            # including "Escalate", correctly.
            correct = result.verdict == expected

            results.append({
                "question_id": qid, "claim": claim, "expected": expected,
                "actual_verdict": result.verdict, "actual_escalate": result.escalate,
                "confidence": result.confidence, "correct": correct, "error": None,
            })
            time.sleep(SECONDS_BETWEEN_CALLS)
        except Exception as e:
            error_msg = str(e)
            # Basic retry on rate-limit errors (HTTP 429) - wait longer and try once more
            if "429" in error_msg:
                print(f"    Rate limited, waiting 30s and retrying once...")
                time.sleep(30)
                try:
                    result = score_claim(claim, matched_chunks)
                    correct = result.verdict == expected
                    results.append({
                        "question_id": qid, "claim": claim, "expected": expected,
                        "actual_verdict": result.verdict, "actual_escalate": result.escalate,
                        "confidence": result.confidence, "correct": correct, "error": None,
                    })
                    time.sleep(SECONDS_BETWEEN_CALLS)
                    continue
                except Exception as e2:
                    error_msg = str(e2)

            results.append({
                "question_id": qid, "claim": claim, "expected": expected,
                "actual_verdict": None, "actual_escalate": None,
                "correct": False, "error": error_msg,

            })
    return results


def summarize(results: list[dict]) -> None:
    total = len(results)
    errors = [r for r in results if r["error"]]
    scored = [r for r in results if not r["error"]]
    correct = [r for r in scored if r["correct"]]

    print("\n" + "=" * 60)
    print(f"EVALUATION SUMMARY: {len(scored)}/{total} scored, {len(errors)} errors")
    if scored:
        accuracy = len(correct) / len(scored) * 100
        print(f"Overall accuracy: {len(correct)}/{len(scored)} ({accuracy:.1f}%)")

        # Accuracy broken down by expected label
        by_label = defaultdict(lambda: {"correct": 0, "total": 0})
        for r in scored:
            by_label[r["expected"]]["total"] += 1
            if r["correct"]:
                by_label[r["expected"]]["correct"] += 1

        print("\nAccuracy by expected label:")
        for label, counts in sorted(by_label.items()):
            pct = counts["correct"] / counts["total"] * 100
            print(f"  {label:15s} {counts['correct']:3d}/{counts['total']:3d} ({pct:.1f}%)")

    if errors:
        print(f"\n{len(errors)} questions had no matched chunks or errored - see saved file for detail.")


def save_results(results: list[dict], out_path: str) -> None:
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nFull results saved to {out_path}")


if __name__ == "__main__":
    eval_questions = load_json("eval_questions.json")
    all_chunks = load_json("real_chunks.json")

    print(f"Running full evaluation: {len(eval_questions)} questions.")
    print(f"With {SECONDS_BETWEEN_CALLS}s pacing, this takes roughly "
          f"{len(eval_questions) * SECONDS_BETWEEN_CALLS / 60:.0f} minutes.\n")

    results = evaluate(eval_questions, all_chunks)
    summarize(results)
    save_results(results, "evaluation_results.json")