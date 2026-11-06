"""Automated unit and integration tests for the Guitar Coach API and RAG Orchestrator."""
import json
import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.schemas.coach import TeacherPersonaEnum


@pytest.fixture(scope="module")
def client():
    """Provides a TestClient for FastAPI endpoints."""
    return TestClient(app)


def test_get_personas_endpoint(client):
    """Test retrieving all teacher personas with rich pedagogical profiles."""
    resp = client.get("/api/coach/personas")
    assert resp.status_code == 200
    data = resp.json()
    assert "personas" in data
    assert len(data["personas"]) == 3

    persona_ids = [p["id"] for p in data["personas"]]
    assert "blues_rock" in persona_ids
    assert "jazz_fusion" in persona_ids
    assert "neo_soul" in persona_ids

    blues = next(p for p in data["personas"] if p["id"] == "blues_rock")
    assert blues["name"] == "The Blues-Rock Veteran"
    assert blues["avatar"] == "🎸"
    assert "B.B. King" in blues["style_influences"]


def test_explain_minor_iv_creep(client):
    """Test explaining the bittersweet minor iv chord change in Creep."""
    payload = {
        "progression": ["G", "B7", "C", "Cm"],
        "active_chord_index": 3,
        "key": "G",
        "mode": "major",
        "persona": "blues_rock",
    }
    resp = client.post("/api/coach/explain", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["retrieved_concept_id"] == "concept_modal_interchange_minor_iv"
    assert data["retrieval_score"] > 0.70
    assert "Bittersweet" in data["instant_card"]["vibe"]
    assert "Creep (Radiohead)" in data["twin_songs"]

    # Fret targets verification
    assert len(data["target_notes"]) > 0
    target_notes = [t["note"] for t in data["target_notes"]]
    assert "Eb" in target_notes

    # 3-step practice drill verification
    assert len(data["practice_drill"]) == 3
    assert data["practice_drill"][0]["step_number"] == 1


def test_explain_secondary_dominant_hotel_california(client):
    """Test explaining secondary dominant tension in Hotel California / G to B7."""
    payload = {
        "progression": ["G", "B7", "C", "Cm"],
        "active_chord_index": 1,
        "key": "G",
        "mode": "major",
        "persona": "jazz_fusion",
        "user_question": "Why does the B7 chord have so much tension before moving to C?",
    }
    resp = client.post("/api/coach/explain", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["retrieved_concept_id"] == "concept_secondary_dominant_V_of_vi"
    assert "D#" in data["instant_card"]["target_degree_motion"]
    assert data["persona_used"]["name"] == "The Jazz-Fusion Virtuoso"


def test_persona_differentiation(client):
    """Test that selecting different personas changes the coaching tone and flavor."""
    base_payload = {
        "progression": ["G", "B7", "C", "Cm"],
        "active_chord_index": 3,
        "key": "G",
        "mode": "major",
    }

    resp_blues = client.post("/api/coach/explain", json={**base_payload, "persona": "blues_rock"}).json()
    resp_jazz = client.post("/api/coach/explain", json={**base_payload, "persona": "jazz_fusion"}).json()
    resp_soul = client.post("/api/coach/explain", json={**base_payload, "persona": "neo_soul"}).json()

    assert "The Blues-Rock Veteran" in resp_blues["the_musical_why"]
    assert "The Jazz-Fusion Virtuoso" in resp_jazz["the_musical_why"]
    assert "The Neo-Soul Balladeer" in resp_soul["the_musical_why"]


def test_instant_card_fast_endpoint(client):
    """Test the sub-1ms instant card cache lookup endpoint."""
    resp_iv = client.get("/api/coach/instant-card?roman=iv")
    assert resp_iv.status_code == 200
    card = resp_iv.json()
    assert card is not None
    assert "Bittersweet" in card["vibe"]

    resp_chord = client.get("/api/coach/instant-card?chord=Db7")
    assert resp_chord.status_code == 200
    card_chord = resp_chord.json()
    assert card_chord is not None
    assert "Db -> C" in card_chord["target_degree_motion"]


def test_streaming_sse_endpoint(client):
    """Test Server-Sent Events streaming endpoint for real-time tokens."""
    payload = {
        "progression": ["G", "B7", "C", "Cm"],
        "active_chord_index": 3,
        "key": "G",
        "mode": "major",
        "persona": "blues_rock",
    }

    with client.stream("POST", "/api/coach/explain/stream", json=payload) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

        events = []
        for line in response.iter_lines():
            if line.startswith("event: "):
                events.append(line.replace("event: ", ""))

        assert "instant_card" in events
        assert "token" in events
        assert "complete" in events
