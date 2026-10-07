"""
MamaTrustAI - Targeted Partial-Verdict Re-test
=================================================
Owner: Chalana

Purpose: re-run ONLY the questions whose expected_classification is "Partial"
(56 of them), after the system prompt fix, without burning API quota re-running
the full 206-question set. Run this, check the new accuracy, then decide
whether to re-run the full evaluate.py afterward.
"""

import json
import time
from agreement_scoring import score_claim

SECONDS_BETWEEN_CALLS = 4.5


def match_chunks_for_question(question_id, all_chunks):
    matched = []
    for chunk in all_chunks:
        mapped_ids = [qid.strip() for qid in str(chunk.get("maps_to_question_id", "")).split(",")]
        if question_id in mapped_ids:
            matched.append(chunk)
    return matched


if __name__ == "__main__":
    eval_questions = json.load(open("eval_questions.json"))
    all_chunks = json.load(open("real_chunks.json"))

    partial_questions = [q for q in eval_questions if q["expected_classification"] == "Partial"]
    print(f"Re-testing {len(partial_questions)} Partial-labeled questions only.\n")

    results = []
    for i, q in enumerate(partial_questions, start=1):
        qid = q["question_id"]
        claim = q["parent_question"]
        matched_chunks = match_chunks_for_question(qid, all_chunks)

        if not matched_chunks:
            print(f"[{i}/{len(partial_questions)}] {qid}: SKIPPED (no chunks mapped)")
            results.append({"question_id": qid, "claim": claim, "correct": False, "error": "no chunks"})
            continue

        try:
            result = score_claim(claim, matched_chunks)
            correct = result.verdict == "Partial"
            marker = "CORRECT" if correct else f"WRONG (got {result.verdict})"
            print(f"[{i}/{len(partial_questions)}] {qid}: {marker}")
            results.append({
                "question_id": qid, "claim": claim,
                "actual_verdict": result.verdict, "correct": correct, "error": None,
            })
            time.sleep(SECONDS_BETWEEN_CALLS)
        except Exception as e:
            print(f"[{i}/{len(partial_questions)}] {qid}: ERROR - {e}")
            results.append({"question_id": qid, "claim": claim, "correct": False, "error": str(e)})

    scored = [r for r in results if not r.get("error")]
    correct = [r for r in scored if r["correct"]]
    print(f"\n{'='*50}")
    print(f"PARTIAL VERDICT ACCURACY: {len(correct)}/{len(scored)} ({len(correct)/max(len(scored),1)*100:.1f}%)")
    print("(Previous run was 9/50 = 18.0%)")

    json.dump(results, open("partial_retest_results.json", "w"), indent=2)
    print("\nFull results saved to partial_retest_results.json")
