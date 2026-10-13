"""
MamaTrustAI - Agreement Scoring Module
========================================
Owner: Chalana (Backend: Agreement & Integration)

Purpose:
    Takes a user's infant-feeding claim + a list of retrieved evidence
    "chunks" (from C's retrieval step) and produces a Supported /
    Unsupported / Uncertain verdict, grounded in the cited chunks.

This is the API CONTRACT to align with C:

    INPUT  (what C's retrieval must hand to this module):
        {
          "claim": str,
          "chunks": [ <chunk objects exactly like sample_chunks.json> ]
        }

    OUTPUT (what this module hands to the API layer / frontend):
        {
          "claim": str,
          "verdict": "Supported" | "Unsupported" | "Partial" | "Uncertain",
          "confidence": float (0.0-1.0),
          "explanation": str,
          "cited_chunk_ids": [str, ...],
          "escalate": bool,
          "escalation_reason": str | null
        }

Swap LLM providers:
    Currently uses Google Gemini (free tier, no billing needed).
    Only `call_llm()` needs to change to point at OpenAI / Anthropic /
    Llama 3.1 instead. Everything else (prompt building, parsing,
    escalation logic) stays the same regardless of provider.
"""

import json
import os
import re
from dataclasses import dataclass, field
from typing import Optional
import urllib.request

from dotenv import load_dotenv
load_dotenv()  # reads GEMINI_API_KEY from a local .env file (never committed to git)


# ---------------------------------------------------------------------
# 1. Data loading (stand-in for C's real retrieval output during dev)
# ---------------------------------------------------------------------

def load_chunks(path: str) -> list[dict]:
    """Load chunk objects from a local JSON file (e.g. sample_chunks.json).
    In production, this is replaced by whatever C's retrieval function
    returns directly - same list-of-dicts shape."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------
# 2. Prompt construction
# ---------------------------------------------------------------------

SYSTEM_PROMPT = """You are a claim-verification engine for MamaTrustAI, an infant-feeding \
advice assistant. You will be given a parent's claim about infant feeding or food allergy, \
and a set of evidence chunks retrieved from authoritative clinical sources (WHO, ASCIA, \
BSACI, CPS, AAP, NIAID, etc).

Your job: decide whether the CLAIM is Supported, Unsupported, Partial, or Uncertain based ONLY on \
the provided chunks. Do not use outside knowledge beyond what's in the chunks.

