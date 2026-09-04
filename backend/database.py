import aiosqlite
import json
from datetime import datetime
from typing import Optional

DB_PATH = "tracker.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('sglang', 'ollama', 'llamacpp')),
    host TEXT NOT NULL DEFAULT 'localhost',
    port INTEGER NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS metrics_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    data TEXT NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_metrics_provider_time
    ON metrics_samples(provider_id, timestamp DESC);
"""


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    db = await get_db()
    await db.executescript(SCHEMA)
    await db.commit()
    await db.close()


async def get_providers(db: aiosqlite.Connection) -> list[dict]:
    cursor = await db.execute("SELECT * FROM providers ORDER BY id")
    rows = await cursor.fetchall()
    return [dict(r) for r in rows]


async def get_provider(db: aiosqlite.Connection, provider_id: int) -> Optional[dict]:
    cursor = await db.execute("SELECT * FROM providers WHERE id = ?", (provider_id,))
    row = await cursor.fetchone()
    return dict(row) if row else None


async def create_provider(
    db: aiosqlite.Connection,
    name: str,
    type_: str,
    host: str,
    port: int,
    enabled: bool = True,
) -> dict:
    cursor = await db.execute(
        "INSERT INTO providers (name, type, host, port, enabled) VALUES (?, ?, ?, ?, ?)",
        (name, type_, host, port, int(enabled)),
    )
    await db.commit()
    return await get_provider(db, cursor.lastrowid)


async def update_provider(
    db: aiosqlite.Connection,
    provider_id: int,
    name: Optional[str] = None,
    type_: Optional[str] = None,
    host: Optional[str] = None,
    port: Optional[int] = None,
    enabled: Optional[bool] = None,
) -> Optional[dict]:
    fields = []
    values = []
    if name is not None:
        fields.append("name = ?")
        values.append(name)
    if type_ is not None:
        fields.append("type = ?")
        values.append(type_)
    if host is not None:
        fields.append("host = ?")
        values.append(host)
    if port is not None:
        fields.append("port = ?")
        values.append(port)
    if enabled is not None:
        fields.append("enabled = ?")
        values.append(int(enabled))
    fields.append("updated_at = datetime('now')")
    values.append(provider_id)
    await db.execute(
        f"UPDATE providers SET {', '.join(fields)} WHERE id = ?", values
    )
    await db.commit()
    return await get_provider(db, provider_id)


async def delete_provider(db: aiosqlite.Connection, provider_id: int) -> bool:
    cursor = await db.execute("DELETE FROM providers WHERE id = ?", (provider_id,))
    await db.commit()
    return cursor.rowcount > 0


async def insert_metrics(db: aiosqlite.Connection, provider_id: int, data: dict):
    await db.execute(
        "INSERT INTO metrics_samples (provider_id, data) VALUES (?, ?)",
        (provider_id, json.dumps(data)),
    )
    await db.commit()


async def get_latest_metrics(db: aiosqlite.Connection) -> list[dict]:
    cursor = await db.execute("""
        SELECT m.id, m.provider_id, m.timestamp, m.data, p.name, p.type
        FROM metrics_samples m
        JOIN providers p ON m.provider_id = p.id
        WHERE m.id IN (
            SELECT MAX(id) FROM metrics_samples GROUP BY provider_id
        )
        ORDER BY m.provider_id
    """)
    rows = await cursor.fetchall()
    results = []
    for r in rows:
        d = dict(r)
        d["data"] = json.loads(d["data"])
        results.append(d)
    return results


async def get_metrics_history(
    db: aiosqlite.Connection,
    provider_id: int,
    hours: int = 24,
    limit: int = 1000,
) -> list[dict]:
    cursor = await db.execute(
        """SELECT id, provider_id, timestamp, data
           FROM metrics_samples
           WHERE provider_id = ?
             AND timestamp > datetime('now', ?)
           ORDER BY timestamp DESC
           LIMIT ?""",
        (provider_id, f"-{hours} hours", limit),
    )
    rows = await cursor.fetchall()
    results = []
    for r in rows:
        d = dict(r)
        d["data"] = json.loads(d["data"])
        results.append(d)
    return results


async def get_metrics_summary(
    db: aiosqlite.Connection, provider_id: int
) -> Optional[dict]:
    cursor = await db.execute(
        """SELECT
            COUNT(*) as sample_count,
            MIN(timestamp) as first_sample,
            MAX(timestamp) as last_sample
           FROM metrics_samples
           WHERE provider_id = ?""",
        (provider_id,),
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def cleanup_old_metrics(db: aiosqlite.Connection, days: int = 7):
    await db.execute(
        "DELETE FROM metrics_samples WHERE timestamp < datetime('now', ?)",
        (f"-{days} days",),
    )
    await db.commit()
