"""FastEmbed local vector embedding service for Guitar Theory Kingdom."""
from typing import List, Optional
from fastembed import TextEmbedding
from backend.app.schemas.rag import GuitarTheoryChunk

DEFAULT_EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
DEFAULT_EMBEDDING_DIM = 384


class TheoryEmbedder:
    """Encapsulates FastEmbed local ONNX embedding model with CPU/GPU runtime."""

    def __init__(self, model_name: str = DEFAULT_EMBEDDING_MODEL):
        self.model_name = model_name
        self.dim = DEFAULT_EMBEDDING_DIM
        self._model = TextEmbedding(model_name=self.model_name)

    def embed_query(self, text: str) -> List[float]:
        """Embeds a single search query string."""
        clean_text = text.strip()
        embeddings = list(self._model.embed([clean_text]))
        return embeddings[0].tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embeds a batch of document strings."""
        clean_texts = [t.strip() for t in texts]
        embeddings = list(self._model.embed(clean_texts))
        return [emb.tolist() for emb in embeddings]

    @property
    def dimension(self) -> int:
        return self.dim


def format_chunk_for_embedding(chunk: GuitarTheoryChunk) -> str:
    """Formats a structured guitar theory chunk into a rich semantic passage for vector search."""
    tags_str = ", ".join(chunk.tags)
    twin_str = ", ".join(chunk.instant_card.twin_songs)
    scales_str = ", ".join(chunk.soloing_scales)
    anchors_str = "; ".join(chunk.caged_anchors)
    chords_str = ", ".join(chunk.target_chords)

    return (
        f"Title: {chunk.title}\n"
        f"Harmonic Category: {chunk.harmonic_category}\n"
        f"Roman Numeral: {chunk.roman_numeral}\n"
        f"Target Chords: {chords_str}\n"
        f"Vibe: {chunk.instant_card.vibe}\n"
        f"Degree Motion: {chunk.instant_card.target_degree_motion}\n"
        f"Hero Move: {chunk.instant_card.hero_move}\n"
        f"Harmonic Explanation: {chunk.the_musical_why}\n"
        f"CAGED Fretboard Anchors: {anchors_str}\n"
        f"Soloing Scales: {scales_str}\n"
        f"Iconic Twin Songs: {twin_str}\n"
        f"Tags: {tags_str}"
    )


# Default singleton instance for fast reuse across endpoints
_default_embedder: Optional[TheoryEmbedder] = None


def get_theory_embedder() -> TheoryEmbedder:
    """Returns or lazily initializes the default TheoryEmbedder singleton."""
    global _default_embedder
    if _default_embedder is None:
        _default_embedder = TheoryEmbedder()
    return _default_embedder
