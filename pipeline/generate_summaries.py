"""
Generate research summaries for researchers with null research_summary.
Reads DATABASE_URL and GROQ_API_KEY from pipeline/.env.
Resumable: only processes rows where research_summary IS NULL.
"""

import os
import sys
import time
import textwrap
from pathlib import Path

from dotenv import load_dotenv
from tqdm import tqdm
from groq import Groq
import groq
from db import get_connection

# Load env from pipeline/.env relative to this file
load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not DATABASE_URL:
    sys.exit("Missing DATABASE_URL in pipeline/.env")
if not GROQ_API_KEY:
    sys.exit("Missing GROQ_API_KEY in pipeline/.env")

client = Groq(api_key=GROQ_API_KEY)

SLEEP_BETWEEN_CALLS = 2  # seconds — ~30 req/min, well within 1,500/day limit


def fetch_researchers(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, name
            FROM researchers
            WHERE research_summary IS NULL
            ORDER BY id
            """
        )
        return cur.fetchall()


def fetch_top_publications(conn, researcher_id, limit=5):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT title, abstract
            FROM publications
            WHERE researcher_id = %s
              AND title IS NOT NULL
            ORDER BY cited_by_count DESC NULLS LAST, year DESC NULLS LAST
            LIMIT %s
            """,
            (researcher_id, limit),
        )
        return cur.fetchall()


def build_prompt(name, pubs):
    papers = []
    for i, (title, abstract) in enumerate(pubs, 1):
        entry = f"Paper {i}: {title}"
        if abstract:
            entry += f"\nAbstract: {abstract[:600]}"
        papers.append(entry)

    papers_block = "\n\n".join(papers) if papers else "No publications available."

    return textwrap.dedent(f"""\
        Based on these paper titles and abstracts, write a 2-3 sentence research summary \
for Professor {name} that describes their research focus, methods, and impact. \
Be specific and technical. Do not start with their name.

{papers_block}""")


def update_summary(conn, researcher_id, summary):
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE researchers SET research_summary = %s WHERE id = %s",
            (summary, researcher_id),
        )
    conn.commit()


def generate_summary(researcher_id: int, name: str) -> str:
    """Call Groq once; on 429/RateLimitError wait 65s and retry once; raises on other errors."""
    conn = get_connection()
    try:
        pubs = fetch_top_publications(conn, researcher_id)
    finally:
        conn.close()
    prompt = build_prompt(name, pubs)

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        summary = response.choices[0].message.content.strip()
        return summary
    except groq.RateLimitError:
        print(f"\n  429 on [{researcher_id}] {name} — sleeping 65s then retrying")
        time.sleep(65)
        # single retry
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        return response.choices[0].message.content.strip()


def main():
    try:
        conn = get_connection()
        try:
            researchers = fetch_researchers(conn)
        finally:
            conn.close()
    except Exception as e:
        sys.exit(f"Failed to query researchers: {e}")

    if not researchers:
        print("All researchers already have summaries.")
        return

    print(f"Found {len(researchers)} researchers without summaries.")

    generated = 0
    errors = []

    for researcher_id, name in tqdm(researchers, desc="Generating summaries"):
        try:
            summary = generate_summary(researcher_id, name)
            conn = get_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE researchers SET research_summary = %s WHERE id = %s",
                        (summary, researcher_id),
                    )
                conn.commit()
            finally:
                conn.close()
            generated += 1
            time.sleep(SLEEP_BETWEEN_CALLS)
        except groq.RateLimitError as e:
            print(f"\n  429 retry also failed for [{researcher_id}] {name} — skipping")
            errors.append((researcher_id, name, f"429 after retry: {e}"))
        except Exception as e:
            errors.append((researcher_id, name, str(e)))

    print(f"\nDone. Generated {generated}/{len(researchers)} summaries.")
    if errors:
        print(f"\n{len(errors)} errors:")
        for rid, rname, msg in errors:
            print(f"  [{rid}] {rname}: {msg}")


if __name__ == "__main__":
    main()
