from abc import ABC, abstractmethod
from typing import Any


def _normalize_host(host: str) -> tuple[str, str]:
    """Split a host value into (scheme, bare_host).

    Accepts bare hosts ('192.168.1.24', 'localhost') or hosts that already
    include a scheme ('http://192.168.1.24', 'https://example.com').
    """
    host = (host or "").strip()
    scheme = "http"
    if "://" in host:
        scheme, host = host.split("://", 1)
        scheme = scheme.lower()
        if scheme not in ("http", "https"):
            scheme = "http"
    if not host:
        raise ValueError("host must not be empty")
    return scheme, host


class BaseProvider(ABC):
    def __init__(self, host: str, port: int):
        self._scheme, self.host = _normalize_host(host)
        self.port = port
        self.base_url = f"{self._scheme}://{self.host}:{port}"

    @abstractmethod
    async def fetch_metrics(self) -> dict[str, Any]:
        pass

    @abstractmethod
    async def check_health(self) -> dict[str, Any]:
        pass

    def parse_prometheus_line(self, line: str) -> tuple[str, float, dict[str, str]] | None:
        """Parse a single Prometheus text format line.

        Returns (metric_name, value, labels) or None if not parseable.
        """
        line = line.strip()
        if not line or line.startswith("#"):
            return None

        try:
            if "{" in line:
                name_part, value_part = line.split("{", 1)
                labels_part, value_str = value_part.rsplit("}", 1)
                value = float(value_str.strip())
                name = name_part.strip()
                labels = {}
                if labels_part.strip():
                    for pair in labels_part.split(","):
                        pair = pair.strip()
                        if "=" in pair:
                            k, v = pair.split("=", 1)
                            labels[k.strip()] = v.strip().strip('"')
                return name, value, labels
            else:
                parts = line.split()
                if len(parts) == 2:
                    name = parts[0].strip()
                    value = float(parts[1].strip())
                    return name, value, {}
        except (ValueError, IndexError):
            pass
        return None
