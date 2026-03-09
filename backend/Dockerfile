FROM python:3.11-slim

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos el requirements desde la raíz (según tu estructura actual)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# COPIAMOS TODO EL CONTENIDO DE BACKEND AQUÍ
# Usamos el path relativo al repositorio
COPY backend/ .

# LISTAR ARCHIVOS (Esto es para que veas en el log si ping.py está ahí)
RUN ls -la

EXPOSE 8080

# Forzamos a que el sistema busque módulos en el directorio actual (.)
ENV PYTHONPATH=/app

# Antes decía ping:app, ahora debe decir main:app
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]