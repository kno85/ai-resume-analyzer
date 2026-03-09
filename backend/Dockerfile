FROM python:3.11-slim

WORKDIR /app

# 1. Copiamos el requirements que ahora está en la raíz
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. Copiamos TODO el contenido de la carpeta backend al directorio actual (/app)
# Nota: El punto al final indica "aquí"
COPY backend/ .

# 3. Exponemos el puerto
EXPOSE 8080

# 4. Comando de arranque
# Al copiar "backend/ ." arriba, el archivo ping.py ahora está en la raíz de /app
CMD ["sh", "-c", "uvicorn ping:app --host 0.0.0.0 --port ${PORT:-8080}"]