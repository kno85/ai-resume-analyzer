"use client";

import { useState, useEffect, useRef } from "react";

interface AnalysisData {
  score: number;
  summary: string;
  missing_skills: string[];
  advice: string[];
}

interface AnalysisResult {
  success: boolean;
  analysis?: AnalysisData;
  error?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [completedAdvice, setCompletedAdvice] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const loadingSteps = [
    "Leyendo y extrayendo texto estructurado del PDF...",
    "Auditando formato y detectando compatibilidad con ATS...",
    "Consultando a la IA Groq (Llama 3.3) para identificar brechas...",
    "Generando hoja de ruta estratégica y puntuación final..."
  ];

  // Ciclo dinámico de mensajes durante la carga
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      setResult({
        success: false,
        error: "Por favor, sube únicamente archivos en formato PDF."
      });
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setResult({
        success: false,
        error: "El archivo es demasiado grande. El tamaño máximo permitido es 5 MB."
      });
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setCompletedAdvice({});

    const formData = new FormData();
    formData.append("file", file);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ai-resume-analyzer-96ym.onrender.com";

    try {
      const response = await fetch(`${backendUrl}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor (${response.status})`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setResult({
        success: false,
        error: `No se pudo conectar con el servidor (${message}). Si el servidor gratuito de Render estaba inactivo, suele tardar unos segundos en despertar. Por favor, reintenta en un momento.`
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdvice = (index: number) => {
    setCompletedAdvice((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const copyFullReport = () => {
    if (!result?.analysis) return;
    const { score, summary, missing_skills, advice } = result.analysis;
    const text = `=== INFORME DE AUDITORÍA ATS - AI RESUME ANALYZER ===\n\n` +
      `Puntuación ATS: ${score}/100\n\n` +
      `Resumen Ejecutivo:\n${summary}\n\n` +
      `Habilidades Clave Faltantes:\n${missing_skills.map((s) => `• ${s}`).join("\n")}\n\n` +
      `Hoja de Ruta de Mejora:\n${advice.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n` +
      `Herramienta 100% Gratuita: https://ai-resume-analyzer-wheat-pi.vercel.app/`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copySummaryText = () => {
    if (!result?.analysis?.summary) return;
    navigator.clipboard.writeText(result.analysis.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) {
      return {
        text: "text-emerald-400",
        border: "border-emerald-500/40",
        bg: "bg-emerald-500/10",
        stroke: "#10b981",
        label: "Excelente Compatibilidad ATS",
        sub: "Tu CV tiene un nivel sobresaliente para superar los filtros automatizados.",
      };
    }
    if (score >= 60) {
      return {
        text: "text-cyan-400",
        border: "border-cyan-500/40",
        bg: "bg-cyan-500/10",
        stroke: "#06b6d4",
        label: "Perfil Competitivo con Mejoras",
        sub: "Buen formato base, pero aplicar los ajustes tácticos aumentará tus respuestas.",
      };
    }
    return {
      text: "text-amber-400",
      border: "border-amber-500/40",
      bg: "bg-amber-500/10",
      stroke: "#f59e0b",
      label: "Optimización Requerida",
      sub: "Los algoritmos ATS podrían descartar este CV antes de que llegue a un reclutador.",
    };
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-hidden">
      
      {/* Luces de fondo decorativas (Mesh Glow) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] -left-48 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-[1400px] -right-48 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* --- NAVBAR --- */}
      <nav className="w-full border-b border-white/5 backdrop-blur-xl bg-[#070b14]/70 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
              <div className="h-full w-full bg-[#090d16] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="m9 15 2 2 4-4"/>
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  ResumeLens <span className="text-cyan-400">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  100% Gratis
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Auditor ATS de Currículums Profesional</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href="#como-funciona"
              className="text-xs font-medium text-slate-300 hover:text-white transition-colors hidden md:inline-block px-3 py-1.5"
            >
              ¿Cómo funciona?
            </a>
            <a 
              href="#por-que-gratis"
              className="text-xs font-medium text-slate-300 hover:text-white transition-colors hidden md:inline-block px-3 py-1.5"
            >
              Garantía Gratuita
            </a>
            <button
              onClick={() => {
                const element = document.getElementById("zona-subida");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Auditar mi CV
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-14 pb-12 px-4 sm:px-6 text-center max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Badge Hero */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-300 shadow-inner backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>IA Avanzada LLaMA 3.3 con Inferencia Groq</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-semibold">100% Gratuito y Libre</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.12] mb-6 max-w-4xl">
          Supera los filtros de selección y consigue{" "}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            más entrevistas de trabajo
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-10 leading-relaxed font-normal">
          El <span className="text-white font-semibold">75% de los currículums son descartados</span> por sistemas automatizados (ATS) antes de llegar a un reclutador humano. Sube tu CV en PDF y obtén una auditoría inteligente con puntuación, brechas técnicas y consejos tácticos en segundos.
        </p>

        {/* Métricas destacadas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl mb-12 text-left">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
            <div className="text-xl font-bold text-white mb-0.5">0€</div>
            <div className="text-xs text-slate-400 font-medium">100% Gratis para siempre</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
            <div className="text-xl font-bold text-cyan-400 mb-0.5">&lt; 3s</div>
            <div className="text-xs text-slate-400 font-medium">Análisis en tiempo real</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
            <div className="text-xl font-bold text-emerald-400 mb-0.5">Sin Registro</div>
            <div className="text-xs text-slate-400 font-medium">Acceso libre inmediato</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
            <div className="text-xl font-bold text-purple-400 mb-0.5">100% Privado</div>
            <div className="text-xs text-slate-400 font-medium">Procesado en memoria</div>
          </div>
        </div>

        {/* --- TARJETA DE SUBIDA (DROPZONE) --- */}
        <div id="zona-subida" className="w-full max-w-2xl scroll-mt-24">
          <div className="p-1 rounded-3xl bg-gradient-to-b from-blue-500/20 via-white/5 to-white/0 shadow-2xl shadow-blue-950/50">
            <div className="p-6 sm:p-8 rounded-[22px] bg-[#0c1220] border border-white/10 backdrop-blur-xl">
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 sm:p-10 cursor-pointer transition-all duration-300 group ${
                  isDragging 
                    ? "border-cyan-400 bg-cyan-950/20 scale-[1.01]" 
                    : file 
                      ? "border-blue-500/50 bg-blue-950/10 hover:border-blue-400" 
                      : "border-slate-700/80 bg-[#090d18]/60 hover:border-slate-500 hover:bg-[#0b1122]"
                }`}
              >
                <input 
                  ref={fileInputRef}
                  id="cv-file-input"
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                />

                {file ? (
                  /* Archivo Seleccionado */
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
                      <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white max-w-[280px] sm:max-w-[360px] truncate">
                        {file.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-400 font-medium mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Archivo PDF verificado y listo para auditoría
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setResult(null);
                      }}
                      className="text-xs text-slate-400 hover:text-rose-400 underline decoration-slate-600 underline-offset-4 transition-colors"
                    >
                      Elegir otro archivo
                    </button>
                  </div>
                ) : (
                  /* Estado Vacío de Arrastre */
                  <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-300 mb-4 group-hover:scale-110 group-hover:border-cyan-500/40 group-hover:text-cyan-400 transition-all duration-300 shadow-inner">
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1.5">
                      Arrastra y suelta tu CV aquí o <span className="text-cyan-400 group-hover:underline">haz clic para explorar</span>
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                      Admite formato PDF estructurado (máx. 5MB)
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                      <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Privacidad garantizada: tu CV no se guardará
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de Análisis */}
              <div className="mt-6 flex flex-col items-center">
                <button 
                  id="btn-analizar-cv"
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className={`w-full py-4 px-8 rounded-xl font-bold text-sm tracking-wide transition-all transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-3 ${
                    loading || !file 
                      ? "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none" 
                      : "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white hover:shadow-cyan-500/25 hover:shadow-xl hover:scale-[1.01]"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-cyan-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analizando con IA...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      <span>{file ? "Auditar Currículum Gratis Ahora" : "Selecciona un archivo PDF para auditar"}</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-500 mt-3 text-center">
                  Herramienta 100% gratuita • Sin suscripciones ocultas • Sin tarjeta de crédito
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* --- ESTADO DE CARGA DINÁMICO --- */}
        {loading && (
          <div className="w-full max-w-xl mx-auto mt-10 p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-3 w-3 rounded-full bg-cyan-400 animate-ping"></div>
              <h3 className="text-sm font-semibold text-cyan-300 tracking-wide uppercase">
                Auditoría ATS en Progreso
              </h3>
            </div>
            
            {/* Barra de progreso animada */}
            <div className="w-full bg-slate-800/80 rounded-full h-2 mb-4 overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
              ></div>
            </div>

            <p className="text-sm text-slate-300 font-medium italic min-h-[24px]">
              "{loadingSteps[loadingStep]}"
            </p>
          </div>
        )}

        {/* --- MENSAJE DE ERROR --- */}
        {result && !result.success && (
          <div className="w-full max-w-2xl mx-auto mt-8 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-left flex items-start gap-4">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-300 mb-1">Aviso al procesar el archivo</h4>
              <p className="text-xs text-rose-200/90 leading-relaxed">{result.error}</p>
              <button 
                onClick={handleUpload}
                className="mt-3 text-xs font-semibold text-rose-300 underline underline-offset-4 hover:text-white"
              >
                Reintentar auditoría
              </button>
            </div>
          </div>
        )}

      </header>

      {/* --- SECCIÓN DE RESULTADOS --- */}
      {result?.success && result.analysis && (
        <section ref={resultsRef} className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 pt-4 w-full">
          
          {/* Header de Resultados */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Auditoría ATS completada con éxito
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Diagnóstico de Compatibilidad Laboral
              </h2>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={copyFullReport}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="text-emerald-400">¡Informe copiado!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    <span>Copiar Informe</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-semibold text-blue-300 transition-all"
              >
                Auditar otro CV
              </button>
            </div>
          </div>

          {/* Fila 1: Puntuación ATS + Resumen Ejecutivo */}
          {(() => {
            const scoreDetails = getScoreColor(result.analysis.score);
            const radius = 54;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (result.analysis.score / 100) * circumference;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                
                {/* Score Circular Gauge */}
                <div className="p-7 rounded-3xl bg-[#0d1424] border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                  
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Puntuación ATS General
                  </span>

                  {/* SVG Circular Gauge */}
                  <div className="relative w-36 h-36 flex items-center justify-center my-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                      {/* Círculo de Fondo */}
                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* Círculo de Progreso */}
                      <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke={scoreDetails.stroke}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-black ${scoreDetails.text}`}>
                        {result.analysis.score}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">sobre 100</span>
                    </div>
                  </div>

                  <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold border ${scoreDetails.bg} ${scoreDetails.border} ${scoreDetails.text}`}>
                    {scoreDetails.label}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 max-w-[220px]">
                    {scoreDetails.sub}
                  </p>
                </div>

                {/* Resumen Ejecutivo */}
                <div className="md:col-span-2 p-7 rounded-3xl bg-[#0d1424] border border-white/10 backdrop-blur-xl flex flex-col justify-between shadow-xl relative">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          Diagnóstico del Reclutador Virtual
                        </span>
                      </div>
                      
                      <button
                        onClick={copySummaryText}
                        className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                        title="Copiar resumen"
                      >
                        {copiedSummary ? (
                          <span className="text-emerald-400 text-[11px] font-semibold">¡Copiado!</span>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative mb-4">
                      <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal italic">
                        "{result.analysis.summary}"
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                      Auditado con LLaMA 3.3 bajo criterios ATS modernos
                    </span>
                    <span className="text-slate-500">
                      Impacto de métricas • Tecnologías • Redacción
                    </span>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* Fila 2: Habilidades Faltantes + Roadmap con Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Habilidades Críticas Faltantes */}
            <div className="p-7 rounded-3xl bg-[#0d1424] border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Habilidades Críticas Faltantes</h3>
                    <p className="text-xs text-slate-400">Palabras clave que los algoritmos ATS echan en falta</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300/80 mb-5 leading-relaxed">
                  Los filtros ATS indexan términos técnicos específicos. Añadir estas competencias en tu experiencia laboral o sección de habilidades aumentará drásticamente tu tasa de coincidencia:
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {result.analysis.missing_skills.length > 0 ? (
                    result.analysis.missing_skills.map((skill, i) => (
                      <div
                        key={i}
                        className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2 hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                        {skill}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-emerald-400 font-medium">
                      No se detectaron brechas evidentes de palabras clave.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-200/90 leading-relaxed">
                💡 <span className="font-semibold text-amber-300">Consejo ATS:</span> Asegúrate de contextualizar estas palabras clave con logros concretos (ejemplo: "Implementé X tecnología reduciendo tiempos un 30%").
              </div>
            </div>

            {/* Hoja de Ruta de Mejora con Checklist */}
            <div className="p-7 rounded-3xl bg-[#0d1424] border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Plan de Acción Inmediato</h3>
                      <p className="text-xs text-slate-400">Aplica estos cambios antes de enviar tu candidatura</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    {Object.values(completedAdvice).filter(Boolean).length}/{result.analysis.advice.length} Hechos
                  </span>
                </div>

                <p className="text-xs text-slate-300/80 mb-4">
                  Haz clic en cada recomendación para marcarla conforme vayas editando tu currículum:
                </p>

                <div className="space-y-3 mb-4">
                  {result.analysis.advice.map((item, i) => {
                    const isChecked = !!completedAdvice[i];
                    return (
                      <div
                        key={i}
                        onClick={() => toggleAdvice(i)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked 
                            ? "bg-emerald-950/20 border-emerald-500/30 opacity-75" 
                            : "bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className={`mt-0.5 h-5 w-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${
                          isChecked 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "border-slate-600 bg-slate-800/80"
                        }`}>
                          {isChecked && (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className={`text-xs leading-relaxed ${
                            isChecked ? "line-through text-slate-400" : "text-slate-200 font-medium"
                          }`}>
                            {item}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 text-center">
                Auditoría basada en estándares de reclutamiento técnico
              </div>
            </div>

          </div>

        </section>
      )}

      {/* --- SECCIÓN: CÓMO FUNCIONA --- */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 border-t border-white/5 bg-[#080d19]/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2 block">
              Optimización en 3 pasos
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              ¿Cómo analiza tu CV nuestro motor de IA?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-3xl bg-[#0c1222] border border-white/5 flex flex-col items-start relative">
              <div className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full mb-5 border border-cyan-500/20">
                Paso 01
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Extracción Estructurada</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                PyPDF examina tu documento para verificar que el texto sea legible para los escáneres ATS y no esté bloqueado como imagen plana.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#0c1222] border border-white/5 flex flex-col items-start relative">
              <div className="text-xs font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full mb-5 border border-blue-500/20">
                Paso 02
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Evaluación con LLaMA 3.3</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Un prompt con ingeniería de roles de Reclutador Técnico Senior analiza el impacto de métricas, relevancia tecnológica y claridad.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#0c1222] border border-white/5 flex flex-col items-start relative">
              <div className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mb-5 border border-emerald-500/20">
                Paso 03
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Diagnóstico Accionable</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Recibes una puntuación de compatibilidad con hoja de ruta y habilidades críticas para corregir tu CV antes de enviarlo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN: POR QUÉ ES 100% GRATUITO --- */}
      <section id="por-que-gratis" className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 block">
              Compromiso de Acceso Abierto
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              100% Gratuito. Sin Letra Pequeña.
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Diseñado para que cualquier profesional o candidato pueda auditar su currículum con herramientas de IA de primer nivel sin barreras de pago.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl mb-3">💸</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Sin Costes ni Suscripciones</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No hay planes "Pro" ficticios ni muros de pago. Todas las funcionalidades están abiertas a todos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl mb-3">🔓</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Sin Registro Obligatorio</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No te pedimos crear cuenta, ni correo electrónico ni datos personales. Entras, subes y auditas.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl mb-3">🛡️</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Privacidad por Diseño</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tu currículum se procesa en la memoria RAM volátil del backend y se descarta de inmediato.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl mb-3">⚡</div>
              <h4 className="text-sm font-bold text-white mb-1.5">Inferencia Ultrarrápida</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gracias a la tecnología de chips LPUs de Groq, las respuestas de IA tardan segundos, no minutos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="mt-auto py-12 px-4 sm:px-6 border-t border-white/5 bg-[#05080f] text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">ResumeLens AI</span>
            <span>•</span>
            <span>Herramienta Abierta y Gratuita de Auditoría ATS</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI</span>
            <span>•</span>
            <span>Groq LLaMA 3.3</span>
            <span>•</span>
            <span>Next.js</span>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-slate-600">
          © {new Date().getFullYear()} ResumeLens AI. Creado para potenciar tu carrera profesional sin barreras.
        </p>
      </footer>

    </div>
  );
}