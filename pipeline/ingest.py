#!/usr/bin/env python3
import argparse
import sys
import time
from datetime import datetime, timezone, timedelta

import psycopg2
from tqdm import tqdm

from config import UT_AUSTIN_ROR, BATCH_SIZE
from openalex import fetch_all_researchers, fetch_publications
from embeddings import build_profile_text, generate_embeddings_batch
from db import get_connection, upsert_researcher, upsert_publication, get_researcher_last_updated

STALE_DAYS = 7


def log(msg):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {msg}", flush=True)


def build_researcher_row(author):
    affiliations = author.get("affiliations") or []
    department = None
    if affiliations:
        inst = (affiliations[0].get("institution") or {})
        department = inst.get("display_name")

    return {
        "openalex_id": author.get("id"),
        "name": author.get("display_name"),
        "title": None,
        "department": department,
        "email": None,
        "profile_url": author.get("orcid"),
        "research_summary": None,
        "embedding": None,
    }


def needs_update(conn, openalex_id, full_mode):
    if full_mode:
        return True
    last_updated = get_researcher_last_updated(conn, openalex_id)
    if last_updated is None:
        return True
    cutoff = datetime.now(timezone.utc) - timedelta(days=STALE_DAYS)
    if last_updated.tzinfo is None:
        last_updated = last_updated.replace(tzinfo=timezone.utc)
    return last_updated < cutoff


def main():
    parser = argparse.ArgumentParser(description="Ingest UT Austin researchers into Supabase")
    parser.add_argument("--full", action="store_true", help="Full re-ingestion (ignore last_updated_at)")
    args = parser.parse_args()

    start_time = time.time()
    mode = "full" if args.full else "diff"
    log(f"Starting ingestion — mode={mode}, institution={UT_AUSTIN_ROR}")

    log("Fetching researchers from OpenAlex...")
    all_researchers = fetch_all_researchers(UT_AUSTIN_ROR)
    log(f"Researchers found: {len(all_researchers)}")

    conn = get_connection()

    to_process = []
    for author in all_researchers:
        openalex_id = author.get("id")
        if openalex_id and needs_update(conn, openalex_id, args.full):
            to_process.append(author)

    log(f"Researchers needing update: {len(to_process)}")

    processed = 0
    errors = 0

    # Work in batches to amortise embedding API calls
    for batch_start in range(0, len(to_process), BATCH_SIZE):
        batch = to_process[batch_start : batch_start + BATCH_SIZE]

        # 1. Fetch publications for each researcher in this batch
        batch_researchers = []
        batch_publications = []
        for author in tqdm(batch, desc=f"Fetching pubs (batch {batch_start // BATCH_SIZE + 1})", leave=False):
            openalex_id = author.get("id")
            try:
                pubs = fetch_publications(openalex_id, max_results=10)
            except Exception as e:
                log(f"ERROR fetching publications for {openalex_id}: {e}")
                errors += 1
                continue
            batch_researchers.append((author, pubs))
            batch_publications.append(pubs)

        if not batch_researchers:
            continue

        # 2. Build profile texts
        texts = [
            build_profile_text(author, pubs)
            for author, pubs in batch_researchers
        ]

        # 3. Generate embeddings for the whole batch
        try:
            embeddings = generate_embeddings_batch(texts)
        except Exception as e:
            log(f"ERROR generating embeddings for batch starting at {batch_start}: {e}")
            errors += len(batch_researchers)
            continue

        # 4. Upsert researchers + publications
        for (author, pubs), embedding in zip(batch_researchers, embeddings):
            openalex_id = author.get("id")
            for attempt in range(2):
                try:
                    row = build_researcher_row(author)
                    row["embedding"] = str(embedding)  # psycopg2 sends as text; cast ::vector in SQL
                    researcher_db_id = upsert_researcher(conn, row)
                    for pub in pubs:
                        upsert_publication(conn, pub, researcher_db_id)
                    processed += 1
                    break
                except psycopg2.OperationalError as e:
                    if attempt == 0:
                        log(f"Connection dropped for {openalex_id}, reconnecting...")
                        time.sleep(10)
                        conn = get_connection()
                    else:
                        log(f"ERROR upserting {openalex_id} after reconnect: {e}")
                        errors += 1
                except Exception as e:
                    log(f"ERROR upserting {openalex_id}: {e}")
                    errors += 1
                    conn.rollback()
                    break

    conn.close()

    # Summary
    duration = (time.time() - start_time) / 60
    summary_conn = get_connection()
    with summary_conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM researchers")
        total_researchers = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM publications")
        total_pubs = cur.fetchone()[0]
    summary_conn.close()

    log("=" * 60)
    log(f"Run complete in {duration:.1f} minutes")
    log(f"  Processed this run : {processed}")
    log(f"  Errors             : {errors}")
    log(f"  Total researchers  : {total_researchers}")
    log(f"  Total publications : {total_pubs}")
    log("=" * 60)

    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
