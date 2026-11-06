"""Local LLM client for Ollama with RTX 4060 GPU inference and automatic fallback."""
import json
import os
from typing import AsyncIterator, Optional
import httpx
import requests

DEFAULT_OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


class LocalLLMClient:
    """Manages connection to local Ollama instance on RTX 4060 with graceful fallback."""

    def __init__(
        self,
        base_url: str = DEFAULT_OLLAMA_URL,
        model: str = DEFAULT_OLLAMA_MODEL,
        timeout: float = 30.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def is_available(self) -> bool:
        """Fast check (200ms) to see if local Ollama server is running and responsive."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=0.3)
            return resp.status_code == 200
        except Exception:
            return False

    def generate(self, prompt: str, system_prompt: str) -> Optional[str]:
        """Synchronously generates a completion from local Ollama model."""
        if not self.is_available():
            return None

        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "system": system_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                },
            }
            resp = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout,
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("response")
            return None
        except Exception:
            return None

    async def stream_generate(
        self,
        prompt: str,
        system_prompt: str,
    ) -> AsyncIterator[str]:
        """Asynchronously streams generated tokens from Ollama via Server-Sent Events."""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": True,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/api/generate",
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        return
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk = json.loads(line)
                                token = chunk.get("response", "")
                                if token:
                                    yield token
                                if chunk.get("done", False):
                                    break
                            except Exception:
                                continue
        except Exception:
            return


# Global client instance
_default_llm_client: Optional[LocalLLMClient] = None


def get_llm_client() -> LocalLLMClient:
    """Returns or initializes the default LocalLLMClient singleton."""
    global _default_llm_client
    if _default_llm_client is None:
        _default_llm_client = LocalLLMClient()
    return _default_llm_client
