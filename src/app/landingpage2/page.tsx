'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Layers, ShieldCheck, FileCheck, Award, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage2() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-100">

            {/* Subtle Minimalist Background Texture */}
            <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none opacity-[0.03] flex items-center justify-center">
                <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="w-[150%] h-full blur-[10px]">
                    <path d="M-50,200 Q400,0 700,250 T1200,150" fill="none" stroke="black" strokeWidth="80" strokeLinecap="round" />
                </svg>
            </div>

            <header className="px-6 py-8 flex justify-between items-center max-w-6xl mx-auto relative z-10 w-full border-b border-slate-100">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
                    <div className="relative">
                        <Image src="/register-logo.png" alt="EUKI Logo" width={28} height={28} className="dark:invert opacity-90 transition-transform group-hover:scale-105" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-slate-800 uppercase">Governance Control Center</span>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="text-xs tracking-widest text-slate-500 hover:text-blue-900 transition-colors uppercase font-medium"
                >
                    Anmelden
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-24 pb-32 relative z-10">

                {/* HERO: Paid/Control Focus */}
                <div className="text-center space-y-12 mb-24">

                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="flex justify-center mb-6">
                            {/* Institutional Seal */}
                            <div className="w-12 h-12 border-2 border-blue-900 rounded-sm flex items-center justify-center rotate-3 opacity-90">
                                <ShieldCheck className="w-6 h-6 text-blue-900" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif text-slate-900 leading-tight tracking-tight">
                            Ihre KI-Infrastruktur.<br />
                            <span className="text-slate-500 italic font-light">Sicher gesteuert und auditiert.</span>
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
                            Reine Dokumentation reicht für Organisationen nicht aus. Das Governance Control Center etabliert <strong className="font-medium text-slate-800">ISO 42001 konforme Prüfzyklen</strong> und sichert Ihr IT-Portfolio gegen Haftungsrisiken nach dem AI Act ab.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-slate-100 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition duration-500 pointer-events-none"></div>
                        <button
                            onClick={() => router.push('/einrichten')}
                            className="w-full sm:w-auto relative bg-blue-900 hover:bg-blue-950 text-white px-10 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20"
                        >
                            <Layers className="w-4 h-4" /> Register & Steuerung aktivieren
                        </button>
                        <button
                            onClick={() => window.location.href = "mailto:sales@eukigesetz.com"}
                            className="w-full sm:w-auto relative bg-white border border-slate-300 hover:border-blue-900 hover:text-blue-900 text-slate-700 px-10 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            Vertrieb kontaktieren <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* FEATURE & PRICING SECTION: Governance Focus */}
                <div className="mt-32 pt-16 border-t border-slate-200">
                    <div className="mb-16 text-center">
                        <h2 className="text-sm font-semibold tracking-widest text-slate-900 uppercase">Die Betriebsebene</h2>
                        <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto">
                            Wählen Sie das Steuerungsmodell, das zur Komplexität Ihrer KI-Lieferkette passt.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Basis (Freemium mentioned briefly) / Starter (Dokumentation) */}
                        <div className="bg-white border border-slate-200 p-8 flex flex-col">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Dokumentation</h3>
                            <div className="text-3xl font-serif text-slate-900 mb-1">39 €<span className="text-sm text-slate-500 font-sans font-normal"> / Mo</span></div>
                            <p className="text-xs text-slate-500 mb-8 border-b border-slate-100 pb-4">Start für KMU & Agenturen</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-600 font-light">
                                    <FileCheck className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" /> Bis zu 100 KI-Systeme
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600 font-light">
                                    <FileCheck className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" /> Max. 3 Governance-User
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600 font-light">
                                    <FileCheck className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" /> Manueller Batch-Export
                                </li>
                            </ul>
                            <button onClick={() => router.push('/einrichten')} className="w-full py-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">Jetzt starten</button>
                        </div>

                        {/* Steuerung (Pro) - Highlighted */}
                        <div className="bg-blue-900 border border-blue-900 p-8 shadow-xl shadow-blue-900/20 transform md:-translate-y-4 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-800 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <h3 className="text-xs uppercase tracking-widest font-bold text-blue-300 mb-2 relative z-10">Steuerung</h3>
                            <div className="text-3xl font-serif text-white mb-1 relative z-10">99 €<span className="text-sm text-blue-300 font-sans font-normal"> / Mo</span></div>
                            <p className="text-xs text-blue-300 mb-8 border-b border-blue-800 pb-4 relative z-10">Standard für den Mittelstand</p>

                            <ul className="space-y-4 mb-8 flex-1 relative z-10">
                                <li className="flex items-start gap-3 text-sm text-blue-100 font-light">
                                    <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" /> Automatisierte Review-Zyklen
                                </li>
                                <li className="flex items-start gap-3 text-sm text-blue-100 font-light">
                                    <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" /> Inklusive AI Pre-Audit
                                </li>
                                <li className="flex items-start gap-3 text-sm text-blue-100 font-light">
                                    <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" /> Custom Policies Management
                                </li>
                                <li className="flex items-start gap-3 text-sm text-blue-100 font-light">
                                    <ShieldCheck className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" /> Bis zu 10 Governance-User
                                </li>
                            </ul>
                            <button onClick={() => router.push('/einrichten')} className="w-full py-3 text-xs font-medium text-blue-900 bg-white hover:bg-blue-50 transition-colors relative z-10">Trial aktivieren</button>
                        </div>

                        {/* Komplexität (Enterprise) */}
                        <div className="bg-white border border-slate-200 p-8 flex flex-col">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Komplexität</h3>
                            <div className="text-3xl font-serif text-slate-900 mb-1">199 €<span className="text-sm text-slate-500 font-sans font-normal"> / Mo</span></div>
                            <p className="text-xs text-slate-500 mb-8 border-b border-slate-100 pb-4">ISO 42001 & Konzernstrukturen</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-600 font-light">
                                    <Layers className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" /> Portfolio Intelligence Dashboard
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600 font-light">
                                    <Layers className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" /> Whitelabel Proof-Packs
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-600 font-light">
                                    <Layers className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" /> Unbegrenzte Systeme & User
                                </li>
                            </ul>
                            <button onClick={() => window.location.href = "mailto:sales@eukigesetz.com"} className="w-full py-3 text-xs font-medium text-slate-700 bg-transparent hover:bg-slate-50 border border-slate-200 transition-colors">Sales kontaktieren</button>
                        </div>

                    </div>

                    <div className="mt-8 flex flex-col md:flex-row justify-between items-center bg-slate-50 border border-slate-200 rounded-sm p-8">
                        <div className="flex items-center gap-5 mb-4 md:mb-0">
                            <div className="w-12 h-12 border border-slate-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
                                <Award className="w-5 h-5 text-blue-900" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-slate-900">Certified Officer Ausbildung</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">Werden Sie zertifizierter AI-Prüfer. Inklusive Mandanten-Workspaces und dauerhaft 20% Rabatt auf alle Software-Module des Registers.</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                            <div className="text-right mb-2">
                                <span className="block text-xl font-serif text-slate-900">995 €</span>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Einmalgebühr</span>
                            </div>
                            <button onClick={() => window.location.href = "https://eukigesetz.com"} className="text-xs font-medium text-blue-900 flex items-center gap-1 hover:text-blue-700 transition-colors">
                                Spezifikation prüfen <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* The Freemium Reminder */}
                    <div className="mt-8 text-center border-t border-slate-100 pt-8">
                        <p className="text-xs text-slate-500 font-light">
                            Auch ohne laufende Steuerungskosten: Die reine Basis-Dokumentation (Freemium) jedes KI-Einsatzfalls bleibt <strong className="font-medium">dauerhaft kostenlos</strong>.
                        </p>
                    </div>

                </div>

            </main>

            <footer className="border-t border-slate-200 py-12 bg-white text-center text-xs text-slate-400 font-mono relative z-10">
                &copy; {new Date().getFullYear()} EUKI Gesetz. Governance Control System.
            </footer>
        </div>
    );
}
