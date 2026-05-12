# LabRecon

LabRecon is a research intelligence tool built for undergraduate students at UT Austin who want to find and reach out to faculty research labs. It indexes researcher profiles, publications, and grant data from public academic sources, exposes them through a semantic search interface, and uses Claude to draft personalized cold outreach emails grounded in a lab's most recent published work. The target user is a sophomore or junior with no existing faculty connections who needs to identify labs aligned with their skills and send a first email that doesn't read like a template.

---

## Architecture

```
┌─────────────────────────────────────┐
│         Next.js 14 Frontend         │
│  Search · Profiles · Tracker · Auth │
└──────────────┬──────────────────────┘
               │ HTTPS / REST
┌──────────────▼──────────────────────┐
│         Next.js API Routes          │
│  /search · /labs · /generate-email  │
└──────┬───────────────┬──────────────┘
       │               │
┌──────▼──────┐  ┌─────▼───────────────┐
│  Supabase   │  │   External APIs      │
│  pgvector   │  │  Cohere · Sem Scholar│
└─────────────┘  └─────────────────────┘
```

The ingestion pipeline is a separate Python process that runs weekly via GitHub Actions. It pulls researcher and publication data from the Semantic Scholar API, generates embeddings via Cohere, and writes to Supabase. The Next.js application is read-only at query time — it never writes to the database directly.

---

## Technical Decisions

### Why pgvector over Pinecone or Weaviate

pgvector keeps vectors co-located with the relational data they describe, which means a single SQL query can join researcher metadata, filter by institution or citation count, and run a nearest-neighbor search without a cross-service round trip. Pinecone and Weaviate both require shipping the vector search result set back to the application layer before applying relational filters, which either forces over-fetching or requires maintaining a second synchronized store. For a dataset of this size, pgvector's IVFFlat index is fast enough and eliminates an entire infrastructure dependency.

### Why hybrid search (pgvector semantic + pg_trgm keyword) over pure semantic search

Semantic search alone degrades badly on proper nouns — a query for "Philipp Krähenbühl" or "CRISPR-Cas9 base editing" returns cosine neighbors that are thematically related but may not include the exact researcher or technique the student has in mind. pg_trgm trigram matching handles these cases precisely where the embedding model is imprecise. The two scores are combined with a weighted sum tuned to the query type: navigational queries (names, lab names) weight trigram higher; exploratory queries (research topics, methods) weight semantic higher. This produces noticeably better results for both query patterns without a meaningful latency increase.

### Why Cohere embed-english-v3.0 with asymmetric input types

Cohere's asymmetric embedding model exposes separate `input_type` parameters for indexing (`search_document`) and querying (`search_query`), which produces significantly better retrieval than symmetric models that use the same representation for both. A researcher's publication abstract and a student's natural language query ("labs working on vision transformers for medical imaging") live in very different linguistic registers — the asymmetric model is explicitly trained to bridge this gap. embed-english-v3.0 at 1024 dimensions outperforms OpenAI text-embedding-3-small on BEIR benchmarks for domain-specific retrieval while being cheaper per token at scale.

### Why last_known_institutions filter with cited_by_count > 300 for data quality

Semantic Scholar's author graph includes tens of thousands of researchers with UT Austin affiliation strings — visiting scholars, collaborators who listed UT on one paper, and former postdocs who have since moved. Filtering to `last_known_institutions` containing UT Austin removes historical affiliations and constrains the index to currently active faculty. The `cited_by_count > 300` floor removes graduate students, postdocs, and researchers with very thin publication records from the faculty index, since undergraduates emailing a postdoc expecting a PI conversation is a bad outcome. The combined filter reduces the raw author set by roughly 85% while keeping the relevant population intact.

### Why Next.js API routes over a separate backend service

At MVP scale with a single university's worth of data and a student user base, the operational overhead of a separate backend service (deployment pipeline, inter-service authentication, latency budget) is not justified. Next.js API routes run on the same Vercel deployment, share environment variables trivially, and are fast enough for the read-heavy, low-concurrency workload this application sees. The clean separation between the ingestion pipeline (Python, runs on GitHub Actions) and the serving layer (Next.js) means the backend can be extracted into a standalone service later without touching the frontend.

---

## Performance

| Metric | Value |
|---|---|
| Researchers indexed | 3,487 |
| Publications indexed | 32,538 |
| Semantic search p99 latency | [X]ms |
| Weekly ingestion runtime | ~177 minutes (initial full run) |
| Embeddings dimension | 1024 (Cohere embed-english-v3.0) |

---

## Local Development

**Prerequisites**: Node.js 20, Docker, a Cohere API key, a Supabase project (free tier is sufficient).

```bash
# Clone the repository
git clone https://github.com/nayyirahsan/labrecon.git
cd labrecon

# Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local: SUPABASE_URL, SUPABASE_ANON_KEY, COHERE_API_KEY, ANTHROPIC_API_KEY

# Start Supabase locally (runs Postgres + pgvector in Docker)
docker-compose up -d

# Install dependencies and start the dev server
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Ingestion Pipeline

The ingestion pipeline is a standalone Python process in the `pipeline/` directory. It fetches researcher and publication data from Semantic Scholar, generates Cohere embeddings, and writes to Supabase.

```bash
cd pipeline
pip install -r requirements.txt

# Copy and fill in pipeline environment variables
cp .env.example .env
# Edit pipeline/.env: SEMANTIC_SCHOLAR_API_KEY, COHERE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Run the full ingestion (takes ~3 hours on first run)
python ingest.py --full
```

Subsequent weekly runs are handled automatically by the GitHub Actions workflow defined in `.github/workflows/ingest.yml`. The incremental run (`python ingest.py`) only fetches researchers and publications updated since the last run and completes in under 20 minutes.

---

## What I Would Change at 10x Scale

**IVFFlat → HNSW index.** IVFFlat's recall degrades as the vector count grows because the number of probes required to maintain recall scales with dataset size. HNSW provides better recall/latency tradeoffs at higher vector counts at the cost of higher memory usage and slower index build time — a worthwhile trade at 300k+ vectors.

**Extract ingestion into a dedicated worker service.** The GitHub Actions runner works fine at current scale but doesn't give visibility into partial failures, retry logic, or per-researcher ingestion state. A dedicated worker with its own database connection pool, structured logging, and a job queue (e.g., Vercel Queues or BullMQ) would make the ingestion pipeline observable and recoverable.

**Redis caching for frequent search queries.** Embedding generation is the most expensive per-request operation. Caching the embedding + result set for popular queries (top research areas, well-known faculty names) in Redis with a short TTL would reduce Cohere API spend and lower median latency significantly, since a small number of queries likely account for a disproportionate share of traffic.

**Partition publications by year.** The publications table is append-only and queries almost always filter by recency (last 3–5 years). Range partitioning by year would allow Postgres to skip older partitions entirely for these queries rather than scanning the full table, and would make archiving or dropping old data straightforward.

**Read replica for search queries.** Email generation and tracker writes don't compete with search reads today, but at scale the write load from ingestion would contend with search query throughput on the same instance. Routing all search queries to a read replica isolates ingestion writes from user-facing reads and allows each to scale independently.
