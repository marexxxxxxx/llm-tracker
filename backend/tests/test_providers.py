import pytest
from backend.providers.base import BaseProvider, _normalize_host


def test_parse_prometheus_line_simple():
    class Dummy(BaseProvider):
        async def fetch_metrics(self): return {}
        async def check_health(self): return {}

    p = Dummy("localhost", 8000)
    result = p.parse_prometheus_line('my_metric 1.5')
    assert result is not None
    name, value, labels = result
    assert name == "my_metric"
    assert value == 1.5
    assert labels == {}


def test_parse_prometheus_line_with_labels():
    class Dummy(BaseProvider):
        async def fetch_metrics(self): return {}
        async def check_health(self): return {}

    p = Dummy("localhost", 8000)
    result = p.parse_prometheus_line('my_metric{model_name="test"} 42')
    assert result is not None
    name, value, labels = result
    assert name == "my_metric"
    assert value == 42.0
    assert labels["model_name"] == "test"


def test_parse_prometheus_line_comment():
    class Dummy(BaseProvider):
        async def fetch_metrics(self): return {}
        async def check_health(self): return {}

    p = Dummy("localhost", 8000)
    assert p.parse_prometheus_line("# HELP my_metric help text") is None
    assert p.parse_prometheus_line("") is None


def test_parse_prometheus_line_invalid():
    class Dummy(BaseProvider):
        async def fetch_metrics(self): return {}
        async def check_health(self): return {}

    p = Dummy("localhost", 8000)
    assert p.parse_prometheus_line("not_valid") is None


def test_normalize_host_bare():
    assert _normalize_host("192.168.1.24") == ("http", "192.168.1.24")


def test_normalize_host_with_scheme():
    assert _normalize_host("http://192.168.1.24") == ("http", "192.168.1.24")


def test_normalize_host_https():
    assert _normalize_host("https://localhost") == ("https", "localhost")


def test_normalize_host_whitespace():
    assert _normalize_host("  localhost  ") == ("http", "localhost")


def test_normalize_host_invalid_scheme_falls_back_to_http():
    assert _normalize_host("ftp://example.com") == ("http", "example.com")


def test_normalize_host_empty_raises():
    with pytest.raises(ValueError):
        _normalize_host("")


def test_base_url_builds_correctly_with_scheme_host():
    class Dummy(BaseProvider):
        async def fetch_metrics(self): return {}
        async def check_health(self): return {}

    p = Dummy("http://192.168.1.24", 30000)
    assert p.base_url == "http://192.168.1.24:30000"

    p2 = Dummy("192.168.1.24", 30000)
    assert p2.base_url == "http://192.168.1.24:30000"
