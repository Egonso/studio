'use client';

import { useRouter } from 'next/navigation';
import { Layers, ShieldCheck, Award, ArrowUpRight, BarChart3, BookOpen, FileText, Users, Link as LinkIcon, History } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage2() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-slate-200">

            {/* Subtle Minimalist Background Texture (No Color Accent) */}
            <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden pointer-events-none opacity-[0.03] flex items-center justify-center">
                <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="w-[150%] h-full blur-[10px]">
                    <path d="M-50,200 Q400,0 700,250 T1200,150" fill="none" stroke="black" strokeWidth="80" strokeLinecap="round" />
                </svg>
            </div>

            <header className="px-6 py-8 flex justify-between items-center max-w-6xl mx-auto relative z-10 w-full border-b border-slate-200">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
                    <div className="relative">
                        <Image src="/register-logo.png" alt="EUKI Logo" width={28} height={28} className="dark:invert opacity-90 transition-transform group-hover:scale-105" />
                        {/* No colored accent here anymore */}
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-slate-800 uppercase">Governance Control Center</span>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="text-xs tracking-widest text-slate-500 hover:text-slate-900 transition-colors uppercase font-medium"
                >
                    Anmelden
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-24 pb-32 relative z-10">

                {/* HERO: Paid/Control Focus with pure typography and layout */}
                <div className="text-center space-y-12 mb-32">

                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 border-2 border-slate-900 rounded-lg flex items-center justify-center -rotate-3 bg-white shadow-sm">
                                <Image src="/register-logo.png" alt="EUKI Logo" width={32} height={32} className="dark:invert px-0.5" />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif text-slate-900 leading-tight tracking-tight">
                            Ihre KI-Infrastruktur.<br />
                            <span className="text-slate-500 italic font-light">Sicher gesteuert und auditiert.</span>
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
                            Die reine Basis-Dokumentation bleibt bei uns <strong className="font-medium text-slate-900 underline underline-offset-4 decoration-slate-300">immer kostenlos</strong>. Der Aufbau und die Pflege einer rechtskonformen KI-Governance nach EU AI Act und ISO 42001 ist jedoch eine immense administrative Belastung. Für Organisationen, die diese Prozesse ohne Excel-Chaos steuern müssen, liefert das Governance Control Center automatisierte Prüfzyklen und kontinuierliche Readiness.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition duration-500 pointer-events-none"></div>
                        <button
                            onClick={() => router.push('/einrichten')}
                            className="w-full sm:w-auto relative bg-slate-900 hover:bg-black text-white px-10 py-4 text-sm font-medium transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10"
                        >
                            <Layers className="w-4 h-4" /> Steuerung aktivieren
                        </button>
                    </div>
                </div>

                {/* THE "WHY UPGRADE" VALUE PROPOSITION - 6 Tiles */}
                <div className="mb-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center md:text-left">
                    <div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                        <BarChart3 className="w-5 h-5 text-slate-700 mb-4 mx-auto md:mx-0" />
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Automatisierte Reviews</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Intelligente Workflows erinnern Fachverantwortliche automatisch an anstehende Prüfungen. Nichts bleibt unkontrolliert.
                        </p>
                    </div>
                    <div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                        <BookOpen className="w-5 h-5 text-slate-700 mb-4 mx-auto md:mx-0" />
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Smart Policy Engine</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Verbinden Sie rechtliche Anforderungen und intern vorgegebene Richtlinien direkt mit Ihren KI-Systemen im zentralen Management.
                        </p>
                    </div>
                    <div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                        <History className="w-5 h-5 text-slate-700 mb-4 mx-auto md:mx-0" />
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Audit Trails & Historie</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Lückenlose Versionierung und Nachverfolgung aller Änderungen an KI-Einsatzfällen für offizielle Behördenüberprüfungen.
                        </p>
                    </div>
                    <div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                        <Users className="w-5 h-5 text-slate-700 mb-4 mx-auto md:mx-0" />
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Rollen- & Zugriffs-Konzept</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Granulare Berechtigungen für Fachbereiche (Read), IT-Admins (Edit) und das zentrale Management / DSBs (Approve).
                        </p>
                    </div>
                    <div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                        <LinkIcon className="w-5 h-5 text-slate-700 mb-4 mx-auto md:mx-0" />
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">External Vendor Verification</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Fordern Sie Compliance-Daten Ihrer Lieferanten ohne Account-Zwang direkt via sicherer Magic Links in das Register an.
                        </p>
                    </div>
                    <div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md transition-shadow">
                        <FileText className="w-5 h-5 text-slate-700 mb-4 mx-auto md:mx-0" />
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Portfolio Intelligence Exports</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Voller Echtzeit-Überblick über alle Systeme sowie One-Click-Export der Dokumentation in Behörden-konformen PDF/JSON-Formaten.
                        </p>
                    </div>
                </div>

                {/* PRICING TABLE: Volume-Based Differentiation Only */}
                <div className="border-t border-slate-200 pt-16">
                    <div className="mb-12 text-center">
                        <h2 className="text-sm font-semibold tracking-widest text-slate-900 uppercase">Voller Funktionsumfang in jedem Tarif</h2>
                        <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto">
                            Zahlen Sie nur für die Skalierung. Jeder Steuerungs-Tarif enthält alle Governance-Features.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200 bg-white rounded-md overflow-hidden shadow-sm">

                        {/* Starter */}
                        <div className="p-8 border-b md:border-b-0 md:border-r border-slate-200 hover:bg-slate-50 transition-colors flex flex-col">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Starter</h3>
                            <div className="text-4xl font-serif text-slate-900 mb-1">39 €<span className="text-sm text-slate-500 font-sans font-normal"> / Mo</span></div>
                            <p className="text-xs text-slate-500 mb-8 border-b border-slate-100 pb-4">Für kleine Teams</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                    <span className="w-8 text-right text-slate-400 mt-0.5 shrink-0">100</span> Use Cases
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                    <span className="w-8 text-right text-slate-400 mt-0.5 shrink-0">4</span> Auth User
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-400 font-light pt-2">
                                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" /> Alle Steuerungselemente
                                </li>
                            </ul>
                            <button onClick={() => router.push('/einrichten')} className="w-full py-3 text-xs font-medium text-slate-700 border border-slate-300 bg-transparent hover:bg-slate-100 transition-colors">Trial aktivieren</button>
                        </div>

                        {/* Pro - Highlighted in Monochrome */}
                        <div className="p-8 border-b md:border-b-0 md:border-r border-slate-200 relative bg-slate-900 text-white flex flex-col">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Pro</h3>
                            <div className="text-4xl font-serif text-white mb-1">99 €<span className="text-sm text-slate-400 font-sans font-normal"> / Mo</span></div>
                            <p className="text-xs text-slate-400 mb-8 border-b border-slate-700 pb-4">Für den Mittelstand</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-white font-medium">
                                    <span className="w-8 text-right text-slate-400 mt-0.5 shrink-0">500</span> Use Cases
                                </li>
                                <li className="flex items-start gap-3 text-sm text-white font-medium">
                                    <span className="w-8 text-right text-slate-400 mt-0.5 shrink-0">15</span> Auth User
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-400 font-light pt-2">
                                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" /> Alle Steuerungselemente
                                </li>
                            </ul>
                            <button onClick={() => router.push('/einrichten')} className="w-full py-3 text-xs font-medium text-slate-900 bg-white hover:bg-slate-200 transition-colors">Trial aktivieren</button>
                        </div>

                        {/* Premium */}
                        <div className="p-8 hover:bg-slate-50 transition-colors flex flex-col">
                            <h3 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Premium</h3>
                            <div className="text-4xl font-serif text-slate-900 mb-1">199 €<span className="text-sm text-slate-500 font-sans font-normal"> / Mo</span></div>
                            <p className="text-xs text-slate-500 mb-8 border-b border-slate-100 pb-4">Das volle Leistungsspektrum</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                    <span className="w-8 text-right text-slate-400 mt-0.5 shrink-0">1.000</span> Use Cases
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                    <span className="w-8 text-right text-slate-400 mt-0.5 shrink-0">100</span> Auth User
                                </li>
                                <li className="flex items-start gap-3 text-sm text-slate-400 font-light pt-2">
                                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" /> Alle Steuerungselemente
                                </li>
                            </ul>
                            <button onClick={() => router.push('/einrichten')} className="w-full py-3 text-xs font-medium text-slate-700 border border-slate-300 bg-transparent hover:bg-slate-100 transition-colors">Trial aktivieren</button>
                            <div className="mt-4 text-center">
                                <button onClick={() => window.location.href = "mailto:sales@kiregister.com"} className="text-[10px] text-slate-400 hover:text-slate-600 underline underline-offset-2">Darüber hinaus: Uns kontaktieren</button>
                            </div>
                        </div>

                    </div>

                    <div className="mt-8 flex flex-col md:flex-row justify-between items-center bg-slate-50 border border-slate-200 rounded-sm p-8">
                        <div className="flex items-center gap-5 mb-4 md:mb-0">
                            <div className="w-12 h-12 border border-slate-200 bg-white flex items-center justify-center shrink-0 shadow-sm">
                                <Award className="w-5 h-5 text-slate-800" />
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
                            <button onClick={() => window.location.href = "https://kiregister.com"} className="text-xs font-medium text-slate-800 flex items-center gap-1 hover:text-slate-600 transition-colors underline underline-offset-4">
                                Spezifikation prüfen <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                </div>

            </main>

            <footer className="border-t border-slate-200 py-12 bg-white text-center text-xs text-slate-400 font-mono relative z-10">
                &copy; {new Date().getFullYear()} EUKI Gesetz. Governance Control System.
            </footer>
        </div>
    );
}
