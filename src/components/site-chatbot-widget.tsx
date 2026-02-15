'use client';

import React, { useState, useRef, useEffect } from 'react';
// Since we are using Genkit server actions, we'll call the flow directly as a server action if configured,
// or via a generic action wrapper. For this project context, I'll assume we can call the flow directly if we import it,
// OR use a utility to call it. 
// Given the project structure likely uses standard Genkit server actions:
import { callChatbotAction } from '@/ai/actions';
import { submitFeedback } from '@/app/actions/feedback';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Bot, User, Minimize2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Message {
    role: 'user' | 'model' | 'system';
    content: string;
}

export function SiteChatbotWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: 'Hallo! Ich bin dein AI-Assistent für das EuKIGesetz Studio. Wie kann ich dir helfen?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Feedback State
    const [feedbackType, setFeedbackType] = useState('feature'); // feature, bug, support
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackSent, setFeedbackSent] = useState(false);

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            // Need to target the viewport inside scroll area usually, or just the div
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Filter out the initial greeting if it's the first message and from model
            // The API expects either strict (user-first) or handles system separately.
            // Safe bet: Only send user/model conversation history, starting with a user message if possible.
            // Or better: Just allow the server to filter. But the error "First content should be with role 'user'" comes from the Genkit client likely validating.

            const historyToSend = [...messages, userMsg].filter((m, i) => {
                // Filter out initial model message if it's "Hallo!..."
                if (i === 0 && m.role === 'model') return false;
                return true;
            });

            // Call the Server Action wrapper
            const response = await callChatbotAction({
                messages: historyToSend,
                currentPath: pathname
            });

            if (!response.success) {
                throw new Error(response.error);
            }

            const result = response.data;

            // Check for navigation command
            let responseText = result || '';

            // Basic parsing for the [NAVIGATE:/path] marker we added in the flow
            const navMatch = responseText.match(/\[NAVIGATE:(.*?)\]/);
            if (navMatch) {
                const path = navMatch[1];
                responseText = responseText.replace(navMatch[0], '').trim(); // Remove marker from visible text

                // Execute Navigation
                console.log("Chatbot navigating to:", path);
                router.push(path);
            }

            const modelMsg: Message = { role: 'model', content: responseText };
            setMessages(prev => [...prev, modelMsg]);

        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { role: 'model', content: 'Entschuldigung, es ist ein Fehler aufgetreten.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSendFeedback = async () => {
        if (!feedbackText.trim()) return;

        try {
            const res = await submitFeedback({
                type: feedbackType as any,
                message: feedbackText,
                path: pathname,
                userEmail: user?.email || '',
                userId: user?.uid,
                metadata: { userAgent: navigator.userAgent }
            });

            if (res.success) {
                setFeedbackSent(true);
                setTimeout(() => {
                    setFeedbackText('');
                    setFeedbackSent(false); // Reset after delay
                }, 2000);
            } else {
                console.error("Feedback submission failed:", res.error);
            }
        } catch (error) {
            console.error("Feedback error:", error);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 p-0 bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
            >
                <MessageCircle className="h-8 w-8 text-primary-foreground" />
                <span className="sr-only">Chatbot öffnen</span>
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-4 right-4 w-[350px] sm:w-[400px] h-[550px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-2 duration-300 border-primary/20">
            <CardHeader className="p-3 border-b flex flex-row items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1 rounded-full">
                        <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-sm font-medium">EuKIGesetz Assistant</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                    <Minimize2 className="h-4 w-4" />
                    <span className="sr-only">Minimieren</span>
                </Button>
            </CardHeader>

            <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 pt-2">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="chat">Chat</TabsTrigger>
                        <TabsTrigger value="support">Support & Feedback</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden p-0 m-0 data-[state=inactive]:hidden text-sm">
                    <CardContent className="flex-1 p-0 overflow-hidden relative">
                        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                            <div className="flex flex-col gap-3 pb-4">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                                            }`}
                                    >
                                        <div className={`
                        p-2 text-sm rounded-lg shadow-sm
                        ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                : 'bg-muted text-foreground rounded-tl-none border'}
                        `}>
                                            {msg.role === 'model' ? (
                                                // Render with citation links
                                                (() => {
                                                    const parts = msg.content.split(/(\[\[(?:Art\.|Erw\.)\s*\d+\]\])/g);
                                                    return (
                                                        <span className="whitespace-pre-wrap">
                                                            {parts.map((part, i) => {
                                                                const matchArt = part.match(/\[\[Art\.\s*(\d+)\]\]/);
                                                                const matchRec = part.match(/\[\[Erw\.\s*(\d+)\]\]/);

                                                                if (matchArt) {
                                                                    const num = matchArt[1];
                                                                    return (
                                                                        <a
                                                                            key={i}
                                                                            href={`/gesetz#art_${num}`}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                router.push(`/gesetz#art_${num}`);
                                                                            }}
                                                                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                                        >
                                                                            {part.replace('[[', '').replace(']]', '')}
                                                                        </a>
                                                                    );
                                                                } else if (matchRec) {
                                                                    const num = matchRec[1];
                                                                    return (
                                                                        <a
                                                                            key={i}
                                                                            href={`/gesetz#rct_${num}`}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                router.push(`/gesetz#rct_${num}`);
                                                                            }}
                                                                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                                        >
                                                                            {part.replace('[[', '').replace(']]', '')}
                                                                        </a>
                                                                    );
                                                                }
                                                                return part;
                                                            })}
                                                        </span>
                                                    );
                                                })()
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-2 self-start animate-pulse">
                                        <div className="bg-muted p-2 rounded-lg rounded-tl-none text-xs text-muted-foreground border">
                                            Tippt...
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4 text-[10px] text-center text-muted-foreground opacity-70">
                                    Hinweis: AI-Antworten dienen nur zur Information und stellen keine Rechtsberatung dar.
                                </div>
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <CardFooter className="p-3 border-t bg-background mt-auto">
                        <div className="flex w-full gap-2">
                            <Input
                                placeholder="Frag mich etwas..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1"
                                autoFocus
                            />
                            <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </TabsContent>

                <TabsContent value="support" className="flex-1 p-4 overflow-y-auto data-[state=inactive]:hidden">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-medium">Feedback & Support</h3>
                            <p className="text-xs text-muted-foreground">
                                Helfen Sie uns, EuKIGesetz Studio zu verbessern. Reichen Sie Feature-Wünsche ein oder melden Sie Fehler.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {['feature', 'bug', 'support'].map((type) => (
                                <Button
                                    key={type}
                                    variant={feedbackType === type ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFeedbackType(type)}
                                    className="capitalize"
                                >
                                    {type === 'feature' ? 'Feature' : type === 'bug' ? 'Bug' : 'Hilfe'}
                                </Button>
                            ))}
                        </div>

                        <Textarea
                            placeholder={
                                feedbackType === 'feature' ? "Ich wünsche mir..." :
                                    feedbackType === 'bug' ? "Hier funktioniert etwas nicht..." :
                                        "Ich brauche Hilfe bei..."
                            }
                            className="min-h-[120px]"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                        />

                        {feedbackSent ? (
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-3 rounded-md text-sm text-center font-medium">
                                Danke! Wir haben deine Nachricht erhalten.
                            </div>
                        ) : (
                            <Button className="w-full" onClick={handleSendFeedback} disabled={!feedbackText.trim()}>
                                Absenden
                            </Button>
                        )}

                        <div className="mt-6 pt-6 border-t">
                            <h4 className="font-medium text-sm mb-2">Roadmap & Status</h4>
                            <p className="text-xs text-muted-foreground mb-2">
                                Sehen Sie, woran wir gerade arbeiten. (Admin-Center Link coming soon)
                            </p>
                            <div className="space-y-2">
                                <div className="text-xs flex justify-between items-center bg-muted p-2 rounded">
                                    <span>Gesetz-Viewer Mobile</span>
                                    <span className="text-green-600 font-bold bg-green-100 dark:bg-green-900 px-1.5 rounded">Live</span>
                                </div>
                                <div className="text-xs flex justify-between items-center bg-muted p-2 rounded">
                                    <span>Deep-Linking Zitate</span>
                                    <span className="text-blue-600 font-bold bg-blue-100 dark:bg-blue-900 px-1.5 rounded">In Arbeit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
