"use client";

import { useState } from "react";
import { 
  CheckCircle, Users, BarChart3, Rocket, 
  AlertTriangle, Lightbulb, Loader2 
} from "lucide-react";

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
      setResult({ success: false, error: "Error de conexión con el servidor de Render." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- HERO SECTION --- */}
      <header className="py-16 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-blue-600 uppercase bg-blue-50 rounded-full">
          Powered by GPT-4 & ATS Algorithms
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-blue-600 bg-clip-text text-transparent">
          Increase your interview chances with AI-powered resume analysis
        </h1>
        
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Upload your resume and get instant feedback to optimize it for ATS systems used by recruiters.
        </p>

        {/* Social Proof Counter */}
        <div className="flex items-center justify-center gap-2 mb-12 text-slate-500 font-medium">
          <Users size={20} className="text-blue-500" />
          <span>Over <span className="text-blue-600 font-bold">1,200+</span> resumes analyzed this month</span>
        </div>

        {/* Upload Card */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-100/50 border border-slate-200 max-w-2xl mx-auto mb-10">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-blue-400 transition-colors bg-slate-50/50">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-4 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            <p className="text-xs text-slate-400 mb-6 font-medium uppercase tracking-widest">PDF format only (Max 5MB)</p>
            
            <button 
              onClick={handleUpload}
              disabled={loading || !file}
              className={`w-full max-w-xs py-4 px-8 rounded-xl font-black text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-3 ${
                loading || !file ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing Resume...
                </>
              ) : (
                "Get Free Analysis"
              )}
            </button>
          </div>
        </div>

        {/* --- LOADING SKELETON / SPINNER STATE --- */}
        {loading && (
          <div className="max-w-2xl mx-auto mt-12 p-12 text-center animate-pulse">
            <Loader2 className="mx-auto mb-4 text-blue-600 animate-spin" size={48} />
            <h3 className="text-lg font-bold text-slate-700">Analyzing with AI...</h3>
            <p className="text-slate-400 text-sm">Our neural network is checking your ATS compatibility.</p>
          </div>
        )}

        {/* Error State */}
        {result && !result.success && (
          <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {result.error}
          </div>
        )}
      </header>

      {/* --- RESULTS SECTION --- */}
      {result?.success && result.analysis && (
        <section className="max-w-5xl mx-auto px-4 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-2">Overall ATS Score</span>
              <div className={`text-6xl font-black ${result.analysis.score > 70 ? 'text-green-500' : 'text-amber-500'}`}>
                {result.analysis.score}
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${result.analysis.score > 70 ? 'bg-green-500' : 'bg-amber-500'}`} 
                  style={{ width: `${result.analysis.score}%` }}
                ></div>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <span className="text-blue-600 font-bold uppercase text-[10px] tracking-[0.2em] mb-4 block">Executive Summary</span>
              <p className="text-lg text-slate-700 leading-relaxed font-medium italic">
                "{result.analysis.summary}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <AlertTriangle className="text-amber-500 mr-2" size={24} /> 
                Critical Skills Missing
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.analysis.missing_skills.map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <Lightbulb className="text-blue-500 mr-2" size={24} /> 
                Improvement Roadmap
              </h3>
              <ul className="space-y-4">
                {result.analysis.advice.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ... Resto de secciones (Target Audience, Pricing, Footer) igual que el anterior ... */}
      <section className="bg-white py-24 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-16 text-slate-900">Who is this for?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { title: "Job Seekers", desc: "Beat the ATS filter", icon: <Rocket className="mx-auto mb-4 text-blue-600" /> },
              { title: "Career Coaches", desc: "Scale your feedback", icon: <Users className="mx-auto mb-4 text-blue-600" /> },
              { title: "Bootcamps", desc: "Higher hiring rates", icon: <BarChart3 className="mx-auto mb-4 text-blue-600" /> },
              { title: "Recruiters", desc: "Pre-screen candidates", icon: <CheckCircle className="mx-auto mb-4 text-blue-600" /> }
            ].map((item, idx) => (
              <div key={idx} className="group">
                <div className="p-4 rounded-2xl group-hover:bg-blue-50 transition-colors text-center flex flex-col items-center">
                    {item.icon}
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-500 mt-2">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 text-slate-900">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 font-medium">Invest in your career with the right plan.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-black mb-6">$0<span className="text-lg text-slate-400 font-normal">/month</span></div>
              <ul className="space-y-4 mb-10 text-slate-600 font-medium">
                <li className="flex items-center gap-3">✓ 1 resume analysis</li>
                <li className="flex items-center gap-3">✓ Basic AI feedback</li>
              </ul>
              <button className="w-full py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-300 cursor-not-allowed">
                Current Plan
              </button>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-200/50 border-2 border-blue-600 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                Best Value
              </div>
              <h3 className="text-xl font-bold mb-2 text-blue-600">Pro</h3>
              <div className="text-4xl font-black mb-6">$9<span className="text-lg text-slate-400 font-normal">/month</span></div>
              <ul className="space-y-4 mb-10 text-slate-700">
                <li className="flex items-center gap-3 font-bold"><CheckCircle size={20} className="text-blue-600" /> Unlimited analysis</li>
                <li className="flex items-center gap-3 font-bold"><CheckCircle size={20} className="text-blue-600" /> Full ATS score report</li>
                <li className="flex items-center gap-3 font-bold"><CheckCircle size={20} className="text-blue-600" /> AI cover letter generator</li>
              </ul>
              <button className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-sm font-medium">
          © 2026 AI Resume Optimization SaaS. Ready for acquisition.
        </p>
      </footer>
    </div>
  );
}