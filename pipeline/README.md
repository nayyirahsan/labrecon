# LabRecon Ingestion Pipeline

Python pipeline that pulls researcher and publication data from [OpenAlex](https://openalex.org), generates Cohere embeddings, and writes everything to Supabase. Runs on a weekly cron via GitHub Actions.

## What it does

1. Fetches all authors whose last known institution is UT Austin (`ror.org/00hj54h04`) with more than 300 citations from the OpenAlex API.
2. For each researcher, fetches their recent publications (title, abstract, venue, year, DOI, citation count).
3. Builds a profile text from name + publication titles + abstracts, truncated to 8000 chars.
4. Generates a 1024-dimensional Cohere embedding (`embed-english-v3.0`, `search_document` input type).
5. Upserts researchers and publications into Supabase via psycopg2.

## Diff mode vs full mode

**Diff mode** (default, used by CI): only processes researchers whose `last_updated_at` is older than 7 days. A typical weekly run touches a few hundred researchers and completes in under 20 minutes.

**Full mode** (`--full` flag): ignores `last_updated_at` and re-ingests everything. Use this when schema changes require regenerating all embeddings or when starting fresh. Takes roughly 3 hours for ~3,500 researchers.

```bash
python ingest.py         # diff mode
python ingest.py --full  # full re-ingestion
```

## Local setup

Requires Python 3.11+.

```bash
cd pipeline
pip install -r requirements.txt

cp .env.example .env
# Fill in DATABASE_URL and COHERE_API_KEY in .env
```

## Environment variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection pooling → Transaction mode URL |
| `COHERE_API_KEY` | [dashboard.cohere.com](https://dashboard.cohere.com) — same key used by the Next.js app |

## GitHub Actions cron

The workflow at `.github/workflows/ingest.yml` runs every Monday at 06:00 UTC. It requires `DATABASE_URL` and `COHERE_API_KEY` to be set as repository secrets. Trigger a manual run from the Actions tab to backfill or test.

The full mode is not run automatically — trigger it manually when needed:

```bash
# From repo root, trigger the workflow manually via GitHub CLI
gh workflow run ingest.yml
```
