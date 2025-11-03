# Backend (Django) Dockerfile
# Build a slim Python image for the Django backend and run with gunicorn

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (git for some pip installs, and build tools for some wheels)
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first for better layer caching
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r /app/requirements.txt \
    && pip install gunicorn

# Copy the rest of the application code
COPY . /app

# Expose gunicorn port
EXPOSE 8000

# Default command: run Django via gunicorn
# NOTE: The Django project appears to be `group_8958` based on wsgi.py location
CMD ["gunicorn", "group_8958.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
