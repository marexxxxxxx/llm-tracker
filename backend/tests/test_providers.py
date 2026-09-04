import pytest
from backend.providers.base import BaseProvider


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
