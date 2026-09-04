from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ProviderType(str, Enum):
    sglang = "sglang"
    ollama = "ollama"
    llamacpp = "llamacpp"


class ProviderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: ProviderType
    host: str = Field(default="localhost", max_length=255)
    port: int = Field(..., ge=1, le=65535)
    enabled: bool = True


class ProviderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[ProviderType] = None
    host: Optional[str] = Field(None, max_length=255)
    port: Optional[int] = Field(None, ge=1, le=65535)
    enabled: Optional[bool] = None


class ProviderResponse(BaseModel):
    id: int
    name: str
    type: ProviderType
    host: str
    port: int
    enabled: bool
    created_at: str
    updated_at: str


class MetricsSample(BaseModel):
    id: int
    provider_id: int
    timestamp: str
    data: dict
    name: Optional[str] = None
    type: Optional[ProviderType] = None


class MetricsHistory(BaseModel):
    id: int
    provider_id: int
    timestamp: str
    data: dict


class MetricsSummary(BaseModel):
    sample_count: int
    first_sample: Optional[str]
    last_sample: Optional[str]


class HealthResponse(BaseModel):
    status: str
    provider_id: int
    provider_name: str
    details: Optional[dict] = None


class ErrorResponse(BaseModel):
    detail: str
