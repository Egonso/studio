'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

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
    play: 'Film abspielen',
    playHint: '86 Sekunden · mit Ton',
    cta: 'Register anlegen',
    note: 'Mit Ton · Deutsche Untertitel verfügbar',
    videoLabel: 'KIRegister Launchfilm auf Deutsch',
  },
  en: {
    label: 'The film · 86 seconds',
    title: 'What KIRegister turns a real AI use case into.',
    body: 'From the first capture to a presentable Use Case Pass. The permanently free register comes first, followed by two optional ways to go deeper.',
    play: 'Play the film',
    playHint: '86 seconds · with sound',
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
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const loopRef = useRef<HTMLVideoElement | null>(null);
  const filmRef = useRef<HTMLVideoElement | null>(null);
  const sentProgress = useRef(new Set<number>());
  const masterActiveRef = useRef(false);
  const floatingRef = useRef(false);
  const previousPlayerRect = useRef<DOMRect | null>(null);
  const playTracked = useRef(false);
  const [masterActive, setMasterActive] = useState(false);
  const [floating, setFloating] = useState(false);
  const launchBase = '/videos/kiregister-launch';
  const loopBase = '/videos/kiregister-hero-loop';
  const setupHref = `/${language}?mode=signup&intent=create_register`;

  const changeFloating = useCallback((next: boolean) => {
    if (floatingRef.current === next) return;
    const player = filmRef.current;
    if (player) previousPlayerRect.current = player.getBoundingClientRect();
    floatingRef.current = next;
    setFloating(next);
  }, []);

  useLayoutEffect(() => {
    const player = filmRef.current;
    const previous = previousPlayerRect.current;
    previousPlayerRect.current = null;
    if (!player || !previous) return;

    const current = player.getBoundingClientRect();
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reducedMotion || current.width === 0 || current.height === 0) return;

    const animation = player.animate(
      [
        {
          transform: `translate(${previous.left - current.left}px, ${previous.top - current.top}px) scale(${previous.width / current.width}, ${previous.height / current.height})`,
        },
        { transform: 'translate(0, 0) scale(1, 1)' },
      ],
      {
        duration: 620,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    );
    return () => animation.cancel();
  }, [floating]);

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
        if (reducedMotion || masterActiveRef.current) {
          loop.pause();
          return;
        }
        if (entry.isIntersecting) void loop.play().catch(() => undefined);
        else loop.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    if (!masterActive) return;
    const media = mediaRef.current;
    if (!media) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.18) {
          changeFloating(false);
        } else if (entry.boundingClientRect.top < 0) {
          changeFloating(true);
        }
      },
      { threshold: [0, 0.18] },
    );
    observer.observe(media);
    return () => observer.disconnect();
  }, [changeFloating, masterActive]);

  const startFilm = () => {
    const film = filmRef.current;
    if (!film) return;
    sentProgress.current.clear();
    masterActiveRef.current = true;
    setMasterActive(true);
    changeFloating(false);
    loopRef.current?.pause();

    if (film.ended || (Number.isFinite(film.duration) && film.currentTime >= film.duration - 0.2)) {
      film.currentTime = 0;
    }
    film.muted = false;
    film.volume = 1;
    if (!playTracked.current) {
      playTracked.current = true;
      track('play', language, 'master');
    }
    void film.play().catch(() => {
      film.focus({ preventScroll: true });
    });
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
        ref={mediaRef}
        className={s.media}
        data-launch-film-media
        style={{
          '--launch-film-poster': `url(${launchBase}-poster-${language}.webp)`,
        } as CSSProperties}
      >
        <video
          ref={loopRef}
          className={`${s.loop} ${masterActive ? s.loopHidden : ''}`}
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
        <video
          ref={filmRef}
          data-launch-master
          className={`${s.master} ${masterActive ? s.masterActive : ''} ${floating ? s.masterFloating : ''}`}
          controls
          playsInline
          preload="metadata"
          poster={`${launchBase}-poster-${language}.webp`}
          aria-label={copy.videoLabel}
          tabIndex={masterActive ? 0 : -1}
          onPlay={() => {
            masterActiveRef.current = true;
            setMasterActive(true);
          }}
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
        {!masterActive ? (
          <button type="button" className={s.play} onClick={startFilm}>
            <span className={s.playDisc} aria-hidden>
              <span className={s.playMark}>▶</span>
            </span>
            <span className={s.playCopy}>
              <strong>{copy.play}</strong>
              <small>{copy.playHint}</small>
            </span>
          </button>
        ) : null}
      </div>

      <div className={s.copy} data-launch-film-copy>
        <p className={s.label}>{copy.label}</p>
        <h2 id="launch-film-title">{copy.title}</h2>
        <p className={s.body}>{copy.body}</p>
        <p className={s.note}>{copy.note}</p>
        <Link
          href={setupHref}
          className={s.cta}
          onClick={() => track('cta', language, 'master')}
        >
          {copy.cta} <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
