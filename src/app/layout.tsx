
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  title: 'AI Act Compass',
  description: 'Navigate EU AI Act compliance with confidence. Get status checks, parameter configuration, and AI-powered advice for your SME.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11
  const year = currentDate.getFullYear();
  
  let quarterEndMonth;
  if (currentMonth < 3) { // Q1 (Jan-Mar)
      quarterEndMonth = 3;
  } else if (currentMonth < 6) { // Q2 (Apr-Jun)
      quarterEndMonth = 6;
  } else if (currentMonth < 9) { // Q3 (Jul-Sep)
      quarterEndMonth = 9;
  } else { // Q4 (Oct-Dec)
      quarterEndMonth = 12;
  }

  const month = quarterEndMonth.toString().padStart(2, '0');
  const formattedDate = `${month}/${year}`;

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <AuthProvider>
            {children}
            <Toaster />
            <footer className="p-4 md:p-6 border-t bg-background text-gray-600">
                <div className="max-w-4xl mx-auto">
                     <Alert variant="default" className="bg-secondary border-secondary-foreground/10">
                        <Terminal className="h-4 w-4" />
                        <AlertDescription className='text-xs text-muted-foreground'>
                            <b>Hinweis zur Datennutzung:</b> Die in dieser Anwendung eingegebenen Informationen werden zur Bereitstellung der Funktionalität auf Servern gespeichert und zur Generierung von Inhalten an KI-Modelle von Google (Gemini) gesendet. Laden Sie keine sensiblen oder personenbezogenen Daten hoch, die einer besonderen Geheimhaltung unterliegen. Diese Anwendung ist ein Prototyp und stellt keine Rechtsberatung dar.
                        </AlertDescription>
                    </Alert>
                    <p className="text-xs text-muted-foreground mt-4">&copy; 2024 AI Act Compass aktualisiert {formattedDate}. Alle Rechte vorbehalten.</p>
                </div>
            </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
