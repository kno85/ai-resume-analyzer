import os
import time
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

# Cargamos las variables de entorno (.env)
load_dotenv()

# Configuración del modelo
# Soporta configurar GROQ_MODEL por variable de entorno, usando 'llama-3.3-70b-versatile' por defecto
model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
llm = ChatGroq(
    model=model_name, 
    temperature=0.1, # Un poco de creatividad pero manteniendo precisión
    groq_api_key=os.getenv("GROQ_API_KEY")
)

def get_resume_analysis(resume_text: str):
    """
    Envía el texto del CV a Groq y devuelve una tupla (contenido, error).
    Incluye lógica de reintentos para evitar errores de Rate Limit (429).
    """
    
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

    chain = prompt | llm
    
    max_retries = 3
    last_error = None
    for attempt in range(max_retries):
        try:
            # Invocamos a la IA
            response = chain.invoke({"resume_text": resume_text})
            
            # Verificamos si la respuesta tiene contenido
            if response and response.content:
                return response.content, None
            else:
                last_error = f"Respuesta vacía de Groq (intento {attempt + 1})."
                print(f"⚠️ {last_error}")
                
        except Exception as e:
            error_str = str(e)
            last_error = error_str
            # Si es un error de Rate Limit (429), esperamos y reintentamos
            if "429" in error_str:
                wait_time = (attempt + 1) * 2
                print(f"⏳ Límite de peticiones alcanzado. Reintentando en {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"❌ Error en la llamada a Groq: {error_str}")
                break
                
    return None, last_error