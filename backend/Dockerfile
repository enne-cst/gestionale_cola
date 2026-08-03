# Il contesto di build e' la radice del repository (vedi docker-compose.yml),
# cosi' questa immagine puo' includere anche database_struttura/ che Alembic
# legge per applicare la baseline schema (vedi alembic/versions/0001_*.py).

FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY database_struttura/ /app/database_struttura/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
