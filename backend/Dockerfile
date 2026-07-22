FROM python:3.12-slim

# WeasyPrint butuh Pango/Cairo. Ini penyebab error paling umum saat naik ke prod.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libpango-1.0-0 \
      libpangoft2-1.0-0 \
      libcairo2 \
      libgdk-pixbuf-2.0-0 \
      libffi-dev \
      shared-mime-info \
      fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app
ENV PYTHONPATH=/app/src \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1

COPY pyproject.toml ./
RUN uv pip install --system --no-cache -r pyproject.toml

COPY src ./src
COPY migrations ./migrations
COPY alembic.ini ./

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
