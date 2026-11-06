"""Offline ingestion and indexing CLI script for Guitar Theory Kingdom knowledge base.

Usage:
    python backend/scripts/index_theory_kb.py [--input-file data/raw/guitar_theory_kb.json] [--recreate]
"""
import argparse
import json
import os
import sys
import time
from typing import List

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from backend.app.rag.vector_store import (
    TheoryVectorStore,
    DEFAULT_STORAGE_PATH,
    DEFAULT_COLLECTION_NAME,
)
from backend.app.schemas.rag import GuitarTheoryChunk


def index_knowledge_base(
    input_file: str = "data/raw/guitar_theory_kb.json",
    storage_path: str = DEFAULT_STORAGE_PATH,
    recreate: bool = True,
) -> dict:
    """Loads raw theory chunks, embeds them locally with FastEmbed, and indexes into Qdrant."""
    print("=" * 60)
    print("🎸 Guitar Theory Kingdom — Knowledge Base Indexer")
    print("=" * 60)

    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file not found: {input_file}")

    with open(input_file, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    chunks: List[GuitarTheoryChunk] = [GuitarTheoryChunk(**item) for item in raw_data]
    print(f"📖 Loaded {len(chunks)} theory chunks from {input_file}")

    t0 = time.perf_counter()
    vector_store = TheoryVectorStore(path=storage_path, collection_name=DEFAULT_COLLECTION_NAME)
    if recreate:
        print(f"🔄 Re-creating collection '{DEFAULT_COLLECTION_NAME}'...")
        vector_store.init_collection(recreate=True)

    print("⚡ Embedding and indexing chunks into Qdrant local store...")
    upserted_count = vector_store.upsert_chunks(chunks)
    indexing_time = (time.perf_counter() - t0) * 1000

    print(f"✅ Successfully indexed {upserted_count} chunks in {indexing_time:.1f}ms")

    # Benchmark test query
    test_query = "Why does Creep use a minor chord at the end?"
    print(f"\n🔍 Running benchmark verification query: '{test_query}'...")
    t_query = time.perf_counter()
    response = vector_store.search(test_query, limit=1)
    query_time = (time.perf_counter() - t_query) * 1000

    top_result = response.results[0]
    print(f"🎯 Top Result: '{top_result.chunk.title}'")
    print(f"   Harmonic Category: {top_result.chunk.harmonic_category} ({top_result.chunk.roman_numeral})")
    print(f"   Similarity Score: {top_result.score:.4f}")
    print(f"   Query Latency: {query_time:.2f}ms")
    print(f"   Instant Card Hero Move: {top_result.chunk.instant_card.hero_move}")

    # Write summary manifest to data/processed
    os.makedirs("data/processed", exist_ok=True)
    summary = {
        "collection_name": DEFAULT_COLLECTION_NAME,
        "storage_path": storage_path,
        "indexed_chunks": upserted_count,
        "indexing_time_ms": round(indexing_time, 2),
        "benchmark_query": test_query,
        "benchmark_top_result": top_result.chunk.title,
        "benchmark_score": round(top_result.score, 4),
        "benchmark_latency_ms": round(query_time, 2),
        "categories_indexed": list(set(c.harmonic_category for c in chunks)),
    }

    with open("data/processed/index_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"\n📁 Index summary written to data/processed/index_summary.json")
    print("=" * 60)
    return summary


def main():
    parser = argparse.ArgumentParser(description="Index guitar theory knowledge base into Qdrant.")
    parser.add_argument(
        "--input-file",
        default="data/raw/guitar_theory_kb.json",
        help="Path to raw JSON knowledge base file",
    )
    parser.add_argument(
        "--storage-path",
        default=DEFAULT_STORAGE_PATH,
        help="Qdrant storage directory path",
    )
    parser.add_argument(
        "--recreate",
        action="store_true",
        default=True,
        help="Recreate the Qdrant collection",
    )
    args = parser.parse_args()

    index_knowledge_base(
        input_file=args.input_file,
        storage_path=args.storage_path,
        recreate=args.recreate,
    )


if __name__ == "__main__":
    main()
