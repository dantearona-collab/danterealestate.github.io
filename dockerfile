FROM python:3.11-slim

WORKDIR /app

# Copiar requirements del backend
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Copiar todo el proyecto
COPY . .

# Ejecutar FastAPI
CMD ["uvicorn", "backend.main_ai:app", "--host", "0.0.0.0", "--port", "10000"]