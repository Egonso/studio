
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t bg-background text-muted-foreground w-full">
            <div className="container mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-8">
                    <span>&copy; {new Date().getFullYear()} AI Governance Control by ZukunftBilden GmbH & BewusstseinBilden UG</span>
                </div>

                <div className="flex items-center gap-6">
                    <Link
                        href="/downloads"
                        className="hover:text-foreground transition-colors"
                    >
                        Downloads
                    </Link>
                    <a
                        href="https://eukigesetz.com/impressum"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                    >
                        Impressum
                    </a>
                    <a
                        href="https://eukigesetz.com/datenschutz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                    >
                        Datenschutz
                    </a>
                    <a
                        href="https://eukigesetz.com/agb"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                    >
                        AGB
                    </a>
                </div>
            </div>
        </footer>
    );
}
