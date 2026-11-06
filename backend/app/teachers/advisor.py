"""Pedagogical RAG Guitar Coach orchestrator coordinating context, vectors, and teacher personas."""
import asyncio
import json
from typing import AsyncIterator, Optional
from backend.app.rag.vector_store import TheoryVectorStore, get_theory_vector_store
from backend.app.schemas.coach import (
    CoachExplainRequest,
    CoachExplainResponse,
    TeacherPersonaEnum,
)
from backend.app.schemas.rag import GuitarTheoryChunk, TheorySearchResponse
from backend.app.teachers.context_builder import HarmonicContext, build_harmonic_context
from backend.app.teachers.llm_client import LocalLLMClient, get_llm_client
from backend.app.teachers.personas import build_system_prompt, get_persona
from backend.app.teachers.synthesizer import synthesize_coach_response


class GuitarCoachAdvisor:
    """Coordinates deterministic analysis, vector retrieval, and persona teachers."""

    def __init__(
        self,
        vector_store: Optional[TheoryVectorStore] = None,
        llm_client: Optional[LocalLLMClient] = None,
    ):
        self.vector_store = vector_store or get_theory_vector_store()
        self.llm_client = llm_client or get_llm_client()

    def _retrieve_pedagogy_chunk(self, context: HarmonicContext) -> tuple[GuitarTheoryChunk, float]:
        """Retrieves the most relevant guitar theory chunk from Qdrant local store."""
        search_res: TheorySearchResponse = self.vector_store.search(
            query=context.retrieval_query,
            limit=2,
            harmonic_category=context.category_filter,
        )

        if search_res.results:
            top = search_res.results[0]
            return top.chunk, top.score

        # Fallback to direct roman numeral lookup from cache
        card = self.vector_store.get_instant_card(roman_numeral=context.roman_numeral)
        if card:
            # Find the parent chunk
            for chunk in self.vector_store._cache_by_id.values():
                if chunk.instant_card == card:
                    return chunk, 0.75

        # Ultimate fallback: first available chunk
        first_chunk = next(iter(self.vector_store._cache_by_id.values()))
        return first_chunk, 0.50

    def explain(self, request: CoachExplainRequest) -> CoachExplainResponse:
        """Processes a coaching query and returns full structured pedagogical advice."""
        # Step 1: Deterministic guitar context
        context = build_harmonic_context(request)

        # Step 2: Vector retrieval
        chunk, score = self._retrieve_pedagogy_chunk(context)

        # Step 3: Check for active local LLM (RTX 4060)
        if self.llm_client.is_available():
            system_prompt = build_system_prompt(request.persona)
            user_prompt = (
                f"SONG PROGRESSION: {' -> '.join(context.full_progression)}\n"
                f"ACTIVE CHORD: {context.active_chord} (Roman numeral: {context.roman_numeral})\n"
                f"KEY: {context.key} {context.mode}\n"
                f"HARMONIC FUNCTION: {context.harmonic_function}\n"
                f"VOICE LEADING: {context.moving_voices}\n"
                f"THEORY PRINCIPLE: {chunk.title}\n"
                f"THE MUSICAL WHY: {chunk.the_musical_why}\n"
                f"HERO MOVE: {chunk.instant_card.hero_move}\n\n"
                "Please give inspiring, guitar-specific coaching advice explaining why this chord works "
                "and how to solo over it."
            )
            llm_text = self.llm_client.generate(user_prompt, system_prompt)
            if llm_text:
                resp = synthesize_coach_response(context, chunk, request.persona, score)
                resp.the_musical_why = llm_text
                resp.engine_mode = "llm_generated"
                return resp

        # Step 4: Deterministic fallback synthesizer
        return synthesize_coach_response(context, chunk, request.persona, score)

    async def stream_explain(self, request: CoachExplainRequest) -> AsyncIterator[str]:
        """Streams coaching advice token-by-token via Server-Sent Events (SSE)."""
        context = build_harmonic_context(request)
        chunk, score = self._retrieve_pedagogy_chunk(context)
        resp = synthesize_coach_response(context, chunk, request.persona, score)

        # Yield Event 1: Instant Card metadata for immediate (< 1ms) UI render
        instant_payload = {
            "type": "instant_card",
            "instant_card": chunk.instant_card.model_dump(),
            "target_notes": [t.model_dump() for t in context.target_notes],
            "roman_numeral": context.roman_numeral,
            "harmonic_summary": resp.harmonic_summary,
            "retrieved_concept_id": chunk.id,
            "retrieval_score": score,
        }
        yield f"event: instant_card\ndata: {json.dumps(instant_payload)}\n\n"

        # Check if local Ollama is running on RTX 4060
        if self.llm_client.is_available():
            system_prompt = build_system_prompt(request.persona)
            user_prompt = (
                f"SONG PROGRESSION: {' -> '.join(context.full_progression)}\n"
                f"ACTIVE CHORD: {context.active_chord} (Roman numeral: {context.roman_numeral})\n"
                f"KEY: {context.key} {context.mode}\n"
                f"HARMONIC FUNCTION: {context.harmonic_function}\n"
                f"VOICE LEADING: {context.moving_voices}\n"
                f"THEORY PRINCIPLE: {chunk.title}\n"
                f"THE MUSICAL WHY: {chunk.the_musical_why}\n"
                f"HERO MOVE: {chunk.instant_card.hero_move}\n\n"
                "Explain why this chord change works and give concrete guitar soloing advice."
            )
            accumulated_tokens = []
            async for token in self.llm_client.stream_generate(user_prompt, system_prompt):
                accumulated_tokens.append(token)
                yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"

            # Final complete event
            resp.the_musical_why = "".join(accumulated_tokens)
            resp.engine_mode = "llm_stream"
            yield f"event: complete\ndata: {resp.model_dump_json()}\n\n"
            return

        # Fallback Stream: Stream the synthesized masterclass response word-by-word
        words = resp.the_musical_why.split(" ")
        for i, word in enumerate(words):
            token_str = word if i == 0 else " " + word
            yield f"event: token\ndata: {json.dumps({'token': token_str})}\n\n"
            await asyncio.sleep(0.015)  # Snappy 15ms per token stream

        yield f"event: complete\ndata: {resp.model_dump_json()}\n\n"


# Global advisor singleton
_default_advisor: Optional[GuitarCoachAdvisor] = None


def get_coach_advisor() -> GuitarCoachAdvisor:
    """Returns or initializes the default GuitarCoachAdvisor singleton."""
    global _default_advisor
    if _default_advisor is None:
        _default_advisor = GuitarCoachAdvisor()
    return _default_advisor
