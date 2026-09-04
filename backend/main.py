from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from .database import (
    init_db,
    get_db,
    get_providers,
    get_provider,
    create_provider,
    update_provider,
    delete_provider,
    get_latest_metrics,
    get_metrics_history,
    get_metrics_summary,
    cleanup_old_metrics,
)
from .models import (
    ProviderCreate,
    ProviderUpdate,
    ProviderResponse,
    ProviderType,
    MetricsSample,
    MetricsHistory,
    MetricsSummary,
    HealthResponse,
)
from .poller import start_poller, stop_poller, collect_metrics_once, _get_provider_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await start_poller()
    yield
    await stop_poller()


app = FastAPI(title="LLM Server Tracker", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/providers", response_model=list[ProviderResponse])
async def list_providers():
    db = await get_db()
    try:
        return await get_providers(db)
    finally:
        await db.close()


@app.post("/api/providers", response_model=ProviderResponse, status_code=201)
async def add_provider(provider: ProviderCreate):
    db = await get_db()
    try:
        return await create_provider(
            db,
            name=provider.name,
            type_=provider.type.value,
            host=provider.host,
            port=provider.port,
            enabled=provider.enabled,
        )
    finally:
        await db.close()


@app.put("/api/providers/{provider_id}", response_model=ProviderResponse)
async def modify_provider(provider_id: int, updates: ProviderUpdate):
    db = await get_db()
    try:
        existing = await get_provider(db, provider_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Provider not found")
        result = await update_provider(
            db,
            provider_id,
            name=updates.name,
            type_=updates.type.value if updates.type else None,
            host=updates.host,
            port=updates.port,
            enabled=updates.enabled,
        )
        return result
    finally:
        await db.close()


@app.delete("/api/providers/{provider_id}")
async def remove_provider(provider_id: int):
    db = await get_db()
    try:
        existing = await get_provider(db, provider_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Provider not found")
        await delete_provider(db, provider_id)
        return {"status": "deleted"}
    finally:
        await db.close()


@app.get("/api/metrics/latest", response_model=list[MetricsSample])
async def latest_metrics():
    db = await get_db()
    try:
        return await get_latest_metrics(db)
    finally:
        await db.close()


@app.get("/api/metrics/history/{provider_id}", response_model=list[MetricsHistory])
async def metrics_history(
    provider_id: int,
    hours: int = Query(default=24, ge=1, le=168),
    limit: int = Query(default=500, ge=1, le=5000),
):
    db = await get_db()
    try:
        return await get_metrics_history(db, provider_id, hours=hours, limit=limit)
    finally:
        await db.close()


@app.get("/api/metrics/summary/{provider_id}", response_model=MetricsSummary)
async def metrics_summary(provider_id: int):
    db = await get_db()
    try:
        result = await get_metrics_summary(db, provider_id)
        if not result:
            raise HTTPException(status_code=404, detail="No metrics found")
        return result
    finally:
        await db.close()


@app.get("/api/health/{provider_id}", response_model=HealthResponse)
async def check_provider_health(provider_id: int):
    db = await get_db()
    try:
        provider = await get_provider(db, provider_id)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
    finally:
        await db.close()

    client = _get_provider_client(provider)
    if client is None:
        raise HTTPException(status_code=400, detail="Unknown provider type")

    try:
        result = await client.check_health()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Provider unreachable: {e}")

    return HealthResponse(
        status=result.get("status", "error"),
        provider_id=provider_id,
        provider_name=provider["name"],
        details=result,
    )


@app.post("/api/collect")
async def manual_collect():
    await collect_metrics_once()
    return {"status": "collected"}


@app.post("/api/cleanup")
async def manual_cleanup(days: int = Query(default=7, ge=1, le=90)):
    db = await get_db()
    try:
        await cleanup_old_metrics(db, days=days)
    finally:
        await db.close()
    return {"status": "cleaned", "days": days}
