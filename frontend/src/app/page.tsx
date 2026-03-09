"use client";

import { useState } from "react";

interface AnalysisResult {
  success: boolean;
  analysis?: {
    score: number;
    summary: string;
    missing_skills: string[];
    advice: string[];
  };
  error?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://ai-resume-analyzer-96ym.onrender.com/analyze", {
        method: "POST",
        body: formData,
      });
      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: "Error de conexión con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            AI Resume <span className="text-blue-600">Analyzer</span>
          </h1>
          <p className="text-lg text-slate-600">
            Obtén feedback instantáneo de nivel CTO sobre tu perfil profesional.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 transition-all">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-10 hover:border-blue-400 transition-colors bg-slate-50/50">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-4 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-slate-400 mb-6 font-medium">Solo archivos PDF (Máx. 5MB)</p>
            
            <button 
              onClick={handleUpload}
              disabled={loading || !file}
              className={`w-full max-w-xs py-3 px-6 rounded-xl font-bold text-white transition-all transform active:scale-95 ${
                loading || !file ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
              }`}
            >
              {loading ? "Analizando con IA..." : "Analizar Currículum"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result?.success && result.analysis && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Score & Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                <span className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-2">Puntuación ATS</span>
                <div className={`text-5xl font-black ${result.analysis.score > 70 ? 'text-green-500' : 'text-amber-500'}`}>
                  {result.analysis.score}
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full mt-4">
                  <div className={`h-2 rounded-full ${result.analysis.score > 70 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${result.analysis.score}%` }}></div>
                </div>
              </div>
              
              <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-2 block">Análisis Ejecutivo</span>
                <p className="text-slate-700 leading-relaxed italic">"{result.analysis.summary}"</p>
              </div>
            </div>

            {/* Detailed Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Missing Skills */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <span className="bg-red-100 text-red-600 p-1.5 rounded-lg mr-2">⚠️</span> 
                  Gaps Técnicos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.missing_skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Advice */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg mr-2">💡</span> 
                  Hoja de Ruta
                </h3>
                <ul className="space-y-3">
                  {result.analysis.advice.map((item, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {result && !result.success && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center">
            {result.error}
          </div>
        )}

      </div>
    </div>
  );
}