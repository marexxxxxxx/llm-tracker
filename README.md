# LLM Server Tracker

Web dashboard for monitoring LLM inference servers (SGLang, Ollama, llama.cpp) with real-time metrics, historical charts, and provider management.

## Architecture

- **Backend**: FastAPI (Python) — polls provider metrics endpoints, stores time-series data in SQLite, exposes a REST API
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Recharts

## Backend Setup

```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn main:app --port 8000
```

The backend runs a background poller that queries every enabled provider every 3 seconds and stores the metrics in SQLite.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:8000`.

## Provider Configuration

| Provider | Default Port | Metrics Source |
|----------|-------------|----------------|
| SGLang | 30000 | `/metrics` (Prometheus, requires `--enable-metrics`) |
| Ollama | 11434 | `/api/ps` (REST, no native metrics endpoint) |
| llama.cpp | 8080 | `/metrics` (Prometheus, requires `--metrics`) |

Add providers in the **Providers** tab of the dashboard.

## Tests

```bash
cd backend
PYTHONPATH=backend .venv/bin/python -m pytest tests/ -v
```
