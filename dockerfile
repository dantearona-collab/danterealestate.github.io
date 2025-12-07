FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Puerto que Render usa automáticamente
ENV PORT=5000

# Comando corregido
CMD gunicorn --bind 0.0.0.0:$PORT servidor_excel:app