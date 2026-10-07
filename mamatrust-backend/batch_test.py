"""
MamaTrustAI - Batch Test Harness
==================================
Owner: Chalana (Backend: Agreement & Integration)

Purpose:
    Run score_claim() across many test claims at once (from the team's
    myth dataset) instead of testing one at a time. Useful for sanity
    checking the scoring logic and, later, for measuring accuracy once
    you have expected/ground-truth labels to compare against.

Usage:
    python3 batch_test.py                     # runs against sample_chunks.json
                                                # (same evidence pool for every claim -
                                                #  fine for now since Gayathri's real
                                                #  retrieval isn't wired in yet)

Requires a real ANTHROPIC_API_KEY (or swap call_llm in agreement_scoring.py
for your provider of choice) - without a key this will fail per-claim and
report errors, which is expected in an offline/no-key environment.
"""

import json

from agreement_scoring import load_chunks, score_claim


def load_test_claims(json_path: str, limit: int = None) -> list[dict]:
    """Load claims from a simple dummy JSON file, shape:
    [ {"id": "...", "claim": "..."}, ... ]
    Swap this file out for whatever real claim source you use later."""
    with open(json_path, "r", encoding="utf-8") as f:
        claims = json.load(f)
    if limit:
        claims = claims[:limit]
    return claims


def run_batch(claims: list[dict], chunks: list[dict]) -> list[dict]:
    results = []
    for i, item in enumerate(claims, start=1):
        print(f"[{i}/{len(claims)}] Scoring: {item['claim'][:70]}...")
        try:
            result = score_claim(item["claim"], chunks)
            results.append({
                "id": item["id"],
                "claim": item["claim"],
                **result.to_dict(),
                "error": None,
            })
        except Exception as e:
            results.append({
                "id": item["id"],
                "claim": item["claim"],
                "verdict": None,
                "confidence": None,
                "explanation": None,
                "cited_chunk_ids": None,
                "escalate": None,
                "escalation_reason": None,
                "error": str(e),
            })
    return results


def summarize(results: list[dict]) -> None:
    total = len(results)
    errors = sum(1 for r in results if r["error"])
    succeeded = total - errors
    print("\n" + "=" * 60)
    print(f"BATCH SUMMARY: {succeeded}/{total} scored successfully, {errors} errors")
    if succeeded:
        verdict_counts = {}
        escalate_count = 0
        for r in results:
            if r["error"]:
                continue
            verdict_counts[r["verdict"]] = verdict_counts.get(r["verdict"], 0) + 1
            if r["escalate"]:
                escalate_count += 1
        print("Verdict distribution:", verdict_counts)
        print(f"Escalated: {escalate_count}/{succeeded}")
    if errors:
        print(f"\nNOTE: {errors} claims failed - most likely cause is a missing/invalid")
        print("ANTHROPIC_API_KEY. Set it and re-run for real results.")


def save_results(results: list[dict], out_path: str) -> None:
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved full results to {out_path}")


if __name__ == "__main__":
    chunks = load_chunks("sample_chunks.json")
    claims = load_test_claims("dummy_claims.json")
    results = run_batch(claims, chunks)
    summarize(results)
    save_results(results, "batch_results.json")
