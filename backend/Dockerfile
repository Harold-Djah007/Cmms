FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/requirements.txt ./backend/requirements.txt
COPY backend/requirements.lock ./backend/requirements.lock
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend ./backend
COPY dist ./dist
RUN useradd --create-home --uid 10001 safimaint && mkdir -p /app/data && chown -R safimaint:safimaint /app/data
USER safimaint
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD python -c "import urllib.request; from backend.app.config import settings; urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8000/api/ready', headers={'Host': settings.allowed_hosts[0]}), timeout=4)"
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--limit-concurrency", "16", "--timeout-keep-alive", "5"]

