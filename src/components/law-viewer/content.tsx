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
                        {/* Increased z-index to 20 to stay above content but below AppHeader (z-50) */}
                        <div className="sticky top-14 bg-background/95 backdrop-blur py-4 z-20 border-b mb-6 shadow-sm">
                            <h3 className="text-xl font-bold">{chapter.title}</h3>
                        </div>

                        <div className="space-y-8">
                            {chapter.articles.map((article) => {
                                const displayTitle = (article as any).title || article.id;
                                // Check if title is very long (like Article 3 definitions), if so, style differently
                                const isLongTitle = displayTitle.length > 80;

                                return (
                                    <article key={article.id} id={article.id} className="scroll-mt-28">
                                        <div className="bg-card text-card-foreground p-6 rounded-xl shadow-sm border hover:border-primary/20 transition-colors relative group">
                                            {/* Handle long titles with clamp or different size */}
                                            <h4 className={cn(
                                                "font-semibold text-primary mb-3",
                                                isLongTitle ? "text-base leading-snug" : "text-lg"
                                            )}>
                                                {displayTitle}
                                            </h4>
                                            <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                                {article.text}
                                            </div>
                                            <a href={`#${article.id}`} className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 text-muted-foreground hover:text-primary transition-opacity" title="Direct Link">#</a>
                                        </div>
                                    </article>
                                );
                            })}
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
