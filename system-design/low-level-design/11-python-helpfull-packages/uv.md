# uv — Python Package & Project Manager

`uv` is an extremely fast Python package and project manager written in Rust, developed by Astral (the team behind `ruff`). It replaces `pip`, `pip-tools`, `virtualenv`, `pyenv`, and `poetry` with a single unified tool.

---

## Installation

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# Via pip (not recommended — defeats the purpose)
pip install uv
```

Verify installation:

```bash
uv --version
```

---

## Project Initialization

### `uv init` — Create a new project

```bash
# Create a new project in the current directory
uv init

# Create a new project in a named directory
uv init my-project
cd my-project
```

This generates:

```
my-project/
├── .python-version      # pins the Python version (e.g. 3.12)
├── pyproject.toml       # project metadata & dependencies
├── README.md
└── hello.py             # starter script
```

**`pyproject.toml` after `uv init`:**

```toml
[project]
name = "my-project"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.12"
dependencies = []
```

### Initialize as a library (package with `src/` layout)

```bash
uv init --lib my-lib
```

### Initialize as an app

```bash
uv init --app my-app
```

---

## Virtual Environment

### `uv venv` — Create `.venv`

```bash
# Create .venv using the pinned Python version
uv venv

# Use a specific Python version
uv venv --python 3.11

# Custom location
uv venv .venv-dev
```

Activate:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

> `uv sync` and `uv run` auto-create and use `.venv` — you rarely need to activate manually.

---

## Dependency Management

### `uv add` — Add dependencies

```bash
# Add a runtime dependency
uv add requests
uv add fastapi uvicorn[standard]

# Add with version constraint
uv add "django>=4.2,<5"

# Add a dev/optional dependency group
uv add --dev pytest ruff mypy

# Add a specific group
uv add --group lint ruff pylint
```

This updates `pyproject.toml` and regenerates `uv.lock`.

### `uv remove` — Remove dependencies

```bash
uv remove requests
uv remove --dev pytest
```

### `uv sync` — Install all dependencies into `.venv`

```bash
# Install all dependencies (creates .venv if missing)
uv sync

# Include dev dependencies (included by default)
uv sync --all-groups

# Sync only production deps (exclude dev)
uv sync --no-dev

# Sync a specific group only
uv sync --group lint
```

`uv sync` reads `uv.lock` for reproducible installs — equivalent to `pip install -r requirements.txt` but deterministic and much faster.

---

## Lock File

```bash
# Generate / update uv.lock without installing
uv lock

# Check if lockfile is up to date (CI use)
uv lock --check
```

Commit `uv.lock` to version control for reproducible environments across machines.

---

## Running Code

### `uv run` — Run scripts inside the project environment

```bash
# Run a Python script
uv run hello.py

# Run a module
uv run -m pytest

# Run an installed tool
uv run ruff check .
uv run mypy src/
```

`uv run` automatically syncs the environment before executing, so it is always up to date.

---

## Python Version Management

```bash
# Install a specific Python version
uv python install 3.12

# List available Python versions
uv python list

# Pin the project to a Python version (writes .python-version)
uv python pin 3.12
```

---

## Tool Management (Global CLI Tools)

```bash
# Install a CLI tool globally (isolated environment)
uv tool install ruff
uv tool install black
uv tool install httpie

# Run a tool without installing permanently
uvx ruff check .
uvx black .

# List installed tools
uv tool list

# Upgrade a tool
uv tool upgrade ruff
```

---

## Development Toolkit Setup

### Recommended `pyproject.toml` for a typical project

```toml
[project]
name = "my-project"
version = "0.1.0"
description = "My Python project"
readme = "README.md"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "httpx>=0.27",
    "pydantic>=2.7",
]

[dependency-groups]
dev = [
    "pytest>=8",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5",
    "ruff>=0.4",
    "mypy>=1.10",
    "ipython>=8",
    "pre-commit>=3",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]

[tool.mypy]
python_version = "3.12"
strict = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

Install everything:

```bash
uv sync --all-groups
```

---

## Common Workflow

```bash
# 1. Start a new project
uv init my-project && cd my-project

# 2. Pin Python version
uv python pin 3.12

# 3. Add runtime dependencies
uv add fastapi uvicorn pydantic

# 4. Add dev dependencies
uv add --dev pytest ruff mypy

# 5. Install all deps into .venv
uv sync --all-groups

# 6. Run tests
uv run pytest

# 7. Lint & format
uv run ruff check . --fix
uv run ruff format .

# 8. Type check
uv run mypy src/
```

---

## Cheat Sheet

| Command | Description |
|---|---|
| `uv init` | Create a new project |
| `uv venv` | Create `.venv` |
| `uv add <pkg>` | Add runtime dependency |
| `uv add --dev <pkg>` | Add dev dependency |
| `uv remove <pkg>` | Remove dependency |
| `uv sync` | Install all deps from lockfile |
| `uv sync --all-groups` | Install including all dev groups |
| `uv lock` | Regenerate `uv.lock` |
| `uv run <cmd>` | Run command inside project env |
| `uv python install 3.12` | Install Python version |
| `uv python pin 3.12` | Pin project Python version |
| `uvx <tool>` | Run a tool without installing |
| `uv tool install <tool>` | Install a global CLI tool |

---

## Why uv?

- **10-100x faster** than `pip` — written in Rust
- **Single tool** replaces `pip` + `virtualenv` + `pip-tools` + `pyenv`
- **Deterministic** installs via `uv.lock`
- **No need to activate** `.venv` when using `uv run`
- **Compatible** with standard `pyproject.toml` (PEP 517/518/621)
