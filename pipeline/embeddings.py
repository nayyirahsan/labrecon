import time
import cohere
from config import COHERE_API_KEY, EMBEDDING_MODEL

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = cohere.Client(api_key=COHERE_API_KEY)
    return _client


def build_profile_text(researcher, publications):
    parts = [researcher.get("display_name", "")]
    for pub in publications:
        if pub.get("title"):
            parts.append(pub["title"])
        if pub.get("abstract"):
            parts.append(pub["abstract"])
    text = "\n".join(parts)
    return text[:8000]


def generate_embeddings_batch(texts):
    client = _get_client()
    delay = 1
    for attempt in range(4):
        try:
            result = client.embed(
                texts=texts,
                model=EMBEDDING_MODEL,
                input_type="search_document",
            )
            return [list(emb) for emb in result.embeddings]
        except Exception as e:
            msg = str(e).lower()
            if "rate" in msg or "429" in msg:
                if attempt < 3:
                    time.sleep(delay)
                    delay *= 2
                    continue
            raise
    raise RuntimeError("Embedding batch failed after retries")


def generate_query_embedding(query):
    client = _get_client()
    result = client.embed(
        texts=[query],
        model=EMBEDDING_MODEL,
        input_type="search_query",
    )
    return list(result.embeddings[0])
