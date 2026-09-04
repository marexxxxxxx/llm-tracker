import asyncio
import logging
from typing import Optional

from .database import get_db, get_providers, insert_metrics
from .providers.sglang import SGLangProvider
from .providers.ollama import OllamaProvider
from .providers.llamacpp import LlamaCppProvider

logger = logging.getLogger(__name__)

POLL_INTERVAL = 3

_provider_classes = {
    "sglang": SGLangProvider,
    "ollama": OllamaProvider,
    "llamacpp": LlamaCppProvider,
}

_poll_task: Optional[asyncio.Task] = None
_stop_event = asyncio.Event()


def _get_provider_client(provider: dict):
    cls = _provider_classes.get(provider["type"])
    if cls is None:
        return None
    return cls(host=provider["host"], port=provider["port"])


async def collect_metrics_once():
    db = await get_db()
    try:
        providers = await get_providers(db)
        for p in providers:
            if not p["enabled"]:
                continue
            client = _get_provider_client(p)
            if client is None:
                continue
            try:
                metrics = await client.fetch_metrics()
                await insert_metrics(db, p["id"], metrics)
                logger.info(f"Collected metrics for {p['name']} ({p['type']})")
            except Exception as e:
                logger.warning(f"Failed to collect metrics for {p['name']}: {e}")
    finally:
        await db.close()


async def _poll_loop():
    while not _stop_event.is_set():
        try:
            await collect_metrics_once()
        except Exception as e:
            logger.error(f"Poll loop error: {e}")
        try:
            await asyncio.wait_for(_stop_event.wait(), timeout=POLL_INTERVAL)
            break
        except asyncio.TimeoutError:
            pass


async def start_poller():
    global _poll_task
    _stop_event.clear()
    _poll_task = asyncio.create_task(_poll_loop())
    logger.info("Poller started")


async def stop_poller():
    global _poll_task
    _stop_event.set()
    if _poll_task is not None:
        _poll_task.cancel()
        try:
            await _poll_task
        except asyncio.CancelledError:
            pass
        _poll_task = None
    logger.info("Poller stopped")
