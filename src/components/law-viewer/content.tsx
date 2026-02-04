import React from 'react';
import { LawData, Chapter, Article, Recital } from '@/types/law';
import { cn } from '@/lib/utils'; // Assuming cn utility exists, otherwise I'll use template literals

interface LawContentProps {
    data: LawData;
}

export function LawContent({ data }: LawContentProps) {
    return (
        <div className="prose prose-slate max-w-none dark:prose-invert">
            <h1 className="text-3xl font-bold mb-8">EU AI Act (EU-KI-Verordnung)</h1>

            <section id="pbl_1" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Präambel (Erwägungsgründe)</h2>
                <div className="space-y-6">
                    {data.recitals.map((recital) => (
                        <div key={recital.id} id={recital.id} className="scroll-mt-24 p-4 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
                            <span className="font-bold text-primary mr-2">({recital.number})</span>
                            <span>{recital.text}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section id="enc_1" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Verfügender Teil</h2>
                {data.chapters.map((chapter) => (
                    <div key={chapter.id} id={chapter.id} className="mb-8 scroll-mt-24">
                        <h3 className="text-xl font-bold mb-4 sticky top-16 bg-background/95 backdrop-blur py-2 z-10 border-b">
                            {chapter.title}
                        </h3>
                        <div className="space-y-8">
                            {chapter.articles.map((article) => (
                                <article key={article.id} id={article.id} className="scroll-mt-24">
                                    {/* We might want to parse the text to extract the Title if it's strictly formatted, 
                       but for now displaying full extracted text is safer. 
                       Usually the text starts with "Artikel X Title..." */}
                                    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border">
                                        <div className="whitespace-pre-wrap">{article.text}</div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {data.annexes.length > 0 && (
                <section id="annexes" className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Anhänge</h2>
                    <div className="space-y-8">
                        {data.annexes.map((annex) => (
                            <div key={annex.id} id={annex.id} className="scroll-mt-24 bg-card p-6 rounded-xl shadow-sm border">
                                <div className="whitespace-pre-wrap">{annex.text}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
