# LabRecon

Search tool for UT Austin undergrads who want to find faculty research labs and write cold emails that don't read like a template. It indexes 3,487 researchers and 32,538 publications from OpenAlex, runs semantic + keyword search over them, and drafts outreach emails grounded in a specific paper from the lab's publication record.

---

## Architecture

```
Browser
  │
  │  HTTPS
  ▼
Next.js 16 app (Vercel)
  │
  ├─ /search ──────────────► /api/search
  │                               │
  │                          Cohere embed API
  │                               │
  │                          pgvector cosine search
  │                        + pg_trgm keyword match
  │                               │
  │                          Supabase Postgres ◄──────────────┐
  │                                                            │
  ├─ /labs/[id] ──────────► Drizzle ORM                       │
  │                                                            │
  ├─ /generate-email ──────► Gemini 1.5 Flash                 │
  │                                                            │
  └─ /tracker ─────────────► Supabase JS (direct)             │
                                                               │
                                                Python pipeline
                                                (GitHub Actions, weekly)
                                                OpenAlex API → Cohere embeds → upsert
```

The ingestion pipeline is entirely separate from the serving layer. The Next.js app is read-mostly — it never writes researcher or publication data, only user-generated data (tracker entries, email generation logs).

---

## Technical decisions

**pgvector instead of a dedicated vector database.** Colocating vectors with relational data means a single SQL query handles filtering (by department, institution) and nearest-neighbor search in one round trip. Separate vector stores like Pinecone require fetching candidate IDs and then joining back to Postgres, which means either over-fetching or building a second synchronized store. At this dataset size, IVFFlat with 50 lists gives sub-100ms search and eliminates the operational overhead of a second service.

**Hybrid search: 70% semantic + 30% trigram.** Pure embedding search degrades on proper nouns — a query for "Philipp Krähenbühl" or "CRISPR-Cas9 base editing" returns thematic neighbors that miss the exact researcher or technique. pg_trgm trigram matching catches these precisely. The 70/30 weight is applied over a combined score; navigational queries (names) naturally score high on trigram, exploratory queries (research areas) naturally score high on semantic.

**Cohere embed-english-v3.0 with asymmetric input types.** The `search_document` / `search_query` distinction matters for retrieval quality. A paper abstract and a student's natural language query live in different linguistic registers. Cohere's asymmetric model is trained to bridge this gap. At 1024 dimensions, it matches or beats OpenAI's text-embedding-3-small on domain-specific retrieval benchmarks while being cheaper per call.

**OpenAlex for data instead of Semantic Scholar.** OpenAlex has a more permissive API (no key required, higher rate limits) and returns cleaner institution affiliation data via their ROR-linked `last_known_institutions` field, which is what we use to reliably identify current UT Austin faculty rather than historical affiliates.

**Gemini 1.5 Flash for email generation.** Fast, cheap, and has enough instruction-following capability for the structured prompt format used here (specific paper finding → background connection → ask → DOI reference). The system prompt is opinionated about what makes a cold email not terrible: no salutation, concrete finding in the opener, under 200 words.

**Next.js API routes instead of a separate backend.** At current scale (one university, low concurrency), the operational overhead of a separate backend isn't justified. The ingestion pipeline is already Python and completely separate from the serving layer, so the serving layer is free to be simple. If traffic or complexity grows, the API routes can be extracted without touching the frontend.

---

## Data

| | |
|---|---|
| Researchers indexed | 3,487 |
| Publications indexed | 32,538 |
| Embedding dimensions | 1024 (Cohere embed-english-v3.0) |
| Ingestion cadence | Weekly via GitHub Actions (diff mode) |
| Initial full ingestion | ~3 hours |
| Weekly diff run | ~15–20 minutes |

Researchers are filtered to `last_known_institutions` containing UT Austin's ROR ID (`ror.org/00hj54h04`) with `cited_by_count > 300`. This removes visiting scholars, historical affiliates, and researchers with very thin records. The filter reduces the raw OpenAlex author set by roughly 85%.

---

## Local development

**Prerequisites:** Node.js 20+, a Supabase project (free tier works), Cohere API key, Gemini API key.

```bash
git clone https://github.com/nayyirahsan/labrecon.git
cd labrecon

# Copy env template and fill in credentials
cp .env.example .env.local

# Install dependencies
npm install

# Push schema to your Supabase project
npm run db:push

# Start dev server
npm run dev
```

The app is at `http://localhost:3000`. You'll need data in your database — either run the ingestion pipeline (see `pipeline/README.md`) or use `npm run db:seed` to load a small set of sample researchers.

The Supabase project needs the `pgvector` and `pg_trgm` extensions enabled:

```sql
create extension if not exists vector;
create extension if not exists pg_trgm;
```

---

## Ingestion pipeline

See [`pipeline/README.md`](pipeline/README.md) for full setup and usage.

Quick start:

```bash
cd pipeline
pip install -r requirements.txt
cp .env.example .env  # fill in DATABASE_URL and COHERE_API_KEY
python ingest.py       # diff mode — only re-processes stale researchers
python ingest.py --full  # full re-ingestion, ~3 hours
```

The weekly GitHub Actions cron runs diff mode automatically. Secrets required: `DATABASE_URL`, `COHERE_API_KEY`.

---

## What would change at real scale

**IVFFlat → HNSW.** IVFFlat recall degrades as vector count grows because probes required to maintain recall scales with dataset size. HNSW gives better recall/latency tradeoffs above ~300k vectors at the cost of memory and slower index build time.

**Dedicated worker for ingestion.** GitHub Actions works fine now but gives no visibility into partial failures or per-researcher retry state. A job queue with structured per-job logging (status, embeddings generated, publications fetched) would make the pipeline observable and resumable.

**Partition publications by year.** The publications table is append-only and almost every query filters by recency. Range partitioning by year would let Postgres skip older partitions for these queries and make archiving straightforward.

**Redis for hot query caching.** Embedding generation is the most expensive per-request operation. A small number of queries (major research areas, well-known faculty names) likely account for most traffic. Caching embedding + result set for these in Redis with a short TTL would cut Cohere spend and lower median latency.
