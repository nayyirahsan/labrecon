import time
import requests
from config import OPENALEX_BASE_URL

HEADERS = {"User-Agent": "LabRecon/1.0 (mailto:labrecon@utexas.edu)"}


def _get(url, params, retries=3):
    delay = 1
    for attempt in range(retries):
        r = requests.get(url, params=params, headers=HEADERS, timeout=30)
        if r.status_code == 200:
            return r.json()
        if r.status_code in (429, 500, 502, 503, 504):
            if attempt < retries - 1:
                time.sleep(delay)
                delay *= 2
                continue
        r.raise_for_status()
    raise RuntimeError(f"Failed after {retries} retries: {url}")


def fetch_researchers(institution_ror, cursor="*"):
    data = _get(
        f"{OPENALEX_BASE_URL}/authors",
        {
            "filter": f"last_known_institutions.ror:{institution_ror},has_orcid:true,cited_by_count:>300",
            "per_page": 200,
            "cursor": cursor,
            "mailto": "labrecon@utexas.edu",
        },
    )
    authors = data.get("results", [])
    next_cursor = data.get("meta", {}).get("next_cursor")
    return authors, next_cursor


def fetch_publications(author_openalex_id, max_results=10):
    data = _get(
        f"{OPENALEX_BASE_URL}/works",
        {
            "filter": f"authorships.author.id:{author_openalex_id}",
            "sort": "cited_by_count:desc",
            "per_page": max_results,
        },
    )
    pubs = []
    for w in data.get("results", []):
        pubs.append(
            {
                "openalex_id": w.get("id"),
                "title": w.get("title"),
                "abstract": _reconstruct_abstract(w.get("abstract_inverted_index")),
                "venue": (
                    (w.get("primary_location") or {}).get("source") or {}
                ).get("display_name"),
                "year": w.get("publication_year"),
                "doi": w.get("doi"),
                "cited_by_count": w.get("cited_by_count", 0),
            }
        )
    return pubs


def fetch_all_researchers(institution_ror):
    all_authors = []
    cursor = "*"
    while cursor:
        authors, cursor = fetch_researchers(institution_ror, cursor)
        all_authors.extend(authors)
        # polite crawl delay
        time.sleep(0.1)
    return all_authors


def _reconstruct_abstract(inverted_index):
    if not inverted_index:
        return None
    positions = []
    for word, locs in inverted_index.items():
        for pos in locs:
            positions.append((pos, word))
    positions.sort()
    return " ".join(w for _, w in positions)
