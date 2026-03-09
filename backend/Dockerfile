FROM python:3.11-slim

WORKDIR /app

# Al estar en el Root Directory 'backend', Docker busca el archivo en la misma carpeta
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# ... resto del archivo

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalamos las dependencias del sistema necesarias para algunas librerías de Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiamos solo el requirements primero (optimiza la caché de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos todo el contenido de la carpeta backend al contenedor
COPY . .

# Exponemos el puerto (8080 es el que configuramos en tu FastAPI)
EXPOSE 8080

# Comando final: Railway inyectará la variable $PORT automáticamente
CMD ["sh", "-c", "uvicorn ping:app --host 0.0.0.0 --port ${PORT:-8080}"]