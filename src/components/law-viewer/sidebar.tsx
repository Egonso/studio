"use client";

import React, { useState, useEffect } from 'react';
import { LawData } from '@/types/law';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface LawSidebarProps {
    data: LawData;
    className?: string;
}

export function LawSidebar({ data, className }: LawSidebarProps) {
    const [activeId, setActiveId] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false); // Mobile sheet state

    // Simple scroll spy logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
        );
        const ids = [
            ...data.recitals.map(r => r.id),
            ...data.chapters.map(c => c.id),
            ...data.chapters.flatMap(c => c.articles.map(a => a.id))
        ];
        ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [data]);

    const scrollToElement = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        setIsOpen(false); // Close mobile menu on click
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 140; // Adjusted for double header (Main + Sticky Chapter)
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            window.history.pushState(null, '', `#${id}`);
        }
    };

    const NavContent = () => (
        <div className="space-y-6 py-4">
            <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">Präambel</h3>
                <ul className="space-y-1 text-sm">
                    <li>
                        <a
                            href="#pbl_1"
                            onClick={(e) => scrollToElement(e, 'pbl_1')}
                            className={cn("block px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50 truncate", activeId === 'pbl_1' ? "bg-muted font-medium text-primary" : "text-muted-foreground")}
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
                            <a href={`#${chapter.id}`} onClick={(e) => scrollToElement(e, chapter.id)} className={cn("block px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50 font-medium mb-1", activeId === chapter.id ? "bg-muted text-primary" : "text-foreground")} title={chapter.title}>
                                {chapter.title}
                            </a>
                            <ul className="pl-4 space-y-0.5 border-l ml-2">
                                {chapter.articles.map(article => {
                                    // Use extracted Title or fallback
                                    const label = article.title || article.id;
                                    // Shorten label if too long for sidebar
                                    const shortLabel = label.length > 40 ? label.substring(0, 37) + "..." : label;

                                    return (
                                        <li key={article.id}>
                                            <a href={`#${article.id}`} onClick={(e) => scrollToElement(e, article.id)} className={cn("block px-2 py-1 rounded-md transition-colors hover:bg-muted/50 text-xs truncate", activeId === article.id ? "bg-muted text-primary font-medium" : "text-muted-foreground")} title={label}>
                                                {shortLabel}
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
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <nav className={cn("hidden lg:block h-[calc(100vh-6rem)] overflow-y-auto pr-4 pb-10 sticky top-24 custom-scrollbar", className)}>
                <NavContent />
            </nav>

            {/* Mobile Trigger & Sheet */}
            <div className="lg:hidden fixed bottom-6 left-4 z-50">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button size="icon" className="rounded-full h-12 w-12 shadow-lg">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
                        <div className="h-full overflow-y-auto p-6">
                            <h2 className="font-bold text-lg mb-4">Inhaltsverzeichnis</h2>
                            <NavContent />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
