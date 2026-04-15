import { cn } from '@/lib/utils';
import { LawData } from '@/types/law';

interface LawContentProps {
  data: LawData;
  locale: string;
}

function getLawContentCopy(locale: string) {
  if (locale === 'de') {
    return {
      title: 'EU AI Act (Verordnung (EU) 2024/1689)',
      preamble: 'Präambel (Erwägungsgründe)',
      enactingTerms: 'Normtext',
      annexes: 'Anhänge',
      directLink: 'Direktlink',
    } as const;
  }

  return {
    title: 'EU AI Act (Regulation (EU) 2024/1689)',
    preamble: 'Preamble (Recitals)',
    enactingTerms: 'Enacting Terms',
    annexes: 'Annexes',
    directLink: 'Direct link',
  } as const;
}

export function LawContent({ data, locale }: LawContentProps) {
  const copy = getLawContentCopy(locale);

  return (
    <div className="prose prose-slate max-w-none dark:prose-invert">
      <h1 className="mb-8 text-3xl font-bold">{copy.title}</h1>

      <section id="pbl_1" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold">{copy.preamble}</h2>
        <div className="space-y-6">
          {data.recitals.map((recital) => (
            <div
              key={recital.id}
              id={recital.id}
              className="scroll-mt-24 rounded-lg border border-transparent bg-muted/30 p-4 transition-colors hover:border-border"
            >
              <span className="mr-2 font-bold text-primary">
                ({recital.number})
              </span>
              <span>{recital.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="enc_1" className="mb-12">
        <h2 className="mb-4 text-2xl font-bold">{copy.enactingTerms}</h2>
        {data.chapters.map((chapter) => (
          <div key={chapter.id} id={chapter.id} className="mb-8 scroll-mt-24">
            <div className="sticky top-14 z-20 mb-6 border-b bg-background/95 py-4 shadow-sm backdrop-blur">
              <h3 className="text-xl font-bold">{chapter.title}</h3>
            </div>

            <div className="space-y-8">
              {chapter.articles.map((article) => {
                const displayTitle =
                  'title' in article && typeof article.title === 'string'
                    ? article.title
                    : article.id;
                const isLongTitle = displayTitle.length > 80;

                return (
                  <article
                    key={article.id}
                    id={article.id}
                    className="scroll-mt-28"
                  >
                    <div className="group relative rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:border-primary/20">
                      <h4
                        className={cn(
                          'mb-3 font-semibold text-primary',
                          isLongTitle ? 'text-base leading-snug' : 'text-lg',
                        )}
                      >
                        {displayTitle}
                      </h4>
                      <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                        {article.text}
                      </div>
                      <a
                        href={`#${article.id}`}
                        className="absolute top-4 right-4 opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                        title={copy.directLink}
                      >
                        #
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {data.annexes.length > 0 ? (
        <section id="annexes" className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">{copy.annexes}</h2>
          <div className="space-y-8">
            {data.annexes.map((annex) => (
              <div
                key={annex.id}
                id={annex.id}
                className="scroll-mt-24 rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="whitespace-pre-wrap">{annex.text}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
