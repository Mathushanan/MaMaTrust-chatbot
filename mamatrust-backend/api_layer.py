"""
MamaTrustAI - API Layer Skeleton
===================================
Owner: Chalana (Backend: Agreement & Integration)

Purpose:
    Wraps score_claim() as an HTTP endpoint so Gayathri's retrieval
    and Mathusha's frontend can call it over the network instead of
    importing the Python module directly.

Run locally:
    pip install fastapi uvicorn --break-system-packages
    uvicorn api_layer:app --reload --port 8000

Then POST to http://localhost:8000/score with body:
    {
      "claim": "Babies should avoid peanuts until age 1.",
      "chunks": [ ...chunk objects... ]
    }

Once Gayathri's retrieval is ready, this endpoint's job is simple:
    1. Take the claim from the frontend/request
    2. Call Gayathri's retrieval to get chunks for that claim
       (currently: caller passes chunks directly - see /score/retrieve
       stub below for where that wiring goes in Week 7)
    3. Pass claim + chunks into score_claim()
    4. Return the result

CURRENT STATE (Week 5): only /score exists, and it expects the CALLER
to already have retrieved chunks (e.g. from sample_chunks.json, or
manually passed in for testing). This lets Mathusha's frontend start
integrating against a real endpoint shape immediately, without
waiting on Gayathri's retrieval being finished.

WEEK 7 TODO: add /score/retrieve which internally calls Gayathri's
retrieval function first, so the frontend only ever needs to send
a claim, not chunks.
"""

from typing import Optional
from datetime import date
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agreement_scoring import score_claim, load_chunks
from baby_profile import calculate_age, filter_chunks_for_age

app = FastAPI(title="MamaTrustAI Agreement Scoring API", version="0.1.0")

# Allow the frontend (running on a different port, e.g. Vite's localhost:5173)
# to call this API from the browser. In production this should be
# restricted to the actual deployed frontend URL instead of "*".
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------
# Request / response schemas (this IS the API contract, enforced)
# ---------------------------------------------------------------------

class Chunk(BaseModel):
    chunk_id: str
    source_name: str
    source_url: str
    topic: str
    age_range: str
    source_type: str
    publish_date: str
    text: str
    escalation_flag: bool = False


class ScoreRequest(BaseModel):
    claim: str = Field(..., min_length=1, description="The parent's infant-feeding claim/question")
    chunks: list[Chunk] = Field(..., description="Evidence chunks retrieved for this claim")
    baby_dob: Optional[date] = None


class ChatRequest(BaseModel):
    claim: str = Field(..., min_length=1, max_length=5000)
    baby_dob: Optional[date] = None


class Source(BaseModel):
    chunk_id: str
    source_name: str
    source_type: str
    stance: str
    source_url: str


class ScoreResponse(BaseModel):
    claim: str
    verdict: str
    confidence: float
    explanation: str
    sources: list[Source]
    escalate: bool
    escalation_reason: Optional[str] = None


# ---------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Simple liveness check - useful for the frontend/CI to confirm
    the API is up before doing real requests."""
    return {"status": "ok"}


@app.post("/score", response_model=ScoreResponse)
def score(request: ScoreRequest):
    """Score a claim against a set of already-retrieved evidence chunks.

    Week 5-6 usage: caller (frontend, test scripts, Postman) passes
    chunks directly - e.g. loaded from sample_chunks.json.

    Week 7+: this becomes the internal call made by /score/retrieve
    once Gayathri's retrieval is wired in ahead of this step.
    """
    try:
        chunk_dicts = [c.model_dump() for c in request.chunks]
        age = validated_age(request.baby_dob)
        result = score_claim(request.claim, filter_chunks_for_age(chunk_dicts, age), baby_age=age)
        return ScoreResponse(**result.to_dict())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")


@app.post("/score/demo")
def score_demo(claim: str):
    """Convenience endpoint for quick manual testing during development:
    scores a claim against the real chunk dataset (real_chunks.json)
    automatically, so you don't need to paste the full chunk list into
    every test call."""
    try:
        chunks = load_chunks(str(Path(__file__).with_name("real_chunks.json")))
        result = score_claim(claim, chunks)
        return result.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")

# The chat UI uses a JSON body so the DOB is not put in the request URL.
# Only calculated age is passed to the scorer/LLM; the raw DOB is not.
def validated_age(baby_dob):
    if baby_dob is None:
        return None
    try:
        return calculate_age(baby_dob)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@app.post("/score/chat")
def score_chat(request: ChatRequest):
    if not request.claim.strip():
        raise HTTPException(status_code=422, detail="Please enter a question.")
    age = validated_age(request.baby_dob)
    try:
        chunks = load_chunks(str(Path(__file__).with_name("real_chunks.json")))
        selected = filter_chunks_for_age(chunks, age)
        result = score_claim(request.claim, selected, baby_age=age).to_dict()
        result["baby_age_months"] = age["age_months"] if age else None
        result["age_filter"] = {
            "applied": age is not None,
            "total_chunks": len(chunks),
            "retained_chunks": len(selected),
        }
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {exc}") from None
