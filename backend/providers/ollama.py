import httpx
from typing import Any
from .base import BaseProvider


class OllamaProvider(BaseProvider):
    async def fetch_metrics(self) -> dict[str, Any]:
        data: dict[str, Any] = {}

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                ps_resp = await client.get(f"{self.base_url}/api/ps")
                ps_resp.raise_for_status()
                ps_data = ps_resp.json()
                data["running_models"] = ps_data.get("models", [])
            except Exception:
                data["running_models"] = []

            try:
                tags_resp = await client.get(f"{self.base_url}/api/tags")
                tags_resp.raise_for_status()
                tags_data = tags_resp.json()
                data["available_models"] = tags_data.get("models", [])
            except Exception:
                data["available_models"] = []

        return data

    async def check_health(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{self.base_url}/")
            return {
                "status": "ok" if resp.status_code == 200 else "error",
                "status_code": resp.status_code,
                "body": resp.text,
            }
