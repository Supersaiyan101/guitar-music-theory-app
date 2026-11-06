"""Main FastAPI application entry point for Guitar Theory Kingdom."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Guitar Theory Kingdom API",
    description="Deterministic music theory, vector RAG, and AI Guitar Coach engine for intermediate & advanced guitarists.",
    version="1.0.0",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root_status():
    """Root server status check."""
    return {
        "status": "online",
        "service": "Guitar Theory Kingdom API",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    """Health check endpoint for Docker / cloud deployments."""
    return {
        "status": "healthy",
        "service": "guitar-theory-kingdom",
        "version": "1.0.0",
    }
