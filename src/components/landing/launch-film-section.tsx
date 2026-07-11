'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import type {
  LandingVideoEvent,
  LandingVideoLocale,
  LandingVideoVariant,
} from '@/lib/analytics/landing-video-events';

import s from './launch-film-section.module.css';

const COPY = {
  de: {
    label: 'Der Film · 86 Sekunden',
    title: 'Was KIRegister aus einem echten Einsatzfall macht.',
    body: 'Vom ersten Eintrag zum vorlegbaren Use Case Pass. Der dauerhaft kostenlose Registerkern zuerst, die zwei freiwilligen Vertiefungen danach.',
    play: 'Film ansehen',
    close: 'Film schließen',
    cta: 'Register anlegen',
    note: 'Mit Ton · Deutsche Untertitel verfügbar',
    videoLabel: 'KIRegister Launchfilm auf Deutsch',
  },
  en: {
    label: 'The film · 86 seconds',
    title: 'What KIRegister turns a real AI use case into.',
    body: 'From the first capture to a presentable Use Case Pass. The permanently free register comes first, followed by two optional ways to go deeper.',
    play: 'Watch the film',
    close: 'Close film',
    cta: 'Set up register',
    note: 'With sound · English captions available',
    videoLabel: 'KIRegister launch film in English',
  },
} as const;

function track(
  event: LandingVideoEvent,
  locale: LandingVideoLocale,
  variant: LandingVideoVariant,
) {
  void fetch('/api/analytics/landing-video-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, locale, variant }),
    keepalive: true,
  }).catch(() => undefined);
}

export default function LaunchFilmSection({ locale }: { locale: string }) {
  const language: LandingVideoLocale = locale === 'en' ? 'en' : 'de';
  const copy = COPY[language];
  const sectionRef = useRef<HTMLElement | null>(null);
  const loopRef = useRef<HTMLVideoElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const filmRef = useRef<HTMLVideoElement | null>(null);
  const sentProgress = useRef(new Set<number>());
  const [open, setOpen] = useState(false);
  const launchBase = '/videos/kiregister-launch';
  const loopBase = '/videos/kiregister-hero-loop';
  const setupHref = `/${language}?mode=signup&intent=create_register`;

  useEffect(() => {
    const section = sectionRef.current;
    const loop = loopRef.current;
    if (!section || !loop) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    let impressionSent = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressionSent) {
          impressionSent = true;
          track('impression', language, 'hero_loop');
        }
        if (reducedMotion) return;
        if (entry.isIntersecting) void loop.play().catch(() => undefined);
        else loop.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => {
        void filmRef.current?.play().catch(() => undefined);
      });
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const openFilm = () => {
    sentProgress.current.clear();
    setOpen(true);
    track('play', language, 'master');
  };

  const updateProgress = () => {
    const video = filmRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const progress = video.currentTime / video.duration;
    for (const threshold of [25, 50, 75] as const) {
      if (progress >= threshold / 100 && !sentProgress.current.has(threshold)) {
        sentProgress.current.add(threshold);
        track(`progress_${threshold}`, language, 'master');
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      id="launchfilm"
      className={s.section}
      data-launch-film
      aria-labelledby="launch-film-title"
    >
      <div
        className={s.media}
        data-launch-film-media
        style={{
          '--launch-film-poster': `url(${launchBase}-poster-${language}.webp)`,
        } as CSSProperties}
      >
        <div className={s.mediaFallback} aria-hidden>
          <span>USE CASE PASS</span>
          <div>
            <i />
            <i />
            <i />
            <i />
          </div>
          <strong>PROOF_READY</strong>
        </div>
        <video
          ref={loopRef}
          className={s.loop}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={`${launchBase}-poster-${language}.webp`}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={`${loopBase}-${language}.webm`} type="video/webm" />
          <source src={`${loopBase}-${language}.mp4`} type="video/mp4" />
        </video>
        <button type="button" className={s.play} onClick={openFilm}>
          <span className={s.playMark} aria-hidden>▶</span>
          {copy.play}
        </button>
      </div>

      <div className={s.copy} data-launch-film-copy>
        <p className={s.label}>{copy.label}</p>
        <h2 id="launch-film-title">{copy.title}</h2>
        <p className={s.body}>{copy.body}</p>
        <p className={s.note}>{copy.note}</p>
      </div>

      <dialog
        ref={dialogRef}
        className={s.dialog}
        onClose={() => {
          filmRef.current?.pause();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        aria-label={copy.videoLabel}
      >
        <div className={s.dialogHead}>
          <span>KI Register</span>
          <button type="button" onClick={() => setOpen(false)}>{copy.close} ×</button>
        </div>
        <video
          ref={filmRef}
          className={s.film}
          controls
          playsInline
          preload="metadata"
          poster={`${launchBase}-poster-${language}.webp`}
          onTimeUpdate={updateProgress}
          onEnded={() => track('complete', language, 'master')}
        >
          <source src={`${launchBase}-master-${language}.webm`} type="video/webm" />
          <source src={`${launchBase}-master-${language}.mp4`} type="video/mp4" />
          <track
            default
            kind="captions"
            srcLang={language}
            label={language === 'de' ? 'Deutsch' : 'English'}
            src={`${launchBase}-${language}.vtt`}
          />
        </video>
        <div className={s.dialogFoot}>
          <p>{copy.body}</p>
          <Link
            href={setupHref}
            className={s.cta}
            onClick={() => track('cta', language, 'master')}
          >
            {copy.cta}
          </Link>
        </div>
      </dialog>
    </section>
  );
}
