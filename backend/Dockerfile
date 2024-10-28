FROM python:3.12-bullseye
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
ENV PYTHONUNBUFFERED=1
WORKDIR /backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock /backend/
RUN uv sync --frozen


COPY . /backend/

ENV PATH="/backend/.venv/bin:$PATH"

RUN chown -R root:root /backend
RUN chmod +x docker-entrypoint.sh
RUN chmod +x wait-for-it.sh

EXPOSE 8001
