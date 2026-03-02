'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function LandingSimple2() {
    const router = useRouter();
    const [useCaseText, setUseCaseText] = useState('');

    const handleCapture = (e: React.FormEvent) => {
        e.preventDefault();
        if (!useCaseText.trim()) return;
        router.push(`/einrichten?q=${encodeURIComponent(useCaseText)}`);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-slate-200">

            {/* Sumi-e Inspired Background Texture */}
            <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none opacity-[0.03] flex items-center justify-center">
                <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="w-[150%] h-full blur-[12px]">
                    {/* Abstract sweeping brush stroke */}
                    <path d="M-100,250 Q300,-50 600,200 T1200,100" fill="none" stroke="black" strokeWidth="100" strokeLinecap="round" />
                </svg>
            </div>

            <header className="px-6 py-8 flex justify-between items-center max-w-6xl mx-auto relative z-10 w-full border-b border-slate-100">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
                    <div className="relative">
                        <Image src="/register-logo.png" alt="EUKI Logo" width={28} height={28} className="dark:invert opacity-90 transition-transform group-hover:scale-105" />
                        {/* No colored accent here anymore */}
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-slate-800 uppercase">AI Governance Register</span>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="text-xs tracking-widest text-slate-500 hover:text-slate-900 transition-colors uppercase font-medium"
                >
                    Anmelden
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-24 pb-32 relative z-10">

                {/* HERO: Pure Freemium Focus */}
                <div className="text-center space-y-12 mb-24">

                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="flex justify-center mb-6">
                            {/* Monochrome Institutional Seal */}
                            <div className="w-12 h-12 border-2 border-slate-900 rounded-sm flex items-center justify-center rotate-3 opacity-90">
                                <span className="font-serif text-slate-900 font-bold text-lg">印</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif text-slate-900 leading-tight tracking-tight">
                            Ihre KI-Compliance.<br />
                            <span className="text-slate-500 italic font-light">Mit drei Strichen dokumentiert.</span>
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
                            Der EU AI Act fordert mehr als nur Tool-Listen. Er verlangt die lückenlose Registrierung des <strong className="font-medium text-slate-800">konkreten Einsatzfalls</strong> in Ihrem Unternehmen.
                        </p>
                    </div>

                    <form onSubmit={handleCapture} className="max-w-xl mx-auto relative group mt-12">
                        <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
                        <div className="relative flex flex-col sm:flex-row shadow-lg shadow-slate-200/50 rounded-md overflow-hidden bg-white border border-slate-200 focus-within:ring-1 focus-within:ring-slate-900 focus-within:border-slate-900 transition-all p-1">
                            <input
                                type="text"
                                value={useCaseText}
                                onChange={(e) => setUseCaseText(e.target.value)}
                                placeholder="Welches KI-System nutzen Sie? z.B. ChatGPT"
                                className="w-full pl-5 pr-4 py-4 text-base bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                                required
                            />
                            <button
                                type="submit"
                                className="shrink-0 bg-slate-900 hover:bg-black text-white px-8 py-4 sm:py-0 rounded-sm text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                Jetzt dokumentieren <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-slate-500 font-mono tracking-tight">
                            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-slate-400" /> DS-GVO Konform</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-slate-400" /> Dauerhaft Kostenlos</span>
                        </div>
                    </form>
                </div>

                {/* THE "WHY" SECTION: Institutional Trust */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-32 pt-16 border-t border-slate-200">
                    <div>
                        <h2 className="text-2xl font-serif text-slate-900 mb-4">Warum reines Dokumentieren immer kostenlos bleibt.</h2>
                        <div className="w-8 h-px bg-slate-900 mb-6"></div>
                        <div className="space-y-4 text-slate-600 font-light leading-relaxed">
                            <p>Transparenz sollte keine Kostenfrage sein. Das EUKI AI Governance Register stellt die Basis-Infrastruktur zur Vefügung, damit jede Organisation – vom Startup bis zum Mittelstand – sofort rechtssicher nachweisen kann, *wozu* KI eingesetzt wird.</p>
                            <p>Ihre Datenstruktur wird automatisch in die erforderlichen Formate (JSON, PDF-Pass) des AI Acts übersetzt.</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-8 rounded-sm">
                        <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-6">Der nächste Schritt (Optional)</h3>
                        <h4 className="text-lg font-serif text-slate-900 mb-3 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-slate-900" /> Von der Dokumentation zur Steuerung
                        </h4>
                        <p className="text-sm text-slate-600 font-light leading-relaxed mb-6">
                            Sobald Ihr Register wächst, reicht reine Dokumentation oft nicht mehr. Für Unternehmen, die Prozesse etablieren wollen (ISO 42001), bieten wir das <strong className="font-medium text-slate-800">Governance Control Center</strong>.
                        </p>

                        <ul className="space-y-2 mb-8">
                            <li className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Automatische Review-Zyklen
                            </li>
                            <li className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> AI-gestütztes Pre-Audit
                            </li>
                            <li className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Bulk-Exporte für Behörden
                            </li>
                        </ul>

                        <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                            <span className="text-xs text-slate-500">Zusatzmodule ab</span>
                            <span className="text-base font-serif text-slate-900">39 €<span className="text-xs text-slate-400 font-sans"> / Monat</span></span>
                        </div>
                    </div>
                </div>

            </main>

            <footer className="border-t border-slate-200 py-12 bg-white text-center text-xs text-slate-400 font-mono relative z-10">
                &copy; {new Date().getFullYear()} EUKI Gesetz. Alle Rechte vorbehalten. Dokumentation nach AI Act.
            </footer>
        </div>
    );
}
