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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agreement_scoring import score_claim, load_chunks

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
        result = score_claim(request.claim, chunk_dicts)
        return ScoreResponse(**result.to_dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")


@app.post("/score/demo")
def score_demo(claim: str):
    """Convenience endpoint for quick manual testing during development:
    scores a claim against the real chunk dataset (real_chunks.json)
    automatically, so you don't need to paste the full chunk list into
    every test call."""
    try:
        chunks = load_chunks("real_chunks.json")
        result = score_claim(claim, chunks)
        return result.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")