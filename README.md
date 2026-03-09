# 🚀 AI Resume Analyzer (ATS-Optimization Tool)

Este proyecto es un analizador de currículums profesional que utiliza **Inteligencia Artificial** (Llama 3 via Groq) para auditar CVs, calcular una puntuación de compatibilidad ATS y ofrecer consejos tácticos de mejora.

![Dashboard Preview](https://via.placeholder.com/800x400?text=AI+Resume+Analyzer+Interface) ## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, TypeScript.
- **Backend:** FastAPI (Python 3.14), Uvicorn.
- **IA:** LangChain + Groq API (Llama-3.1-8b-instant).
- **Procesamiento de Archivos:** PyPDF para extracción de texto estructurado.

## 🏗️ Arquitectura del Sistema

El flujo de datos sigue un modelo de microservicios locales:
1. El usuario sube un PDF desde el **Frontend (Next.js)**.
2. El archivo se envía vía `multipart/form-data` a una **API REST (FastAPI)**.
3. El Backend extrae el texto y lo procesa mediante un pipeline de **LangChain**.
4. Se ejecuta un **Prompt Engineering** de nivel Senior para obtener una respuesta JSON estructurada.
5. Los resultados se visualizan de forma dinámica con **Tailwind CSS**.



## 🧠 Desafíos Técnicos y Soluciones

Durante el desarrollo, se resolvieron problemas críticos de infraestructura:

- **Conflicto de Red en macOS:** Se detectaron bloqueos en el puerto `8000` (común en macOS Sequoia/Sonoma). Se implementó un cambio estratégico al puerto `8080` y se forzó el binding a `127.0.0.1` para evitar latencias de resolución DNS.
- **Compatibilidad con Python 3.14:** Se gestionaron warnings de deprecación de `Pydantic V1` ajustando las importaciones de `langchain-core`, asegurando que el sistema sea *future-proof*.
- **Optimización de Costes/Latencia:** Se implementó el modelo `8b-instant` de Groq para obtener tiempos de respuesta < 2s, manteniendo una precisión de análisis de nivel CTO.
- **Robustez de Datos:** Implementación de lógica de limpieza de JSON mediante punteros (`find('{')`) para manejar respuestas de LLMs con ruido de texto.

## 🚀 Instalación y Uso

### 1. Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # En Mac/Linux
pip install -r requirements.txt
python3 ping.py
