import pytest
import pytest_asyncio
import os
import tempfile
from backend.database import (
    init_db,
    get_db,
    get_providers,
    get_provider,
    create_provider,
    update_provider,
    delete_provider,
    insert_metrics,
    get_latest_metrics,
    get_metrics_history,
    get_metrics_summary,
)
import backend.database as db_module


@pytest_asyncio.fixture(autouse=True)
async def setup_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    db_module.DB_PATH = db_path
    await init_db()
    yield


@pytest.mark.asyncio
async def test_create_provider():
    db = await get_db()
    try:
        p = await create_provider(db, "Test SGLang", "sglang", "localhost", 30000)
        assert p["name"] == "Test SGLang"
        assert p["type"] == "sglang"
        assert p["host"] == "localhost"
        assert p["port"] == 30000
        assert p["enabled"] == 1
        assert p["id"] > 0
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_get_providers():
    db = await get_db()
    try:
        await create_provider(db, "A", "sglang", "localhost", 30000)
        await create_provider(db, "B", "ollama", "localhost", 11434)
        providers = await get_providers(db)
        assert len(providers) == 2
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_get_provider():
    db = await get_db()
    try:
        p = await create_provider(db, "Test", "llamacpp", "127.0.0.1", 8080)
        found = await get_provider(db, p["id"])
        assert found is not None
        assert found["name"] == "Test"
        missing = await get_provider(db, 9999)
        assert missing is None
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_update_provider():
    db = await get_db()
    try:
        p = await create_provider(db, "Original", "sglang", "localhost", 30000)
        updated = await update_provider(db, p["id"], name="Renamed", port=30001)
        assert updated["name"] == "Renamed"
        assert updated["port"] == 30001
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_delete_provider():
    db = await get_db()
    try:
        p = await create_provider(db, "ToDelete", "ollama", "localhost", 11434)
        deleted = await delete_provider(db, p["id"])
        assert deleted is True
        assert await get_provider(db, p["id"]) is None
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_insert_and_get_latest_metrics():
    db = await get_db()
    try:
        p = await create_provider(db, "Metrics", "sglang", "localhost", 30000)
        await insert_metrics(db, p["id"], {"tokens_per_sec": 42.0, "active": 3})
        latest = await get_latest_metrics(db)
        assert len(latest) == 1
        assert latest[0]["provider_id"] == p["id"]
        assert latest[0]["data"]["tokens_per_sec"] == 42.0
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_metrics_history():
    db = await get_db()
    try:
        p = await create_provider(db, "History", "sglang", "localhost", 30000)
        for i in range(5):
            await insert_metrics(db, p["id"], {"iter": i})
        history = await get_metrics_history(db, p["id"], hours=1, limit=3)
        assert len(history) <= 3
    finally:
        await db.close()


@pytest.mark.asyncio
async def test_metrics_summary():
    db = await get_db()
    try:
        p = await create_provider(db, "Summary", "sglang", "localhost", 30000)
        await insert_metrics(db, p["id"], {"x": 1})
        summary = await get_metrics_summary(db, p["id"])
        assert summary["sample_count"] == 1
        assert summary["first_sample"] is not None
    finally:
        await db.close()
