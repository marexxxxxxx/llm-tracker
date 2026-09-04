import pytest
from backend.models import (
    ProviderCreate,
    ProviderUpdate,
    ProviderType,
    ProviderResponse,
    MetricsSample,
    MetricsSummary,
    HealthResponse,
)


def test_provider_create():
    p = ProviderCreate(name="Test", type=ProviderType.sglang, host="localhost", port=30000)
    assert p.name == "Test"
    assert p.type == ProviderType.sglang
    assert p.enabled is True


def test_provider_create_minimal():
    p = ProviderCreate(name="X", type=ProviderType.ollama, port=11434)
    assert p.host == "localhost"


def test_provider_update_partial():
    u = ProviderUpdate(name="New Name")
    assert u.name == "New Name"
    assert u.port is None


def test_provider_types():
    assert ProviderType("sglang") == ProviderType.sglang
    assert ProviderType("ollama") == ProviderType.ollama
    assert ProviderType("llamacpp") == ProviderType.llamacpp


def test_provider_validation():
    with pytest.raises(Exception):
        ProviderCreate(name="", type=ProviderType.sglang, port=30000)
    with pytest.raises(Exception):
        ProviderCreate(name="X", type=ProviderType.sglang, port=0)
    with pytest.raises(Exception):
        ProviderCreate(name="X", type=ProviderType.sglang, port=70000)
