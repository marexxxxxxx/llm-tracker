import httpx
from typing import Any
from .base import BaseProvider


class SGLangProvider(BaseProvider):
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
                "sglang:gen_throughput",
                "sglang:num_running_reqs",
                "sglang:num_queue_reqs",
                "sglang:token_usage",
                "sglang:generation_tokens_total",
                "sglang:num_requests_total",
                "sglang:cache_hit_rate",
                "sglang:num_used_tokens",
                "sglang:kv_available_tokens",
            ):
                parsed[name] = value

        try:
            info_resp = await client.get(f"{self.base_url}/get_model_info")
            info_resp.raise_for_status()
            parsed["model_info"] = info_resp.json()
        except Exception:
            parsed["model_info"] = {}

        return parsed

    async def check_health(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{self.base_url}/health")
            return {
                "status": "ok" if resp.status_code == 200 else "error",
                "status_code": resp.status_code,
            }
