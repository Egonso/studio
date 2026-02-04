
'use client';

import React, { useState, useRef, useEffect } from 'react';
// Since we are using Genkit server actions, we'll call the flow directly as a server action if configured,
// or via a generic action wrapper. For this project context, I'll assume we can call the flow directly if we import it,
// OR use a utility to call it. 
// Given the project structure likely uses standard Genkit server actions:
import { callChatbotAction } from '@/ai/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Bot, User, Minimize2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface Message {
    role: 'user' | 'model' | 'system';
    content: string;
}

export function SiteChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', content: 'Hallo! Ich bin dein AI-Assistent für das EuKIGesetz Studio. Wie kann ich dir helfen?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
            // Call the Server Action wrapper
            const response = await callChatbotAction({
                messages: [...messages, userMsg],
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
        <Card className="fixed bottom-4 right-4 w-[350px] sm:w-[400px] h-[500px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-2 duration-300 border-primary/20">
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

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                    <div className="flex flex-col gap-3">
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
                                    {msg.content}
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
                        {/* Simple Legal Disclaimer Footer in chat */}
                        <div className="mt-4 text-[10px] text-center text-muted-foreground opacity-70">
                            Hinweis: AI-Antworten dienen nur zur Information und stellen keine Rechtsberatung dar.
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-3 border-t bg-background">
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
        </Card>
    );
}
