# syntax=docker/dockerfile:1
ARG PYTHON_VERSION=3.11.6
FROM python:${PYTHON_VERSION}-slim

# Disable Python bytecode and buffering
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create non-root user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/home/appuser" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

USER appuser

# Setup cache directory and permissions
RUN mkdir -p /home/appuser/.cache
RUN chown -R appuser /home/appuser/.cache

WORKDIR /home/appuser

# Copy and install requirements
COPY requirements.txt .
RUN python -m pip install --user --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Pre-download any needed files (e.g., models)
RUN python main.py download-files

# Expose the port (Cloud Run uses $PORT)
EXPOSE 5001

# Run Gunicorn for Flask app and background task from main.py
ENTRYPOINT ["bash", "-c"]
CMD ["python main.py dev & ~/.local/bin/gunicorn --bind 0.0.0.0:5001 api_server:app"]