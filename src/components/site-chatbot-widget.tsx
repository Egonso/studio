'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, MessageCircle, Minimize2, Send } from 'lucide-react';

import { callChatbotAction } from '@/ai/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { localizeHref } from '@/lib/i18n/localize-href';

interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
}

type FeedbackType = 'feature' | 'bug' | 'support';

function getSiteChatbotCopy(locale: string) {
  if (locale === 'de') {
    return {
      greeting:
        'Hallo. Ich helfe dir bei KI Register, Fragen zur Plattform und beim Einreichen von Ideen, Fehlern oder Support-Anliegen.',
      sendError: 'Entschuldigung, es ist ein Fehler aufgetreten.',
      feedbackSubmitError: 'Feedback konnte nicht gesendet werden.',
      feedbackRetryError:
        'Feedback konnte nicht gesendet werden. Bitte später erneut versuchen.',
      openAssistant: 'Assistant öffnen',
      title: 'KI Register Assistant',
      minimize: 'Minimieren',
      chat: 'Chat',
      support: 'Support',
      typing: 'Tippt…',
      disclaimer:
        'Hinweis: AI-Antworten dienen nur zur Information und stellen keine Rechtsberatung dar.',
      inputPlaceholder: 'Frag mich etwas…',
      supportTitle: 'Feedback, Ideen und Support',
      supportDescription:
        'Reiche hier Ideen ein, melde Fehler oder stelle eine Support-Anfrage. Alles läuft bewusst an einem Ort zusammen.',
      feedbackLabels: {
        feature: 'Feature',
        bug: 'Bug',
        support: 'Hilfe',
      },
      feedbackPlaceholders: {
        feature: 'Ich wünsche mir…',
        bug: 'Hier funktioniert etwas nicht…',
        support: 'Ich brauche Hilfe bei…',
      },
      thanks: 'Danke! Wir haben deine Nachricht erhalten.',
      sending: 'Sende…',
      submit: 'Absenden',
    } as const;
  }

  return {
    greeting:
      'Hello. I can help with AI Registry, questions about the platform, and submitting ideas, bugs or support requests.',
    sendError: 'Sorry, something went wrong.',
    feedbackSubmitError: 'Feedback could not be sent.',
    feedbackRetryError:
      'Feedback could not be sent. Please try again later.',
    openAssistant: 'Open assistant',
    title: 'AI Registry Assistant',
    minimize: 'Minimise',
    chat: 'Chat',
    support: 'Support',
    typing: 'Typing…',
    disclaimer:
      'Note: AI responses are for information only and do not constitute legal advice.',
    inputPlaceholder: 'Ask me something…',
    supportTitle: 'Feedback, ideas and support',
    supportDescription:
      'Submit ideas here, report bugs or ask for support. Everything is intentionally kept in one place.',
    feedbackLabels: {
      feature: 'Feature',
      bug: 'Bug',
      support: 'Help',
    },
    feedbackPlaceholders: {
      feature: 'I would love to have…',
      bug: 'Something is not working here…',
      support: 'I need help with…',
    },
    thanks: 'Thanks! We received your message.',
    sending: 'Sending…',
    submit: 'Send',
  } as const;
}

