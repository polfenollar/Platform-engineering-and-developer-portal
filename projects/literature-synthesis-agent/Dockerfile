FROM python:3.11-slim AS base
WORKDIR /app

# Install uv
RUN pip install uv==0.1.45 --no-cache-dir

# Install dependencies (layer-cached)
COPY pyproject.toml .
RUN uv pip install --system --no-cache .

# Copy source
COPY src/ src/

# Non-root user
RUN adduser --disabled-password --gecos "" appuser
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import httpx; httpx.get('http://localhost:8080/health').raise_for_status()"

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]
