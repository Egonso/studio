"use client";

import React, { useState, useEffect } from 'react';
import { LawData } from '@/types/law';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LawSidebarProps {
    data: LawData;
}

export function LawSidebar({ data }: LawSidebarProps) {
    const [activeId, setActiveId] = useState<string>("");

    // Simple scroll spy (could be optimized)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-10% 0px -80% 0px', // Trigger when element is near top
                threshold: 0
            }
        );

        const ids = [
            ...data.recitals.map(r => r.id),
            ...data.chapters.map(c => c.id),
            ...data.chapters.flatMap(c => c.articles.map(a => a.id))
        ];

        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [data]);

    const scrollToElement = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            // Adjust for fixed header
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });

            // Update URL without jump
            window.history.pushState(null, '', `#${id}`);
        }
    };

    return (
        <nav className="h-[calc(100vh-6rem)] overflow-y-auto pr-4 pb-10 sticky top-24 custom-scrollbar">
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">Präambel</h3>
                    <ul className="space-y-1 text-sm">
                        <li>
                            <a
                                href="#pbl_1"
                                onClick={(e) => scrollToElement(e, 'pbl_1')}
                                className={cn(
                                    "block px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50 truncate",
                                    activeId === 'pbl_1' ? "bg-muted font-medium text-primary" : "text-muted-foreground"
                                )}
                            >
                                Erwägungsgründe (1-{data.recitals.length})
                            </a>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">Verfügender Teil</h3>
                    <div className="space-y-4">
                        {data.chapters.map((chapter) => (
                            <div key={chapter.id}>
                                <a
                                    href={`#${chapter.id}`}
                                    onClick={(e) => scrollToElement(e, chapter.id)}
                                    className={cn(
                                        "block px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50 font-medium mb-1",
                                        activeId === chapter.id ? "bg-muted text-primary" : "text-foreground"
                                    )}
                                    title={chapter.title}
                                >
                                    {chapter.title}
                                </a>
                                {/* Only show articles if this chapter is somewhat active or expanded? 
                           For now show all but small */}
                                <ul className="pl-4 space-y-0.5 border-l ml-2">
                                    {chapter.articles.map(article => {
                                        // Try to extract "Artikel X" for the label
                                        const match = article.text.match(/Artikel\s+\d+/i);
                                        const label = match ? match[0] : article.id;
                                        return (
                                            <li key={article.id}>
                                                <a
                                                    href={`#${article.id}`}
                                                    onClick={(e) => scrollToElement(e, article.id)}
                                                    className={cn(
                                                        "block px-2 py-1 rounded-md transition-colors hover:bg-muted/50 text-xs truncate",
                                                        activeId === article.id ? "bg-muted text-primary font-medium" : "text-muted-foreground"
                                                    )}
                                                    title={article.text.substring(0, 100)} // Tooltip with start of text
                                                >
                                                    {label}
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
