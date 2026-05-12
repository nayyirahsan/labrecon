import os
from dotenv import load_dotenv

load_dotenv()

def _require(key):
    val = os.getenv(key)
    if not val:
        raise SystemExit(f"Missing required env var: {key}\nCopy pipeline/.env.example to pipeline/.env and fill in your values.")
    return val

DATABASE_URL = _require("DATABASE_URL")
COHERE_API_KEY = _require("COHERE_API_KEY")

OPENALEX_BASE_URL = "https://api.openalex.org"
UT_AUSTIN_ROR = "https://ror.org/00hj54h04"
EMBEDDING_MODEL = "embed-english-v3.0"
EMBEDDING_DIM = 1024
BATCH_SIZE = 100
