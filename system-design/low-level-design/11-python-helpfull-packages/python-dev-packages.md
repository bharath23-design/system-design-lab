# Python Important Packages for Developers

A curated reference of must-know Python tools and packages — from project setup to production.

---

## Project & Environment Management

### `uv` — The Modern All-in-One Tool
Replaces `pip`, `virtualenv`, `pip-tools`, `pyenv`. Written in Rust — 10-100x faster.

```bash
uv init my-project        # scaffold new project
uv python pin 3.12        # pin Python version → .python-version
uv add fastapi            # add runtime dependency
uv add --dev pytest ruff  # add dev dependencies
uv sync --all-groups      # install everything into .venv
uv run pytest             # run inside .venv (no manual activation)
uvx ruff check .          # run a tool without installing it
```

### `pyenv`
Manage multiple Python versions on one machine.

```bash
pyenv install 3.12.3
pyenv global 3.12.3
pyenv local 3.11.0        # project-level override
```

### `pipx`
Install Python CLI tools in isolated environments (global tools only).

```bash
pipx install ruff
pipx install black
pipx run httpie           # one-off run without installing
```

---

## Code Quality

### `ruff` — Linter + Formatter
Replaces `flake8`, `isort`, `pyupgrade`, and partially `pylint`. Extremely fast.

```bash
ruff check .              # lint
ruff check . --fix        # auto-fix fixable issues
ruff format .             # format (replaces black)
```

```toml
# pyproject.toml
[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]   # errors, pyflakes, isort, upgrades, bugbear
```

### `mypy` — Static Type Checker
Catches type errors before runtime.

```bash
mypy src/
mypy --strict src/        # full strict mode
```

```toml
[tool.mypy]
python_version = "3.12"
strict = true
```

### `black` — Opinionated Formatter
Zero-config formatter. If you use `ruff format`, you don't need this.

```bash
black .
black --check .           # CI: fail if unformatted
```

### `pre-commit` — Git Hook Manager
Run linters/formatters automatically before every commit.

```bash
pre-commit install        # set up hooks
pre-commit run --all-files
```

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.0
    hooks:
      - id: ruff
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
```

---

## Testing

### `pytest` — The Standard Test Framework

```bash
pytest                    # run all tests
pytest -v                 # verbose
pytest -k "test_login"    # filter by name
pytest --cov=src          # with coverage
```

```python
# conftest.py — shared fixtures
import pytest

@pytest.fixture
def client():
    from myapp import app
    return TestClient(app)
```

### `pytest-cov` — Coverage Reports

```bash
pytest --cov=src --cov-report=html
```

### `pytest-asyncio` — Async Test Support

```python
@pytest.mark.asyncio
async def test_fetch():
    result = await fetch_data()
    assert result is not None
```

### `factory-boy` — Test Data Factories
Build complex test objects without repetitive setup.

```python
class UserFactory(factory.Factory):
    class Meta:
        model = User
    name = factory.Faker("name")
    email = factory.Faker("email")

user = UserFactory()
```

### `Faker` — Fake Data Generator

```python
from faker import Faker
fake = Faker()
fake.name()        # "John Smith"
fake.email()       # "john@example.com"
fake.address()
```

---

## Web Frameworks

### `FastAPI` — High-performance async API framework
Auto-generates OpenAPI docs. Type-safe via Pydantic.

```python
from fastapi import FastAPI
app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(user_id: int) -> dict:
    return {"id": user_id}
```

```bash
uv add fastapi uvicorn[standard]
uvicorn main:app --reload
```

### `Flask` — Minimal, flexible web framework

```python
from flask import Flask, jsonify
app = Flask(__name__)

@app.route("/health")
def health():
    return jsonify(status="ok")
```

### `Django` — Full-featured batteries-included framework
Best for monoliths: ORM, admin, auth, migrations built in.

```bash
uv add django
django-admin startproject mysite
python manage.py runserver
```

---

## HTTP Clients

### `httpx` — Modern async-first HTTP client
Replaces `requests` for async code. Same API surface.

```python
import httpx

# Sync
resp = httpx.get("https://api.example.com/data")

# Async
async with httpx.AsyncClient() as client:
    resp = await client.get("https://api.example.com/data")
```

### `requests` — Simple sync HTTP client
The classic. Use `httpx` for async, `requests` for simple scripts.

```python
import requests
resp = requests.get("https://api.example.com", timeout=10)
data = resp.json()
```

---

## Data Validation & Settings

### `pydantic` — Data validation using Python type hints

```python
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    name: str
    email: EmailStr
    age: int

user = User(name="Alice", email="alice@example.com", age=30)
```

### `pydantic-settings` — Settings from env vars / `.env`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    api_key: str
    debug: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Database

### `SQLAlchemy` — The Python SQL toolkit & ORM

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
```

### `alembic` — Database migrations for SQLAlchemy

