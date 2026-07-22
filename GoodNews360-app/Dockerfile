FROM mcr.microsoft.com/playwright/python:v1.61.0-jammy

WORKDIR /app

COPY requirements.txt .
RUN apt-get update && apt-get install -y ffmpeg xvfb && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV HEADLESS=false

CMD exec xvfb-run -a gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 1 --timeout 0 app:app
