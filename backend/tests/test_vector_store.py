"""Unit tests for the Qdrant local vector store manager and instant RAM caching."""
import json
import pytest
from backend.app.rag.vector_store import TheoryVectorStore
from backend.app.schemas.rag import GuitarTheoryChunk


@pytest.fixture(scope="module")
def vector_store():
    """Initializes an in-memory TheoryVectorStore populated with all 10 theory chunks."""
    vs = TheoryVectorStore(path=":memory:")
    with open("data/raw/guitar_theory_kb.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    chunks = [GuitarTheoryChunk(**item) for item in data]
    vs.upsert_chunks(chunks)
    return vs


def test_upsert_and_cache_population(vector_store):
    """Test that all 10 chunks are indexed and present in memory cache."""
    assert len(vector_store._cache_by_id) == 10
    chunk = vector_store.get_chunk_by_id("concept_modal_interchange_minor_iv")
    assert chunk is not None
    assert chunk.roman_numeral == "iv"
    assert "Creep (Radiohead)" in chunk.instant_card.twin_songs


def test_semantic_search_minor_iv(vector_store):
    """Test semantic query for the bittersweet minor 4 chord."""
    res = vector_store.search("Why does Creep use a minor chord at the end?", limit=3)
    assert len(res.results) > 0
    top = res.results[0]
    assert top.chunk.id == "concept_modal_interchange_minor_iv"
    assert top.score > 0.70
    assert res.instant_card is not None
    assert "Bittersweet" in res.instant_card.vibe


def test_semantic_search_secondary_dominant(vector_store):
    """Test semantic query for Spanish tension / secondary dominants."""
    res = vector_store.search("Why does the major III secondary dominant chord resolve to minor vi in Hotel California?", limit=3)
    assert len(res.results) > 0
    top = res.results[0]
    assert top.chunk.id == "concept_secondary_dominant_V_of_vi"
    assert "D#" in top.chunk.instant_card.target_degree_motion


def test_semantic_search_santana_dorian(vector_store):
    """Test semantic query for Carlos Santana modal soloing."""
    res = vector_store.search("Carlos Santana sound using the sweet raised sixth note", limit=3)
    assert len(res.results) > 0
    top = res.results[0]
    assert top.chunk.id == "concept_dorian_vs_aeolian_modal_shift"
    assert "Major 6th" in top.chunk.instant_card.target_degree_motion


def test_semantic_search_eric_johnson_triads(vector_store):
    """Test semantic query for Eric Johnson superimposed triads."""
    res = vector_store.search("Playing simple three-note triads over major seventh chords like Eric Johnson", limit=3)
    assert len(res.results) > 0
    top = res.results[0]
    assert top.chunk.id == "concept_superimposed_triads_upper_extensions"


def test_category_filtering(vector_store):
    """Test searching with a strict harmonic category filter."""
    res = vector_store.search("What scales to play", limit=5, harmonic_category="blues_shift")
    assert len(res.results) == 1
    assert res.results[0].chunk.id == "concept_blues_I7_to_IV7_shift"
    assert res.results[0].chunk.harmonic_category == "blues_shift"


def test_tier_2_instant_card_lookups(vector_store):
    """Test Tier-2 instant RAM cache lookups (< 1ms)."""
    # 1. Lookup by Roman Numeral
    card_iv = vector_store.get_instant_card(roman_numeral="iv")
    assert card_iv is not None
    assert "3 -> b3" in card_iv.target_degree_motion

    # 2. Lookup by Specific Chord
    card_cm = vector_store.get_instant_card(chord_symbol="Cm")
    assert card_cm is not None
    assert "3 -> b3" in card_cm.target_degree_motion

    card_db7 = vector_store.get_instant_card(chord_symbol="Db7")
    assert card_db7 is not None
    assert "Db -> C" in card_db7.target_degree_motion

    # 3. Lookup by Category
    card_embellish = vector_store.get_instant_card(harmonic_category="embellishment")
    assert card_embellish is not None
    assert "Little Wing" in card_embellish.twin_songs[0]

    # 4. Unknown chord returns None safely
    card_unknown = vector_store.get_instant_card(chord_symbol="Zmaj13#11")
    assert card_unknown is None
