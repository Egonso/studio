import { NextResponse } from 'next/server';

import { db } from '@/lib/firebase-admin';
import { captureException } from '@/lib/observability/error-tracking';
import {
  validateSupplierReminderOptOutToken,
} from '@/lib/register-first/supplier-invite-delivery';
import { parseSupplierInviteRecord } from '@/lib/register-first/supplier-invite-schema';

const INVITE_COLLECTION = 'registerSupplierInvites';

function renderHtml(title: string, message: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px 16px; }
      .panel { max-width: 640px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      p { line-height: 1.7; margin: 0; color: #475569; }
    </style>
  </head>
  <body>
    <main class="panel">
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const { inviteId } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  try {
    const inviteDoc = await db.collection(INVITE_COLLECTION).doc(inviteId).get();
    if (!inviteDoc.exists) {
      return new NextResponse(
        renderHtml(
          'Request not found',
          'The associated supplier request could not be found.',
        ),
        {
          status: 404,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        },
      );
    }

    const invite = parseSupplierInviteRecord(inviteDoc.data());
    const validation = validateSupplierReminderOptOutToken(token, inviteId);
    if (!validation.valid) {
      return new NextResponse(
        renderHtml(
          'Invalid link',
          'The unsubscribe link is invalid or has expired. Please contact the sender if you no longer wish to receive reminders.',
        ),
        {
          status: 400,
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        },
      );
    }

    if (!invite.reminderOptOut) {
      await db.collection(INVITE_COLLECTION).doc(inviteId).update({
        reminderOptOut: true,
        reminderOptOutAt: new Date().toISOString(),
      });
    }

    return new NextResponse(
      renderHtml(
        'Reminders stopped',
        `Automatic reminders for this request will no longer be sent to ${invite.intendedEmail}.`,
      ),
      {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      },
    );
  } catch (error) {
    captureException(error, {
      boundary: 'app',
      component: 'supplier-invite-reminder-opt-out',
      route: `/api/supplier-invite/${inviteId}/opt-out`,
    });
    return new NextResponse(
      renderHtml(
        'Error',
        'The unsubscribe request could not be processed. Please try again later.',
      ),
      {
        status: 500,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      },
    );
  }
}
