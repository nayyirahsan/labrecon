import psycopg2
from config import DATABASE_URL


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def upsert_researcher(conn, researcher_data):
    sql = """
        INSERT INTO researchers (
            openalex_id, name, title, department,
            email, profile_url, research_summary,
            embedding, last_updated_at
        ) VALUES (
            %(openalex_id)s, %(name)s, %(title)s, %(department)s,
            %(email)s, %(profile_url)s, %(research_summary)s,
            %(embedding)s::vector, NOW()
        )
        ON CONFLICT (openalex_id) DO UPDATE SET
            name             = EXCLUDED.name,
            title            = EXCLUDED.title,
            department       = EXCLUDED.department,
            email            = EXCLUDED.email,
            profile_url      = EXCLUDED.profile_url,
            research_summary = EXCLUDED.research_summary,
            embedding        = EXCLUDED.embedding,
            last_updated_at  = NOW()
        RETURNING id
    """
    with conn.cursor() as cur:
        cur.execute(sql, researcher_data)
        row = cur.fetchone()
        conn.commit()
        return row[0]


def upsert_publication(conn, pub_data, researcher_id):
    sql = """
        INSERT INTO publications (
            openalex_id, researcher_id, title, abstract,
            venue, year, doi, cited_by_count
        ) VALUES (
            %(openalex_id)s, %(researcher_id)s, COALESCE(%(title)s, 'Untitled'), %(abstract)s,
            %(venue)s, %(year)s, %(doi)s, %(cited_by_count)s
        )
        ON CONFLICT (openalex_id) DO UPDATE SET
            title          = EXCLUDED.title,
            abstract       = EXCLUDED.abstract,
            venue          = EXCLUDED.venue,
            year           = EXCLUDED.year,
            doi            = EXCLUDED.doi,
            cited_by_count = EXCLUDED.cited_by_count
    """
    pub_data = dict(pub_data, researcher_id=researcher_id)
    with conn.cursor() as cur:
        cur.execute(sql, pub_data)
        conn.commit()


def get_existing_researcher(conn, openalex_id):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM researchers WHERE openalex_id = %s", (openalex_id,)
        )
        return cur.fetchone()


def get_researcher_last_updated(conn, openalex_id):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT last_updated_at FROM researchers WHERE openalex_id = %s",
            (openalex_id,),
        )
        row = cur.fetchone()
        return row[0] if row else None