Rules:
- "Supported": the chunks directly confirm the claim is accurate/recommended practice.
- "Unsupported": the chunks directly contradict the claim (it's a myth or outdated advice).
- "Partial": use this whenever a single confident Supported/Unsupported answer would be \
misleading because the real answer is "it depends" or involves weighing more than one \
consideration. This includes, not just direct source-vs-source contradiction:
    (a) Different guideline bodies give genuinely different specific recommendations \
(e.g. one requires testing in some cases, another doesn't require it as a rule).
    (b) The answer depends on context the chunks show varies (e.g. risk category, \
population, access to specialists, country/region).
    (c) A comparison question where the two things being compared aren't equally \
supported (e.g. "is the evidence for X as strong as for Y" where the chunks show one \
has much stronger evidence than the other).
    (d) A question asking to synthesize across multiple studies/trials that don't all \
point the same direction or show different effect sizes - not just one single trial result.
    (e) A methodological/explanatory question where understanding the nuance itself \
IS the point of the question (e.g. explaining why two analysis methods gave different \
results), rather than a plain fact lookup.
  Only use "Uncertain" when the chunks genuinely don't address the topic at all. If the \
chunks say ANYTHING relevant - even if the signal is mixed, weak, or only partially answers \
the question - that is "Partial", not "Uncertain". Do not default to "Uncertain" just \
because the evidence doesn't give one clean, confident answer; that is exactly what \
"Partial" is for.

- Watch for ABSOLUTE framing in the claim itself: words like "always", "definitely", \
"the same", "everywhere", "all", "never", "completely". If the chunks show the claim is \
true in SOME contexts/conditions/populations but not universally true as stated, that is \
"Partial" (the absolute claim is an overreach), not a flat "Supported" or "Unsupported". \
Only give a flat "Supported" to an absolute claim if the chunks themselves state it without \
qualification; only give a flat "Unsupported" if the chunks directly contradict it with no \
exceptions noted.
- "Uncertain": the chunks are insufficient, or simply don't address the claim at all.
- Always cite the chunk_id(s) that most directly support your verdict.
- If none of the chunks are relevant to the claim, verdict must be "Uncertain" with an \
empty citation list.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "verdict": "Supported" | "Unsupported" | "Partial" | "Uncertain",
  "confidence": <float 0.0 to 1.0>,
  "explanation": "<2-3 sentence plain-English explanation a parent could understand>",
  "cited_sources": [
    {"chunk_id": "<chunk_id>", "stance": "<one short phrase summarizing what THIS specific source says>"}
  ]
}
"""


def build_user_prompt(claim: str, chunks: list[dict], baby_age: Optional[dict] = None) -> str:
    chunk_block = "\n\n".join(
        f"[chunk_id: {c['chunk_id']}] ({c['source_name']}, {c.get('publish_date', 'n.d.')})\n"
        + (f"Age scope: {c.get('age_range', 'unspecified')}\n" if baby_age is not None else "") + f"{c['text']}"
        for c in chunks
    )
    context = ""
    if baby_age is not None:
        context = (
            f"BABY AGE: {baby_age['age_months']} completed calendar months "
            f"({baby_age['age_days']} days).\n"
            "Use this age when interpreting the question. Distinguish recommendations "
            "for this baby from research or guidance about other ages or maternal stages. "
            "Do not infer readiness for solids, allergy risk, or preterm corrected age "
            "from chronological age alone. Broad or unclear age labels were retained; "
            "check the actual text before treating a chunk as applicable. "
            "If evidence does not answer the question for this age, say so rather than "
            "using an out-of-age recommendation.\n\n"
        )
    return context + f'CLAIM: "{claim}"\n\nEVIDENCE CHUNKS:\n\n{chunk_block}'


# ---------------------------------------------------------------------
# 3. LLM call (swap this function for OpenAI / Llama 3.1 later)
# ---------------------------------------------------------------------

def call_llm(system_prompt: str, user_prompt: str, model: str = "gemini-3.5-flash-lite") -> str:
    """Calls the Google Gemini API (free tier, no billing required).
    Swap this out for another provider by changing only this function -
    the rest of the pipeline doesn't need to know which provider is
    behind it."""
    api_key = os.environ.get("GEMINI_API_KEY", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps({
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.0, "maxOutputTokens": 500},
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        raise RuntimeError(f"Gemini API returned HTTP {e.code}: {error_body}") from None
    return data["candidates"][0]["content"]["parts"][0]["text"]


# ---------------------------------------------------------------------
# 4. Response parsing
# ---------------------------------------------------------------------

def parse_llm_response(raw_text: str) -> dict:
    """Extract the JSON object from the LLM's response, tolerating minor
    formatting noise (e.g. accidental markdown fences)."""
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(json)?", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM did not return valid JSON: {e}\nRaw output: {raw_text}")

    required = {"verdict", "confidence", "explanation", "cited_sources"}
    missing = required - parsed.keys()
    if missing:
        raise ValueError(f"LLM response missing required fields: {missing}")
    if parsed["verdict"] not in {"Supported", "Unsupported", "Partial", "Uncertain"}:
        raise ValueError(f"Invalid verdict value: {parsed['verdict']}")

    return parsed


# ---------------------------------------------------------------------
# 5. Escalation logic
# ---------------------------------------------------------------------

def check_safety_escalation(chunks: list[dict], cited_sources: list[dict]) -> tuple[bool, Optional[str]]:
    """Check specifically for the SAFETY-CRITICAL escalation case: a cited
    chunk is flagged as emergency/reaction-symptom content. This is checked
    separately from the low-evidence case because a safety-critical result
    should override the verdict entirely (see score_claim) rather than sit
    alongside a Supported/Unsupported/Partial label that doesn't make sense
    for an emergency question."""
    cited_ids = {s["chunk_id"] for s in cited_sources}
    for c in chunks:
        if c["chunk_id"] in cited_ids and c.get("escalation_flag"):
            return True, f"Cited source '{c['source_name']}' is flagged as safety-critical content."
    return False, None


def check_uncertain_escalation(verdict: str) -> tuple[bool, Optional[str]]:
    """Check the low-evidence escalation case: verdict came back Uncertain,
    meaning there wasn't confident grounded evidence either way."""
    if verdict == "Uncertain":
        return True, "Evidence was insufficient to confidently confirm or refute this claim."
    return False, None


def build_sources_list(chunks: list[dict], cited_sources: list[dict]) -> list[dict]:
    """Cross-reference the LLM's cited chunk_ids + stance against the REAL
    chunk data (never trust the LLM to generate URLs/source names itself -
    that's a hallucination risk). Returns the sources list in the shape
    the frontend needs to render clickable citations.

    Matches the shape of sample_api_response.json's "sources" field."""
    chunk_lookup = {c["chunk_id"]: c for c in chunks}
    sources = []
    for cited in cited_sources:
        chunk = chunk_lookup.get(cited["chunk_id"])
        if chunk is None:
            continue  # LLM cited a chunk_id that doesn't exist - skip it, don't fabricate
        sources.append({
            "chunk_id": chunk["chunk_id"],
            "source_name": chunk["source_name"],
            "source_type": chunk.get("source_type", ""),
            "stance": cited.get("stance", ""),
            "source_url": chunk["source_url"],
        })
    return sources


# ---------------------------------------------------------------------
# 6. Orchestration - the single function the API layer calls
# ---------------------------------------------------------------------

@dataclass
class ScoringResult:
    claim: str
    verdict: str
    confidence: float
    explanation: str
    sources: list[dict]
    escalate: bool
    escalation_reason: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "claim": self.claim,
            "verdict": self.verdict,
            "confidence": self.confidence,
            "explanation": self.explanation,
            "sources": self.sources,
            "escalate": self.escalate,
            "escalation_reason": self.escalation_reason,
        }


