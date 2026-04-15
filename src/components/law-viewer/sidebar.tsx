'use client';

import { useEffect, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LawData } from '@/types/law';

interface LawSidebarProps {
  data: LawData;
  locale: string;
  className?: string;
}

function getLawSidebarCopy(locale: string) {
  if (locale === 'de') {
    return {
      preamble: 'Präambel',
      recitals: `Erwägungsgründe (1-{count})`,
      enactingTerms: 'Normtext',
      tableOfContents: 'Inhaltsverzeichnis',
    } as const;
  }

  return {
    preamble: 'Preamble',
    recitals: `Recitals (1-{count})`,
    enactingTerms: 'Enacting Terms',
    tableOfContents: 'Table of Contents',
  } as const;
}

export function LawSidebar({ data, locale, className }: LawSidebarProps) {
  const copy = useMemo(() => getLawSidebarCopy(locale), [locale]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 },
    );

    const ids = [
      ...data.recitals.map((recital) => recital.id),
      ...data.chapters.map((chapter) => chapter.id),
      ...data.chapters.flatMap((chapter) =>
        chapter.articles.map((article) => article.id),
      ),
    ];

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [data]);

  const scrollToElement = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    setIsOpen(false);

    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  const NavContent = () => (
    <div className="space-y-6 py-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {copy.preamble}
        </h3>
        <ul className="space-y-1 text-sm">
          <li>
            <a
              href="#pbl_1"
              onClick={(event) => scrollToElement(event, 'pbl_1')}
              className={cn(
                'block truncate rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50',
                activeId === 'pbl_1'
                  ? 'bg-muted font-medium text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {copy.recitals.replace('{count}', String(data.recitals.length))}
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {copy.enactingTerms}
        </h3>
        <div className="space-y-4">
          {data.chapters.map((chapter) => (
            <div key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                onClick={(event) => scrollToElement(event, chapter.id)}
                className={cn(
                  'mb-1 block rounded-md px-2 py-1.5 font-medium transition-colors hover:bg-muted/50',
                  activeId === chapter.id
                    ? 'bg-muted text-primary'
                    : 'text-foreground',
                )}
                title={chapter.title}
              >
                {chapter.title}
              </a>
              <ul className="ml-2 space-y-0.5 border-l pl-4">
                {chapter.articles.map((article) => {
                  const label =
                    'title' in article && typeof article.title === 'string'
                      ? article.title
                      : article.id;
                  const shortLabel =
                    label.length > 40 ? `${label.substring(0, 37)}...` : label;

                  return (
                    <li key={article.id}>
                      <a
                        href={`#${article.id}`}
                        onClick={(event) => scrollToElement(event, article.id)}
                        className={cn(
                          'block truncate rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted/50',
                          activeId === article.id
                            ? 'bg-muted font-medium text-primary'
                            : 'text-muted-foreground',
                        )}
                        title={label}
                      >
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
      <nav
        className={cn(
          'custom-scrollbar sticky top-24 hidden h-[calc(100vh-6rem)] overflow-y-auto pr-4 pb-10 lg:block',
          className,
        )}
      >
        <NavContent />
      </nav>

      <div className="fixed bottom-6 left-4 z-50 lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] p-0 sm:w-[350px]">
            <div className="h-full overflow-y-auto p-6">
              <h2 className="mb-4 text-lg font-bold">{copy.tableOfContents}</h2>
              <NavContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
