"""Main FastAPI application entry point for Guitar Theory Kingdom."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.endpoints.coach import router as coach_router
from backend.app.api.endpoints.audio import router as audio_router

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

# Mount Routers
app.include_router(coach_router)
app.include_router(audio_router)


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