def score_claim(claim: str, chunks: list[dict], baby_age: Optional[dict] = None) -> ScoringResult:
    """Main entry point. This is the function the API layer skeleton
    should call: score_claim(claim, chunks) -> ScoringResult"""
    if not chunks:
        return ScoringResult(
            claim=claim,
            verdict="Uncertain",
            confidence=0.0,
            explanation="No evidence chunks were retrieved for this claim.",
            sources=[],
            escalate=True,
            escalation_reason="No retrieved evidence to ground a response.",
        )

    user_prompt = build_user_prompt(claim, chunks, baby_age)
    raw = call_llm(SYSTEM_PROMPT, user_prompt)
    parsed = parse_llm_response(raw)

    sources = build_sources_list(chunks, parsed["cited_sources"])

    # Safety-critical case takes priority: overrides the verdict entirely,
    # since "Supported"/"Unsupported"/"Partial" don't make sense as a label
    # on an emergency symptom question. This matches the real eval dataset,
    # which treats "Escalate" as its own classification, not a variant of
    # the other four verdicts.
    safety_escalate, safety_reason = check_safety_escalation(chunks, parsed["cited_sources"])
    if safety_escalate:
        return ScoringResult(
            claim=claim,
            verdict="Escalate",
            confidence=float(parsed["confidence"]),
            explanation=parsed["explanation"],
            sources=sources,
            escalate=True,
            escalation_reason=safety_reason,
        )

    uncertain_escalate, uncertain_reason = check_uncertain_escalation(parsed["verdict"])

    return ScoringResult(
        claim=claim,
        verdict=parsed["verdict"],
        confidence=float(parsed["confidence"]),
        explanation=parsed["explanation"],
        sources=sources,
        escalate=uncertain_escalate,
        escalation_reason=uncertain_reason,
    )


# ---------------------------------------------------------------------
# 7. Quick manual test (run this file directly to sanity check)
# ---------------------------------------------------------------------

if __name__ == "__main__":
    chunks = load_chunks("real_chunks.json")

    test_claims = [
        "Babies should avoid peanuts and eggs until age 1 to prevent food allergy.",
        "My baby is turning blue and can't breathe after eating - what should I do?",
        "Goat milk formula is a good way to prevent food allergies in babies.",
        "Does my baby need a peanut skin-prick test before I start peanut at home?",
    ]

    for claim in test_claims:
        print("=" * 70)
        print("CLAIM:", claim)
        result = score_claim(claim, chunks)
        print(json.dumps(result.to_dict(), indent=2))