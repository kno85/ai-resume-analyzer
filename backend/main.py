import uvicorn
import io
import json
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
# Importamos la función de la IA
from ai_engine import get_resume_analysis

app = FastAPI()

# CORS obligatorio para que el Frontend no de error
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "Backend funcionando en el puerto 8080"}

@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    print(f"📥 Archivo recibido: {file.filename}")
    try:
        # 1. Leer y extraer texto del PDF
        content = await file.read()
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() or ""
        
        if not text.strip():
            print("⚠️ El PDF parece estar vacío o ser una imagen.")
            return {"success": False, "error": "No se pudo extraer texto del PDF."}

        # 2. Llamada a la IA
        print("🤖 Consultando a Groq...")
        analysis_raw = get_resume_analysis(text)
        
        # --- VALIDACIÓN ANTIFALLOS ---
        if analysis_raw is None:
            print("❌ La función get_resume_analysis devolvió None")
            return {"success": False, "error": "La IA no respondió. Revisa tu API Key y conexión a Groq."}

        print(f"📄 Respuesta cruda de la IA: {analysis_raw[:100]}...") # Log parcial para debug

        # 3. Limpieza de JSON inteligente
        # Buscamos los límites del objeto JSON por si la IA añade texto extra
        try:
            start_idx = analysis_raw.find('{')
            end_idx = analysis_raw.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                print("❌ No se encontró un JSON válido en la respuesta")
                return {"success": False, "error": "Formato de respuesta inválido de la IA."}

            clean_json = analysis_raw[start_idx:end_idx]
            data = json.loads(clean_json)
            
            print("✅ Análisis finalizado con éxito")
            return {"success": True, "analysis": data}

        except json.JSONDecodeError as e:
            print(f"❌ Error al decodificar JSON: {e}")
            return {"success": False, "error": "La IA no generó un JSON válido."}
        
    except Exception as e:
        print(f"❌ Error crítico en el servidor: {str(e)}")
        return {"success": False, "error": f"Error interno: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)