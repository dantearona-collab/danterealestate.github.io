FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema para pandas
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Actualizar pip primero
RUN pip install --upgrade pip setuptools wheel

# Instalar numpy PRIMERO (antes de pandas)
RUN pip install numpy==1.24.3

# Copiar requirements e instalar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Puerto de Render
CMD gunicorn --bind 0.0.0.0:10000 servidor_excel:app