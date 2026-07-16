'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trackProductFunnelEvent } from '@/lib/analytics/product-funnel-client';
import { registerFirstFlags } from '@/lib/register-first/flags';

interface CourseActivationReceiptProps {
  certificateCode: string;
}

export function CourseActivationReceipt({
  certificateCode,
}: CourseActivationReceiptProps) {
  if (!registerFirstFlags.courseActivationHandoff) return null;

  return (
    <section
      aria-labelledby="course-activation-title"
      className="border border-slate-200 bg-white px-5 py-5 sm:px-6"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Kursabschluss dokumentiert
          </p>
          <h3
            id="course-activation-title"
            className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
          >
            Übertragen Sie das Gelernte jetzt auf einen realen KI-Einsatzfall.
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Das private Kurszertifikat mit dem Code {certificateCode} dokumentiert
            Teilnahme und bestandene Prüfung. Der nächste separate Schritt ist die
            Erfassung eines konkreten Einsatzfalls mit Zweck, System und
            verantwortlicher Rolle. Eine menschliche Prüfung bleibt erforderlich.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link
                href="/capture?source=training_completion"
                onClick={() => {
                  void trackProductFunnelEvent({
                    eventName: 'first_use_case_cta_clicked',
                    payload: { source: 'training_completion' },
                    context: { source: 'training_completion' },
                  });
                }}
              >
                Ersten KI-Einsatzfall erfassen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/my-register">Register öffnen</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