export function SiteChatbotWidget() {
  const { user } = useAuth();
  const locale = useLocale();
  const copy = useMemo(() => getSiteChatbotCopy(locale), [locale]);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'model', content: copy.greeting },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feature');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? undefined;
  const router = useRouter();
  const floatingInsetStyles: CSSProperties = isMobile
    ? {
        bottom: 'calc(0.5rem + var(--safe-area-bottom))',
        left: 'calc(0.5rem + var(--safe-area-left))',
        right: 'calc(0.5rem + var(--safe-area-right))',
      }
    : {
        bottom: 'calc(1rem + var(--safe-area-bottom))',
        right: 'calc(1rem + var(--safe-area-right))',
      };

  useEffect(() => {
    setMessages((current) => {
      if (
        current.length === 1 &&
        current[0]?.role === 'model'
      ) {
        return [{ role: 'model', content: copy.greeting }];
      }

      return current;
    });
  }, [copy.greeting]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]',
      );

      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyToSend = [...messages, userMsg].filter((message, index) => {
        if (index === 0 && message.role === 'model') {
          return false;
        }

        return true;
      });

      const response = await callChatbotAction({
        messages: historyToSend,
        currentPath: pathname,
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      let responseText = response.data || '';
      const navMatch = responseText.match(/\[NAVIGATE:(.*?)\]/);

      if (navMatch) {
        const path = navMatch[1];
        responseText = responseText.replace(navMatch[0], '').trim();
        router.push(localizeHref(locale, path));
      }

      setMessages((prev) => [...prev, { role: 'model', content: responseText }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [...prev, { role: 'model', content: copy.sendError }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;

    setFeedbackError('');
    setIsSendingFeedback(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackText,
          path: pathname,
          userEmail: user?.email || '',
          userId: user?.uid,
          metadata: { userAgent: navigator.userAgent },
        }),
      });
      const payload = await res.json().catch(() => ({}));

      if (res.ok && payload?.success) {
        setFeedbackSent(true);
        setTimeout(() => {
          setFeedbackText('');
          setFeedbackSent(false);
        }, 2000);
      } else {
        const message = payload?.error || copy.feedbackSubmitError;
        setFeedbackError(message);
        console.error('Feedback submission failed:', message);
      }
    } catch (error) {
      console.error('Feedback error:', error);
      setFeedbackError(copy.feedbackRetryError);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        className="fixed z-50 h-10 w-10 rounded-full bg-muted p-0 shadow-sm transition-transform hover:scale-105 hover:bg-muted/80"
        style={floatingInsetStyles}
      >
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <span className="sr-only">{copy.openAssistant}</span>
      </Button>
    );
  }

  return (
    <Card
      className="fixed z-50 flex flex-col overflow-hidden border-primary/20 shadow-2xl animate-in slide-in-from-bottom-2 duration-300"
      style={{
        ...floatingInsetStyles,
        height: isMobile ? 'min(72dvh, 34rem)' : '550px',
        width: isMobile
          ? 'auto'
          : 'min(400px, calc(100vw - 2rem - var(--safe-area-left) - var(--safe-area-right)))',
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-1">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-sm font-medium">{copy.title}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsOpen(false)}
        >
          <Minimize2 className="h-4 w-4" />
          <span className="sr-only">{copy.minimize}</span>
        </Button>
      </CardHeader>

      <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">{copy.chat}</TabsTrigger>
            <TabsTrigger value="support">{copy.support}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="chat"
          className="m-0 flex flex-1 flex-col overflow-hidden p-0 text-sm data-[state=inactive]:hidden"
        >
          <CardContent className="relative flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              <div className="flex flex-col gap-3 pb-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex max-w-[85%] gap-2 ${
                      msg.role === 'user'
                        ? 'self-end flex-row-reverse'
                        : 'self-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg p-2 text-sm shadow-sm ${
                        msg.role === 'user'
                          ? 'rounded-tr-none bg-primary text-primary-foreground'
                          : 'rounded-tl-none border bg-muted text-foreground'
                      }`}
                    >
                      {msg.role === 'model'
                        ? (() => {
                            const parts = msg.content.split(
                              /(\[\[(?:Art\.|Erw\.)\s*\d+\]\])/g,
                            );

                            return (
                              <span className="whitespace-pre-wrap">
                                {parts.map((part, i) => {
                                  const matchArt = part.match(
                                    /\[\[Art\.\s*(\d+)\]\]/,
                                  );
                                  const matchRec = part.match(
                                    /\[\[Erw\.\s*(\d+)\]\]/,
                                  );

                                  if (matchArt) {
                                    const num = matchArt[1];
                                    const href = localizeHref(
                                      locale,
                                      `/law#art_${num}`,
                                    );

                                    return (
                                      <a
                                        key={i}
                                        href={href}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          router.push(href);
                                        }}
                                        className="font-medium text-gray-600 hover:underline dark:text-gray-400"
                                      >
                                        {part.replace('[[', '').replace(']]', '')}
                                      </a>
                                    );
                                  }

                                  if (matchRec) {
                                    const num = matchRec[1];
                                    const href = localizeHref(
                                      locale,
                                      `/law#rct_${num}`,
                                    );

                                    return (
                                      <a
                                        key={i}
                                        href={href}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          router.push(href);
                                        }}
                                        className="font-medium text-gray-600 hover:underline dark:text-gray-400"
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
                        : msg.content}
                    </div>
                  </div>
                ))}
                {isLoading ? (
                  <div className="flex animate-pulse gap-2 self-start">
                    <div className="rounded-lg rounded-tl-none border bg-muted p-2 text-xs text-muted-foreground">
                      {copy.typing}
                    </div>
                  </div>
                ) : null}
                <div className="mt-4 text-center text-[10px] text-muted-foreground opacity-70">
                  {copy.disclaimer}
                </div>
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="mt-auto border-t bg-background p-3">
            <div className="flex w-full gap-2">
              <Input
                placeholder={copy.inputPlaceholder}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
                autoFocus
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </TabsContent>

        <TabsContent
          value="support"
          className="flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">{copy.supportTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {copy.supportDescription}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['feature', 'bug', 'support'] as const).map((type) => (
                <Button
                  key={type}
                  variant={feedbackType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackType(type)}
                  className="capitalize"
                >
                  {copy.feedbackLabels[type]}
                </Button>
              ))}
            </div>

            <Textarea
              placeholder={copy.feedbackPlaceholders[feedbackType]}
              className="min-h-[120px]"
              value={feedbackText}
              onChange={(event) => {
                setFeedbackText(event.target.value);
                if (feedbackError) setFeedbackError('');
              }}
            />

            {feedbackError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {feedbackError}
              </div>
            ) : null}

            {feedbackSent ? (
              <div className="rounded-md bg-gray-100 p-3 text-center text-sm font-medium text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                {copy.thanks}
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleSendFeedback}
                disabled={isSendingFeedback || !feedbackText.trim()}
              >
                {isSendingFeedback ? copy.sending : copy.submit}
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
