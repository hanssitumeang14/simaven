.PHONY: install dev test lint fmt migrate revision

install:
	uv sync --extra dev

dev:
	PYTHONPATH=src uv run uvicorn app.main:app --reload --port 8000

test:
	uv run pytest

lint:
	uv run ruff check src tests && uv run mypy src

fmt:
	uv run ruff format src tests && uv run ruff check --fix src tests

migrate:
	uv run alembic upgrade head

revision:
	uv run alembic revision --autogenerate -m "$(m)"
