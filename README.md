# LLM Server Tracker

Web dashboard for monitoring LLM inference servers (SGLang, Ollama, llama.cpp) with real-time metrics, historical charts, and provider management.

## Architecture

- **Backend**: FastAPI (Python) — polls provider metrics endpoints, stores time-series data in SQLite, exposes a REST API
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Recharts
- **DB**: SQLite, stored on a dedicated Docker volume

## Run with Docker Compose

```bash
docker compose up -d --build
```

| Service   | URL            |
|-----------|----------------|
| Frontend  | http://localhost:8081 |
| Backend (API) | http://localhost:8000 |

- **Frontend** serves the static build via nginx and proxies `/api` to the backend.
- **Backend** connects to the SQLite database stored on the `db-data` named volume.
- **db** container holds the SQLite file (`tracker.db`) on the same `db-data` volume, keeping the data persistent across container restarts.

Stop and remove containers (keep data):

```bash
docker compose down
```

Remove containers **and** the database:

```bash
docker compose down -v
```

## Run without Docker (local dev)

### Backend Setup

```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
uvicorn main:app --port 8000
```

> Note: when running locally (without Docker), the default database path is `./tracker.db` in the backend directory.

The backend runs a background poller that queries every enabled provider every 3 seconds and stores the metrics in SQLite.

### Frontend Setup

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
