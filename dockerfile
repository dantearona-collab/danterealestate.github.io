FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias desde la raíz del proyecto
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copiar todo el proyecto
COPY . .

# Ejecutar FastAPI desde la raíz del repo
CMD ["uvicorn", "backend.main_ai:app", "--host", "0.0.0.0", "--port", "10000"]