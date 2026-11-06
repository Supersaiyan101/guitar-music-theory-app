"""Unit tests for the FastEmbed local embedding service."""
import math
import pytest
from backend.app.rag.embedder import (
    TheoryEmbedder,
    format_chunk_for_embedding,
    get_theory_embedder,
    DEFAULT_EMBEDDING_DIM,
)
from backend.app.schemas.rag import GuitarTheoryChunk, InstantCard


def cosine_similarity(v1, v2) -> float:
    """Computes cosine similarity between two float vectors."""
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a, b in zip(v1, v2)))
    norm2 = math.sqrt(sum(b * b for a, b in zip(v1, v2)))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


@pytest.fixture(scope="module")
def embedder():
    return get_theory_embedder()


def test_embed_query_dimension(embedder):
    """Test that query embedding produces exact 384-dimension vector."""
    vector = embedder.embed_query("Why does the minor four chord sound bittersweet?")
    assert isinstance(vector, list)
    assert len(vector) == DEFAULT_EMBEDDING_DIM
    assert all(isinstance(x, float) for x in vector)


def test_embed_documents_batch(embedder):
    """Test batch document embedding."""
    docs = [
        "Secondary dominant chords pulling to the vi chord",
        "Tritone substitution replacing V7 with bII7",
        "Hendrix chord embellishments with thumb fretting",
    ]
    vectors = embedder.embed_documents(docs)
    assert len(vectors) == 3
    for vec in vectors:
        assert len(vec) == DEFAULT_EMBEDDING_DIM


def test_semantic_similarity_clustering(embedder):
    """Test that semantically related guitar questions have significantly higher similarity."""
    q_minor_iv_1 = embedder.embed_query("How to play the minor fourth chord in a major key?")
    q_minor_iv_2 = embedder.embed_query("Modal interchange minor iv chord progression and soloing")
    q_unrelated = embedder.embed_query("How to bake chocolate chip cookies in an oven")

    sim_related = cosine_similarity(q_minor_iv_1, q_minor_iv_2)
    sim_unrelated = cosine_similarity(q_minor_iv_1, q_unrelated)

    # Related theory queries should be strongly clustered
    assert sim_related > 0.75
    # Unrelated query should be significantly lower
    assert sim_related > sim_unrelated + 0.20


def test_format_chunk_for_embedding():
    """Test formatting a structured chunk into an embedding string."""
    chunk = GuitarTheoryChunk(
        id="test_chunk",
        title="Test Modal Interchange",
        harmonic_category="modal_interchange",
        roman_numeral="iv",
        target_chords=["iv", "Cm"],
        instant_card=InstantCard(
            vibe="Bittersweet nostalgia",
            hero_move="Slide 1 fret down on G string",
            twin_songs=["Creep"],
            target_degree_motion="3 -> b3",
        ),
        the_musical_why="Borrowing from parallel minor creates emotional tension.",
        caged_anchors=["Root-6 E-Shape: B-string Fret 8"],
        soloing_scales=["Minor Pentatonic"],
        practice_drill="Loop G - C - Cm and target Eb.",
        difficulty="intermediate",
        tags=["minor_iv", "creep"],
    )

    formatted = format_chunk_for_embedding(chunk)
    assert "Title: Test Modal Interchange" in formatted
    assert "Harmonic Category: modal_interchange" in formatted
    assert "Vibe: Bittersweet nostalgia" in formatted
    assert "Hero Move: Slide 1 fret down on G string" in formatted
    assert "Iconic Twin Songs: Creep" in formatted
