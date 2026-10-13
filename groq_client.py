import os
import sys
import time
import requests
from typing import Any, Dict, List, Optional


def get_groq_endpoint(model: Optional[str] = None) -> str:
    api_url = os.getenv("GROQ_API_URL", "https://api.groq.com/v1/models")
    base_url = api_url.rstrip("/")
    # Groq API is OpenAI-compatible, so always use v1/chat/completions
    if not base_url.endswith("/v1"):
        base_url = f"{base_url}/v1"
    return f"{base_url}/chat/completions"


def get_generic_groq_endpoint() -> str:
    return get_groq_endpoint()


def chat_completion(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 300,
    top_p: float = 1.0,
    n: int = 1,
) -> Dict[str, Any]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    groq_model = os.getenv("GROQ_MODEL", "groq-1")
    payload = {
        "model": model or groq_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": top_p,
        "n": n,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    endpoint = get_groq_endpoint(model)
    max_retries = 2
    for attempt in range(max_retries):
        response = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        if response.status_code == 429:
            # If daily rate limit (RPD) or tokens per day (TPD) is reached, fail fast so fallback executes immediately
            if "requests per day" in response.text.lower() or "tokens per day" in response.text.lower():
                print(f"[WARN] Groq daily limit reached. Triggering immediate fallback.")
                response.raise_for_status()
            if attempt < max_retries - 1:
                time.sleep(1.0)
                continue
        if response.status_code == 404 and payload["model"] != "qwen/qwen3.8-27b":
            print(f"[WARN] Groq model '{payload['model']}' not found (404). Falling back to 'qwen/qwen3.8-27b'...")
            payload["model"] = "qwen/qwen3.8-27b"
            continue
        if response.status_code != 200:
            print(f"Groq request failed ({response.status_code}): {response.text}")
        response.raise_for_status()
        return response.json()
    response.raise_for_status()
    return response.json()


def extract_groq_text(response: Dict[str, Any]) -> str:
    choices = response.get("choices")
    if not choices or not isinstance(choices, list):
        raise ValueError("No choices returned from Groq API")

    choice = choices[0]
    message = choice.get("message") if isinstance(choice, dict) else None
    if isinstance(message, dict):
        return message.get("content", "").strip()

    content = choice.get("content")
    if isinstance(content, str):
        return content.strip()

    raise ValueError("Groq API response did not include message content")
