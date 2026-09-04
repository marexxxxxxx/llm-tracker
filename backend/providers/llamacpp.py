import httpx
from typing import Any
from .base import BaseProvider


class LlamaCppProvider(BaseProvider):
    async def fetch_metrics(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            metrics_resp = await client.get(f"{self.base_url}/metrics")
            metrics_resp.raise_for_status()
            prometheus_text = metrics_resp.text

        parsed = {}
        for line in prometheus_text.splitlines():
            result = self.parse_prometheus_line(line)
            if result is None:
                continue
            name, value, labels = result
            if name in (
                "llamacpp:predicted_tokens_seconds",
                "llamacpp:prompt_tokens_seconds",
                "llamacpp:tokens_predicted_total",
                "llamacpp:prompt_tokens_total",
                "llamacpp:requests_processing",
                "llamacpp:requests_deferred",
                "llamacpp:kv_cache_usage_ratio",
                "llamacpp:kv_cache_tokens",
            ):
                parsed[name] = value

        try:
            props_resp = await client.get(f"{self.base_url}/props")
            props_resp.raise_for_status()
            parsed["props"] = props_resp.json()
        except Exception:
            parsed["props"] = {}

        return parsed

    async def check_health(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{self.base_url}/health")
            return {
                "status": "ok" if resp.status_code == 200 else "error",
                "status_code": resp.status_code,
            }
