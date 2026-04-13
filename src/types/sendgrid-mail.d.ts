declare module '@sendgrid/mail' {
  export interface MailDataRequired {
    to: string;
    from: string;
    templateId?: string;
    replyTo?: string;
    dynamicTemplateData?: Record<string, unknown>;
  }

  export function setApiKey(apiKey: string): void;
  export function send(data: MailDataRequired): Promise<unknown>;
}
