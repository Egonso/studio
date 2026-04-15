
'use client';

import { useEffect, useState, Fragment } from 'react';
import { APP_LOCALE } from '@/lib/locale';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { getSharedPolicy } from '@/lib/data-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Share2 } from 'lucide-react';
import { AppHeader } from '@/components/app-header';

interface SharedPolicy {
    id: string;
    title: string;
    content: string;
    placeholders: Record<string, string>;
    createdAt: any;
}

const renderPolicyContent = (content: string, placeholders: Record<string, string>) => {
    let filledContent = content;
    Object.entries(placeholders).forEach(([key, value]) => {
        if (value) {
            filledContent = filledContent.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
        }
    });

    const lines = filledContent.split('\n');
    let listItems: JSX.Element[] = [];
    const groupedLines: (JSX.Element | string)[] = [];

    lines.forEach((line, index) => {
        const uniqueKey = `line-${index}`;
        if (line.trim() === '') {
            if (listItems.length > 0) {
                groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
                listItems = [];
            }
            groupedLines.push(<br key={uniqueKey} />);
        } else if (line.startsWith('---')) {
            if (listItems.length > 0) {
                groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
                listItems = [];
            }
            groupedLines.push(<hr key={uniqueKey} className="my-4" />);
        } else if (line.startsWith('**')) {
            if (listItems.length > 0) {
                groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
                listItems = [];
            }
            groupedLines.push(<h3 key={uniqueKey} className="text-lg font-semibold mt-4">{line.replace(/\*\*/g, '')}</h3>);
        } else if (line.startsWith('− ') || line.match(/^\d\./) || line.startsWith('* ')) {
            const cleanedLine = line.replace(/^(− |\d\. |\* )/, '');
            const parts = cleanedLine.split(/(\*\*.*?\*\*)/g);
            listItems.push(<li key={uniqueKey}>{parts.map((part, partIndex) => part.startsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : <Fragment key={partIndex}>{part}</Fragment>)}</li>);
        } else {
            if (listItems.length > 0) {
                groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
                listItems = [];
            }
            const parts = line.split(/(\*\*.*?\*\*)/g);
            groupedLines.push(<p key={uniqueKey}>{parts.map((part, partIndex) => part.startsWith('**') ? <strong key={partIndex}>{part.slice(2, -2)}</strong> : <Fragment key={partIndex}>{part}</Fragment>)}</p>);
        }
    });

    if (listItems.length > 0) {
        groupedLines.push(<ul key={`ul-${groupedLines.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
    }

    return groupedLines;
};


export default function SharedPolicyPage() {
    const params = useParams() ?? {};
    const policyId = params.policyId as string;
    const [policy, setPolicy] = useState<SharedPolicy | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!policyId) {
            setError('Keine Richtlinien-ID gefunden.');
            setIsLoading(false);
            return;
        }

        const fetchPolicy = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getSharedPolicy(policyId);
                if (data) {
                    setPolicy(data as SharedPolicy);
                } else {
                    setError('Die angeforderte Richtlinie konnte nicht gefunden werden. Der Link ist möglicherweise veraltet.');
                }
            } catch (e) {
                console.error(e);
                setError('Beim Laden der Richtlinie ist ein Fehler aufgetreten.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPolicy();
    }, [policyId]);

    return (
        <div className="flex flex-col min-h-screen bg-secondary/50">
            <AppHeader />
            <main className="flex-1 flex flex-col items-center p-4 md:p-8">
                <div className="w-full max-w-3xl">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
                                        <Share2 />
                                        Geteilte KI-Richtlinie
                                    </CardTitle>
                                    <CardDescription className="text-lg mt-2 max-w-4xl">
                                        Dieses Dokument wurde über den AI Act Compass geteilt.
                                    </CardDescription>
                                </div>
                                <Image src="/register-logo.png" alt="AI Governance Register Siegel" width={80} height={80} className="h-20 w-20 hidden md:block" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading && (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="ml-4">Lade Richtlinie...</p>
                                </div>
                            )}
                            {error && (
                                <div className="text-center py-20 text-red-600">
                                    <p>{error}</p>
                                </div>
                            )}
                            {policy && (
                                <div className="prose prose-sm max-w-none">
                                    <h2>{policy.title}</h2>
                                    {renderPolicyContent(policy.content, policy.placeholders)}
                                </div>
                            )}
                        </CardContent>
                        {policy && (
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">Geteilt am: {new Date(policy.createdAt?.toDate()).toLocaleString(APP_LOCALE)}</p>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
