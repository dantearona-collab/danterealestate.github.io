FROM python:3.11-slim

WORKDIR /app

# Copiar requirements del backend
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copiar todo el proyecto
COPY . .

# Ejecutar desde la carpeta backend
CMD ["uvicorn", "backend.main-ai:app", "--host", "0.0.0.0", "--port", "8080"]
