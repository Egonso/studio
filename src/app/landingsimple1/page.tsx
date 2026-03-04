'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, CheckCircle2, Award, ArrowUpRight } from 'lucide-react';
import { ThemeAwareLogo } from '@/components/theme-aware-logo';

export default function LandingSimple1() {
    const router = useRouter();
    const [useCaseText, setUseCaseText] = useState('');

    const handleCapture = (e: React.FormEvent) => {
        e.preventDefault();
        if (!useCaseText.trim()) return;
        // We pass the typed tool directly to the capture flow or login context
        // In a real flow, this could set a cookie or pass a URL param so that 
        // after signup, the register opens with this specific draft.
        router.push(`/einrichten?q=${encodeURIComponent(useCaseText)}`);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-slate-200">

            {/* Sumi-e Inspired Background Texture / Element */}
            {/* We use a subtle SVG path to hint at a brush stroke without overwhelming the UI */}
            <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden pointer-events-none opacity-[0.03] flex items-center justify-center">
                <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="w-[150%] h-full blur-[10px]">
                    <path d="M-50,150 Q200,50 500,150 T1050,150" fill="none" stroke="black" strokeWidth="80" strokeLinecap="round" />
                </svg>
            </div>

            <header className="px-6 py-8 flex justify-between items-center max-w-6xl mx-auto relative z-10 w-full border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <ThemeAwareLogo alt="EUKI Logo" width={28} height={28} className="opacity-90" />
                    <span className="text-sm font-semibold tracking-wide text-slate-800 uppercase">AI Governance Register</span>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="text-xs tracking-widest text-slate-500 hover:text-slate-900 transition-colors uppercase"
                >
                    Anmelden
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-24 pb-32 relative z-10">

                {/* HERO: The Freemium Capture Area */}
                <div className="text-center space-y-12 mb-32">

                    <div className="space-y-6 max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-serif text-slate-900 leading-tight tracking-tight">
                            Ihre KI-Compliance.<br />
                            <span className="text-slate-500 italic font-light">Mit drei Strichen dokumentiert.</span>
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
                            Kein abstraktes Tooling. Kein Marketing-Lärm. Das offizielle Register zur revisionssicheren Dokumentation Ihrer KI-Einsatzfälle nach dem EU AI Act.
                        </p>
                    </div>

                    <form onSubmit={handleCapture} className="max-w-xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-100 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                        <div className="relative flex items-center bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden p-1 focus-within:ring-1 focus-within:ring-slate-900 focus-within:border-slate-900 transition-all">
                            <input
                                type="text"
                                value={useCaseText}
                                onChange={(e) => setUseCaseText(e.target.value)}
                                placeholder="Welches KI-System nutzen Sie? z.B. DeepL"
                                className="w-full pl-5 pr-4 py-4 text-base bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium"
                                required
                            />
                            <button
                                type="submit"
                                className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-sm text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                Als Entwurf erfassen <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-4 font-mono tracking-tight flex items-center justify-center gap-1.5">
                            <Lock className="w-3 h-3" /> Kostenlos & DS-GVO konform
                        </p>
                        <div className="mt-6 text-sm text-slate-500 font-light max-w-lg mx-auto leading-relaxed border-t border-slate-200 pt-6">
                            Der AI Act fordert mehr als nur Tool-Listen. Er verlangt die lückenlose Registrierung des <strong className="font-medium text-slate-700">konkreten Einsatzfalls</strong> in Ihrem Unternehmen. Diese Grunddokumentation bleibt bei uns dauerhaft kostenlos.
                        </div>
                    </form>
                </div>

                {/* PRICING: Institutional Minimalism */}
                <div className="border-t border-slate-200 pt-24">

                    <div className="mb-16 text-center">
                        <h2 className="text-sm font-semibold tracking-widest text-slate-900 uppercase">Organisations & Betriebsebene</h2>
                        <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto">
                            Für die kontinuierliche Steuerung (ISO 42001) und Audit-Readiness ganzer IT-Portfolios.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200 bg-white rounded-md overflow-hidden shadow-sm">

                        {/* Starter */}
                        <div className="p-8 border-b md:border-b-0 md:border-r border-slate-200 hover:bg-slate-50 transition-colors">
                            <div className="mb-6">
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Dokumentation</span>
                                <div className="mt-2 text-3xl font-serif text-slate-900">39 €<span className="text-sm font-sans text-slate-500 font-normal"> / Mo</span></div>
                                <p className="text-xs text-slate-500 mt-3 font-medium">Der Einstieg für KMU</p>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-600 mb-8 font-light">
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /> Bis zu 100 Use Cases</li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /> Max. 3 User (Team-Zugriff)</li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /> Manueller Batch-Export</li>
                            </ul>
                            <button onClick={() => router.push('/einrichten')} className="w-full py-2.5 px-4 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-sm transition-colors">Register anlegen</button>
                        </div>

                        {/* Pro */}
                        <div className="p-8 border-b md:border-b-0 md:border-r border-slate-200 relative bg-slate-900 text-white">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-600 to-slate-400"></div>
                            <div className="mb-6">
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Steuerung</span>
                                <div className="mt-2 text-3xl font-serif text-white">99 €<span className="text-sm font-sans text-slate-400 font-normal"> / Mo</span></div>
                                <p className="text-xs text-slate-400 mt-3 font-medium">Standard für Mittelstand</p>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-300 mb-8 font-light">
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> Inkl. AI Pre-Audit</li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> Bis zu 10 User</li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> Custom Policies Management</li>
                            </ul>
                            <button onClick={() => router.push('/einrichten')} className="w-full py-2.5 px-4 text-xs font-medium text-slate-900 bg-white hover:bg-slate-100 rounded-sm transition-colors">Register anlegen</button>
                        </div>

                        {/* Enterprise */}
                        <div className="p-8 hover:bg-slate-50 transition-colors">
                            <div className="mb-6">
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Komplexität</span>
                                <div className="mt-2 text-3xl font-serif text-slate-900">199 €<span className="text-sm font-sans text-slate-500 font-normal"> / Mo</span></div>
                                <p className="text-xs text-slate-500 mt-3 font-medium">ISO 42001 & Konzerne</p>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-600 mb-8 font-light">
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /> Unbegrenzte Systeme & User</li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /> Portfolio Intelligence Dashboard</li>
                                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /> Whitelabel Proof-Packs</li>
                            </ul>
                            <button onClick={() => window.location.href = "mailto:sales@kiregister.com"} className="w-full py-2.5 px-4 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-sm transition-colors">Kontakt aufnehmen</button>
                        </div>

                    </div>

                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center bg-slate-50 border border-slate-200 rounded-md p-6">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900">Certified Officer Ausbildung</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Werden Sie zertifizierter AI-Prüfer inkl. dauerhaft verbilligter Software-Lizenzen für Ihre Mandanten.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                            <div className="text-right">
                                <span className="block text-sm font-serif text-slate-900">995 €</span>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Einmalig</span>
                            </div>
                            <button onClick={() => window.location.href = "https://kiregister.com"} className="text-xs font-medium text-slate-800 flex items-center gap-1 hover:text-blue-900 transition-colors">
                                Zur Lehrgangs-Spezifikation <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                </div>
            </main>

            <footer className="border-t border-slate-200 py-12 bg-white text-center text-xs text-slate-400 font-mono">
                &copy; {new Date().getFullYear()} EUKI Gesetz. Alle Rechte vorbehalten. Dokumentation nach AI Act.
            </footer>
        </div>
    );
}
