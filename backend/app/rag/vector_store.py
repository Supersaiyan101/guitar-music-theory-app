"""Qdrant local vector store manager with Tier-2 instant RAM caching."""
import os
import uuid
from typing import Dict, List, Optional
from qdrant_client import QdrantClient, models
from backend.app.rag.embedder import (
    TheoryEmbedder,
    format_chunk_for_embedding,
    get_theory_embedder,
    DEFAULT_EMBEDDING_DIM,
)
from backend.app.schemas.rag import (
    GuitarTheoryChunk,
    InstantCard,
    ScoredTheoryChunk,
    TheorySearchResponse,
)

DEFAULT_COLLECTION_NAME = "guitar_theory_v1"
DEFAULT_STORAGE_PATH = "data/qdrant_db"


class TheoryVectorStore:
    """Manages local embedded Qdrant vector database with fast in-memory caching for real-time practice."""

    def __init__(
        self,
        path: Optional[str] = None,
        collection_name: str = DEFAULT_COLLECTION_NAME,
        embedder: Optional[TheoryEmbedder] = None,
    ):
        self.collection_name = collection_name
        self.embedder = embedder or get_theory_embedder()

        # Storage initialization: remote URL -> explicit path -> default local disk
        qdrant_url = os.getenv("QDRANT_URL")
        if qdrant_url:
            self.client = QdrantClient(url=qdrant_url)
        elif path == ":memory:":
            self.client = QdrantClient(location=":memory:")
        else:
            storage_path = path or DEFAULT_STORAGE_PATH
            os.makedirs(storage_path, exist_ok=True)
            self.client = QdrantClient(path=storage_path)

        # In-Memory Cache (Tier-2 Instant Lookups, < 1ms)
        self._cache_by_id: Dict[str, GuitarTheoryChunk] = {}
        self._cache_by_category: Dict[str, List[GuitarTheoryChunk]] = {}
        self._cache_by_roman: Dict[str, GuitarTheoryChunk] = {}
        self._cache_by_chord: Dict[str, GuitarTheoryChunk] = {}

        self.init_collection(recreate=False)
        self.hydrate_cache()

    def init_collection(self, recreate: bool = False) -> None:
        """Initializes the Qdrant collection with cosine distance and 384 dimensions."""
        exists = self.client.collection_exists(self.collection_name)
        if exists and recreate:
            self.client.delete_collection(self.collection_name)
            exists = False

        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=DEFAULT_EMBEDDING_DIM,
                    distance=models.Distance.COSINE,
                ),
            )

    def _update_cache(self, chunk: GuitarTheoryChunk) -> None:
        """Stores chunk in in-memory lookups for 0ms retrieval."""
        self._cache_by_id[chunk.id] = chunk

        # Index by harmonic category
        if chunk.harmonic_category not in self._cache_by_category:
            self._cache_by_category[chunk.harmonic_category] = []
        # Replace existing or append
        existing = [c for c in self._cache_by_category[chunk.harmonic_category] if c.id == chunk.id]
        if not existing:
            self._cache_by_category[chunk.harmonic_category].append(chunk)

        # Index by roman numeral
        norm_roman = chunk.roman_numeral.strip().lower()
        self._cache_by_roman[norm_roman] = chunk

        # Index by target chords
        for chord in chunk.target_chords:
            self._cache_by_chord[chord.strip().lower()] = chunk

    def hydrate_cache(self) -> int:
        """Hydrates the in-memory cache by scrolling points from the Qdrant collection."""
        try:
            scroll_result = self.client.scroll(
                collection_name=self.collection_name,
                limit=1000,
                with_payload=True,
                with_vectors=False,
            )
            points, _ = scroll_result
            loaded = 0
            for pt in points:
                if pt.payload:
                    chunk = GuitarTheoryChunk(**pt.payload)
                    self._update_cache(chunk)
                    loaded += 1
            return loaded
        except Exception:
            return 0

    def upsert_chunks(self, chunks: List[GuitarTheoryChunk]) -> int:
        """Embeds and upserts a list of structured theory chunks into Qdrant."""
        if not chunks:
            return 0

        # Build composite semantic passages
        passages = [format_chunk_for_embedding(c) for c in chunks]
        vectors = self.embedder.embed_documents(passages)

        points = []
        for chunk, vector in zip(chunks, vectors):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.id))
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=chunk.model_dump(),
                )
            )
            self._update_cache(chunk)

        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )
        return len(points)

    def search(
        self,
        query: str,
        limit: int = 3,
        harmonic_category: Optional[str] = None,
    ) -> TheorySearchResponse:
        """Performs semantic vector search with optional category filtering."""
        query_vector = self.embedder.embed_query(query)

        query_filter = None
        if harmonic_category:
            query_filter = models.Filter(
                must=[
                    models.FieldCondition(
                        key="harmonic_category",
                        match=models.MatchValue(value=harmonic_category),
                    )
                ]
            )

        search_result = self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        )

        scored_chunks: List[ScoredTheoryChunk] = []
        for pt in search_result.points:
            if pt.payload:
                chunk = GuitarTheoryChunk(**pt.payload)
                scored_chunks.append(
                    ScoredTheoryChunk(
                        chunk=chunk,
                        score=float(pt.score) if pt.score is not None else 0.0,
                    )
                )

        # Derive instant card from top result
        top_instant_card = scored_chunks[0].chunk.instant_card if scored_chunks else None

        return TheorySearchResponse(
            results=scored_chunks,
            instant_card=top_instant_card,
            query=query,
            total_found=len(scored_chunks),
        )

    def get_instant_card(
        self,
        chord_symbol: Optional[str] = None,
        roman_numeral: Optional[str] = None,
        harmonic_category: Optional[str] = None,
    ) -> Optional[InstantCard]:
        """Tier-2 instantaneous lookup from RAM cache (< 0.5ms) without LLM delay."""
        if chord_symbol:
            norm_chord = chord_symbol.strip().lower()
            if norm_chord in self._cache_by_chord:
                return self._cache_by_chord[norm_chord].instant_card

        if roman_numeral:
            norm_roman = roman_numeral.strip().lower()
            if norm_roman in self._cache_by_roman:
                return self._cache_by_roman[norm_roman].instant_card

        if harmonic_category and harmonic_category in self._cache_by_category:
            chunks = self._cache_by_category[harmonic_category]
            if chunks:
                return chunks[0].instant_card

        return None

    def get_chunk_by_id(self, chunk_id: str) -> Optional[GuitarTheoryChunk]:
        """Returns a single chunk by its unique ID from RAM cache."""
        return self._cache_by_id.get(chunk_id)


# Global singleton instance
_default_vector_store: Optional[TheoryVectorStore] = None


def get_theory_vector_store(path: Optional[str] = None) -> TheoryVectorStore:
    """Returns or lazily initializes the default TheoryVectorStore singleton."""
    global _default_vector_store
    if _default_vector_store is None:
        _default_vector_store = TheoryVectorStore(path=path)
    return _default_vector_store
