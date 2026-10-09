import os
import time
import json
import urllib.request
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Cargamos las variables de entorno (.env)
load_dotenv()

def get_available_groq_models(api_key: str):
    """
    Consulta la API oficial de Groq para obtener los modelos accesibles por esta API Key.
    """
    if not api_key:
        return []
    try:
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            return [m["id"] for m in data.get("data", [])]
    except Exception as e:
        print(f"⚠️ No se pudo listar modelos desde Groq API: {e}")
        return []

def get_candidate_models(api_key: str):
    """
    Devuelve la lista ordenada de modelos candidatos a probar.
    """
    candidates = []
    
    # 1. Modelo preferido configurado por variable de entorno
    env_model = os.getenv("GROQ_MODEL")
    if env_model:
        candidates.append(env_model.strip())
        
    # 2. Modelos reales disponibles consultados en la API de Groq
    available = get_available_groq_models(api_key)
    
    # Priorizamos modelos de generación de texto conocidos
    priority_models = [
        "openai/gpt-oss-20b",
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
    ]
    for p in priority_models:
        if p in available and p not in candidates:
            candidates.append(p)
            
    # Añadimos cualquier otro modelo de chat que no sea de audio o filtro
    for m in available:
        if not m.startswith("whisper") and "guard" not in m and m not in candidates:
            candidates.append(m)
            
    # Fallbacks generales si la API de modelos no respondió
    defaults = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"]
    for d in defaults:
        if d not in candidates:
            candidates.append(d)
            
    return candidates

def get_resume_analysis(resume_text: str):
    """
    Envía el texto del CV a Groq probando los modelos disponibles y devuelve (contenido, error).
    Auto-recuperable ante errores 404 (model_not_found) o 429 (rate limits).
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None, "GROQ_API_KEY no está configurada en el servidor."

    # Definimos el Prompt con Ingeniería de Roles (Fase 1)
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Eres un Reclutador Técnico Senior y Experto en ATS (Applicant Tracking Systems). 
        Tu misión es analizar el CV proporcionado y dar un feedback brutalmente honesto y profesional.
        
        Debes evaluar:
        1. Impacto de los logros (¿Usa métricas?).
        2. Stack tecnológico (¿Es moderno?).
        3. Formato y legibilidad.

        RESPONDE SIEMPRE EN EL SIGUIENTE FORMATO JSON:
        {{
            "score": (un número de 0 a 100 basado en la calidad profesional),
            "summary": "Un resumen de 2 frases sobre el perfil.",
            "missing_skills": ["Habilidad 1", "Habilidad 2", "Habilidad 3"],
            "advice": ["Consejo práctico 1", "Consejo práctico 2", "Consejo práctico 3"]
        }}
        """),
        ("user", "Analiza el siguiente currículum: \n\n{resume_text}")
    ])

    candidate_models = get_candidate_models(api_key)
    print(f"📋 Modelos candidatos a probar en Groq: {candidate_models}")

    last_error = None

    for model_name in candidate_models:
        print(f"🤖 Intentando análisis con modelo: {model_name}...")
        try:
            llm = ChatGroq(
                model=model_name,
                temperature=0.1,
                groq_api_key=api_key
            )
            chain = prompt | llm

            for attempt in range(2):
                try:
                    response = chain.invoke({"resume_text": resume_text})
                    if response and response.content:
                        print(f"✅ Respuesta exitosa recibida del modelo {model_name}")
                        return response.content, None
                    else:
                        last_error = f"Respuesta vacía de Groq ({model_name})."
                except Exception as e:
                    error_str = str(e)
                    last_error = error_str
                    print(f"⚠️ Error con {model_name} (intento {attempt + 1}): {error_str}")
                    
                    # Si el modelo no existe o no se tiene acceso (404), saltar al siguiente candidato
                    if "404" in error_str or "model_not_found" in error_str:
                        break
                    # Si es Rate Limit (429), pausar antes de reintentar
                    elif "429" in error_str:
                        time.sleep(2)
                    else:
                        break

        except Exception as e:
            last_error = str(e)
            print(f"❌ Fallo al inicializar {model_name}: {last_error}")
            continue

    return None, last_error