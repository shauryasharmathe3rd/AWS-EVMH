FROM python:3.11-slim

WORKDIR /app

# Install system and geospatial libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    gcc \
    g++ \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user
RUN useradd -m -u 1000 workeruser && \
    mkdir -p /app/data /app/models /app/data/cache && \
    chown -R workeruser:workeruser /app

USER workeruser

COPY --chown=workeruser:workeruser . .

ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import os; exit(0 if os.path.exists('/tmp/worker_healthy') else 1)"

CMD ["python", "main.py"]
