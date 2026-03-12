
import Link from 'next/link';

const WHITEPAPER_HREF = '/downloads/KIregister_Whitepaper_EU_AI_Act.pdf';

export function Footer() {
    return (
        <footer className="border-t bg-background text-muted-foreground w-full">
            <div className="container mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8">
                    <span>&copy; {new Date().getFullYear()} KI-Register by ZukunftBilden GmbH & BewusstseinBilden UG</span>
                    <span>Alle Nutzerdaten im KI-Register bleiben in der EU.</span>
                </div>

                <div className="flex items-center gap-6">
                    <Link
                        href="/downloads"
                        className="hover:text-foreground transition-colors"
                    >
                        Downloads
                    </Link>
                    <a
                        href={WHITEPAPER_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                    >
                        Whitepaper
                    </a>
                    <Link
                        href="/impressum"
                        className="hover:text-foreground transition-colors"
                    >
                        Impressum
                    </Link>
                    <Link
                        href="/datenschutz"
                        className="hover:text-foreground transition-colors"
                    >
                        Datenschutz
                    </Link>
                    <Link
                        href="/agb"
                        className="hover:text-foreground transition-colors"
                    >
                        AGB
                    </Link>
                </div>
            </div>
        </footer>
    );
}