```bash
alembic init alembic
alembic revision --autogenerate -m "add users table"
alembic upgrade head
```

### `tortoise-orm` — Async ORM (Django-style for async apps)

```python
from tortoise.models import Model
from tortoise import fields

class User(Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=100)
```

### `redis-py` — Redis client

```python
import redis
r = redis.Redis(host="localhost", port=6379, decode_responses=True)
r.set("key", "value")
r.get("key")
```

---

## Async & Concurrency

### `asyncio` — Built-in async I/O (stdlib)

```python
import asyncio

async def main():
    await asyncio.sleep(1)
    print("done")

asyncio.run(main())
```

### `anyio` — Async library compatibility layer
Write async code that works with both `asyncio` and `trio`.

```python
import anyio

async def main():
    async with anyio.create_task_group() as tg:
        tg.start_soon(task_one)
        tg.start_soon(task_two)
```

### `celery` — Distributed task queue

```python
from celery import Celery
app = Celery("tasks", broker="redis://localhost:6379/0")

@app.task
def send_email(user_id: int):
    ...
```

---

## CLI Tools

### `typer` — Build CLIs with type hints (FastAPI-style)

```python
import typer
app = typer.Typer()

@app.command()
def deploy(env: str, dry_run: bool = False):
    typer.echo(f"Deploying to {env}")

if __name__ == "__main__":
    app()
```

### `rich` — Beautiful terminal output

```python
from rich import print
from rich.table import Table
from rich.progress import track

print("[bold green]Success![/bold green]")

for item in track(items, description="Processing..."):
    process(item)
```

### `click` — Composable CLI framework (battle-tested)

```python
import click

@click.command()
@click.option("--count", default=1)
@click.argument("name")
def greet(count, name):
    for _ in range(count):
        click.echo(f"Hello, {name}!")
```

---

## Logging & Observability

### `loguru` — Drop-in logging replacement, zero config

```python
from loguru import logger

logger.info("Server started on port {port}", port=8000)
logger.error("Unexpected error: {err}", err=e)

# Log to file with rotation
logger.add("app.log", rotation="10 MB", retention="7 days")
```

### `structlog` — Structured logging (JSON output for prod)

```python
import structlog
log = structlog.get_logger()

log.info("user.login", user_id=42, ip="1.2.3.4")
# → {"event": "user.login", "user_id": 42, "ip": "1.2.3.4"}
```

### `sentry-sdk` — Error tracking

```python
import sentry_sdk
sentry_sdk.init(dsn="https://...", traces_sample_rate=1.0)
```

---

## Utilities

### `python-dotenv` — Load `.env` files

```python
from dotenv import load_dotenv
import os

load_dotenv()
db_url = os.getenv("DATABASE_URL")
```

### `tenacity` — Retry logic with backoff

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def call_api():
    ...
```

### `orjson` — Fast JSON serialization (2-10x faster than stdlib)

```python
import orjson

data = orjson.dumps({"key": "value"})   # bytes
obj = orjson.loads(data)
```

### `pendulum` — Better datetime handling

```python
import pendulum

now = pendulum.now("UTC")
tomorrow = now.add(days=1)
diff = now.diff_for_humans()     # "2 hours ago"
```

---

## Data & ML (Bonus)

| Package | Purpose |
|---|---|
| `pandas` | DataFrame manipulation, CSV/Excel/SQL |
| `polars` | Faster pandas alternative (Rust-based) |
| `numpy` | Numerical arrays, linear algebra |
| `matplotlib` / `seaborn` | Plotting and visualization |
| `scikit-learn` | Classical ML algorithms |
| `torch` | Deep learning (PyTorch) |
| `jupyter` | Interactive notebooks |

---

## Quick Reference — Dev Stack

```bash
# Minimal API project
uv init my-api && cd my-api
uv python pin 3.12
uv add fastapi uvicorn[standard] pydantic pydantic-settings httpx
uv add --dev pytest pytest-asyncio pytest-cov ruff mypy pre-commit

# Minimal CLI project
uv init my-cli && cd my-cli
uv python pin 3.12
uv add typer rich
uv add --dev pytest ruff mypy

# Full web app
uv init my-app && cd my-app
uv add django djangorestframework celery redis
uv add --dev pytest pytest-django ruff mypy factory-boy
```

---

## Package Selection Guide

| Need | Use |
|---|---|
| Project + env management | `uv` |
| Linting + formatting | `ruff` |
| Type checking | `mypy` |
| Testing | `pytest` + `pytest-cov` |
| Async HTTP client | `httpx` |
| Data validation | `pydantic` |
| Settings from env | `pydantic-settings` |
| CLI app | `typer` + `rich` |
| Structured logging | `loguru` (dev) / `structlog` (prod) |
| Task queue | `celery` + `redis` |
| Retries | `tenacity` |
| Fast JSON | `orjson` |
