'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  BufferGeometry,
  Points,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowUpRight,
  Hexagon,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Image from 'next/image';

import styles from './zoltan-portrait-experience.module.css';

type AxisId = 'weite' | 'klarheit' | 'vitalitaet';

interface AmbientAudio {
  context: AudioContext;
  gain: GainNode;
  oscillators: OscillatorNode[];
  lfo: OscillatorNode;
}

interface ProjectNode {
  id: string;
  index: string;
  title: string;
  signal: string;
  line: string;
  proof: string;
  x: string;
  y: string;
}

const axes: Array<{
  id: AxisId;
  label: string;
  short: string;
  description: string;
}> = [
  {
    id: 'weite',
    label: 'Weite',
    short: 'W',
    description: 'Mehr Wirklichkeit halten, ohne innerlich enger zu werden.',
  },
  {
    id: 'klarheit',
    label: 'Klarheit',
    short: 'K',
    description: 'Unterscheiden, was ist, ohne Kontakt und Wärme zu verlieren.',
  },
  {
    id: 'vitalitaet',
    label: 'Vitalität',
    short: 'V',
    description: 'Lebendigkeit, Bewegung und Mut statt polierter Erstarrung.',
  },
];

const forceMap = [
  {
    verb: 'Verstehen',
    project: 'Qualia Engine',
    line: 'Ein Forschungsrahmen für die Qualität innerer Erfahrung: Ich-Perspektive, Beziehung und überprüfbare Beobachtung gehören in ein gemeinsames Bild.',
  },
  {
    verb: 'Wiederherstellen',
    project: 'Psychosomatische Beratungsstelle',
    line: 'Ein Ort für Menschen und Angehörige, wenn Krankheit, Verlust und Kontrollverlust nicht mehr theoretisch sind.',
  },
  {
    verb: 'Entwickeln',
    project: 'Creating Consciousness',
    line: 'Praxisformen für Sehen, Halten und Wollen: persönliche Entwicklung ohne Selbstoptimierungsgeräusch.',
  },
  {
    verb: 'Multiplizieren',
    project: 'Humanistische Psychoonkologie Fortbildung',
    line: 'Eine DKG-anerkannte Fortbildung, die klinische Präsenz, Fallarbeit und Selbstbegegnung in professionelle Form bringt.',
  },
  {
    verb: 'Schützen',
    project: 'KIRegister',
    line: 'Ein Register für menschliche Verantwortung, wenn KI in Entscheidungen, Abläufe und Organisationen hineinwirkt.',
  },
];

const projects: ProjectNode[] = [
  {
    id: 'kiregister',
    index: '01',
    title: 'KIRegister',
    signal: 'Organisation',
    line: 'Nicht noch ein Werkzeug über Maschinen. Ein System, das sichtbar macht, wo Menschen Verantwortung behalten müssen.',
    proof:
      'Für Arbeitsgruppen, die KI einsetzen wollen, ohne Verantwortung in Papierpflichten oder Bauchgefühl zu verlieren.',
    x: '66%',
    y: '24%',
  },
  {
    id: 'hpf',
    index: '02',
    title: 'Humanistische Psychoonkologie Fortbildung',
    signal: 'Berufliche Bildung',
    line: 'Eine Fortbildung für Menschen, die Krebs, Angst, Würde und Ambivalenz nicht abstrakt begleiten.',
    proof:
      'Für Psychoonkolog:innen, Therapeut:innen und Fachkräfte, die Präsenz lernen wollen, nicht nur Methode.',
    x: '79%',
    y: '58%',
  },
  {
    id: 'psb',
    index: '03',
    title: 'Psychosomatische Beratungsstelle',
    signal: 'Krise',
    line: 'Psychosomatische und psychoonkologische Arbeit dort, wo Menschen nicht nach Optimierung suchen, sondern nach Halt.',
    proof:
      'Für Patient:innen, Angehörige und Fachgruppen, die in existenziellen Situationen nicht allein bleiben sollen.',
    x: '44%',
    y: '78%',
  },
  {
    id: 'consciousness',
    index: '04',
    title: 'Creating Consciousness',
    signal: 'Entwicklung',
    line: 'Ein Übungsfeld für Sehen, Lieben und Wollen: Wahrnehmung verändern, bevor Handlung zur Wiederholung wird.',
    proof:
      'Für Menschen, die innere Arbeit ernst nehmen, ohne in Nebel, Pathos oder reine Theorie auszuweichen.',
    x: '19%',
    y: '58%',
  },
  {
    id: 'qualia',
    index: '05',
    title: 'Qualia Engine',
    signal: 'Forschung',
    line: 'Ein Modell für Bewusstseinsqualität: Weite mal Klarheit mal Vitalität, geprüft an Erfahrung und Gegenrede.',
    proof:
      'Für alle, die Innenleben nicht romantisieren und trotzdem nicht auf Messbares reduzieren wollen.',
    x: '31%',
    y: '24%',
  },
];

const readerCards = [
  {
    title: 'Für Menschen in Kliniken und Beratung',
    copy:
      'Wie bleibt Begegnung menschlich, wenn Diagnose, Angst und Zeitdruck den Raum eng machen?',
  },
  {
    title: 'Für Organisationen mit KI-Verantwortung',
    copy:
      'Wie wird Technik nutzbar, ohne dass Verantwortung in Modelle, Anbieter oder Prozesse wegrutscht?',
  },
  {
    title: 'Für Lernende und Lehrende',
    copy:
      'Wie entsteht professionelle Haltung, die mehr trägt als Wissen, Zertifikat und Methode?',
  },
  {
    title: 'Für Suchende mit Anspruch',
    copy:
      'Wie kann Entwicklung tief sein, ohne unklar zu werden, und präzise, ohne kalt zu werden?',
  },
];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

function WebGLField({ pulse }: { pulse: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pulseRef = useRef(pulse);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    pulseRef.current = pulse;
  }, [pulse]);

  useEffect(() => {
    if (prefersReducedMotion || !canvasRef.current) {
      return undefined;
    }

    let disposed = false;
    let frameId = 0;
    let renderer: WebGLRenderer | undefined;
    let geometry: BufferGeometry | undefined;
    let material: ShaderMaterial | undefined;
    let points: Points | undefined;

    const boot = async () => {
      const THREE = await import('three');
      const canvas = canvasRef.current;

      if (!canvas || disposed) {
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
      camera.position.set(0, 0, 9.6);

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const count = 920;
      const positions = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      let seed = 9;

      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let index = 0; index < count; index += 1) {
        const ring = index / count;
        const angle = ring * Math.PI * 10.6 + random() * 0.62;
        const radius = 1.2 + Math.pow(random(), 0.32) * 4.9;
        const layer = random() > 0.5 ? 1 : -1;

        positions[index * 3] = Math.cos(angle) * radius + (random() - 0.5) * 0.8;
        positions[index * 3 + 1] =
          Math.sin(angle) * radius * 0.58 + layer * random() * 0.82;
        positions[index * 3 + 2] = (random() - 0.5) * 5.2;
        seeds[index] = random();
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPulse: { value: pulseRef.current / 100 },
          uMouse: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uPulse;
          uniform vec2 uMouse;
          attribute float aSeed;
          varying float vSeed;
          varying float vDepth;

          void main() {
            vSeed = aSeed;
            vec3 transformed = position;
            float wave = sin(uTime * 0.64 + aSeed * 13.0 + position.y * 0.72);
            float pull = 0.18 + uPulse * 0.42;

            transformed.x += wave * pull;
            transformed.y += cos(uTime * 0.48 + aSeed * 7.0) * pull * 0.42;
            transformed.z += sin(uTime * 0.36 + aSeed * 9.0) * 0.24;
            transformed.xy += uMouse * (0.12 + aSeed * 0.26);

            vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
            vDepth = smoothstep(8.0, 2.0, -mvPosition.z);
            gl_PointSize = (1.1 + uPulse * 1.45 + sin(aSeed * 30.0 + uTime) * 0.34) * (92.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying float vSeed;
          varying float vDepth;

          void main() {
            vec2 uv = gl_PointCoord.xy - 0.5;
            float distanceFromCenter = length(uv);
            float alpha = smoothstep(0.38, 0.06, distanceFromCenter) * (0.18 + vDepth * 0.38);

            vec3 deepBlue = vec3(0.15, 0.35, 0.62);
            vec3 honey = vec3(0.95, 0.68, 0.25);
            vec3 livingGreen = vec3(0.35, 0.78, 0.62);
            vec3 porcelain = vec3(0.88, 0.94, 0.92);
            vec3 color = mix(deepBlue, honey, smoothstep(0.18, 0.78, vSeed));
            color = mix(color, livingGreen, smoothstep(0.76, 1.0, vSeed) * 0.58);
            color = mix(color, porcelain, 0.12);

            gl_FragColor = vec4(color, alpha);
          }
        `,
      });

      points = new THREE.Points(geometry, material);
      points.rotation.x = -0.08;
      points.rotation.z = -0.2;
      scene.add(points);

      const resize = () => {
        if (!renderer || !canvas) {
          return;
        }

        const { clientWidth, clientHeight } = canvas;
        renderer.setSize(clientWidth, clientHeight, false);
        camera.aspect = clientWidth / Math.max(clientHeight, 1);
        camera.updateProjectionMatrix();
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (!material) {
          return;
        }

        const x = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
        const y = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
        material.uniforms.uMouse.value.set(x, -y);
      };

      const animate = (time: number) => {
        if (disposed || !renderer || !material || !points) {
          return;
        }

        const seconds = time * 0.001;
        material.uniforms.uTime.value = seconds;
        material.uniforms.uPulse.value = pulseRef.current / 100;
        points.rotation.y = seconds * 0.035;
        points.rotation.z = -0.18 + Math.sin(seconds * 0.18) * 0.05;
        renderer.render(scene, camera);
        frameId = window.requestAnimationFrame(animate);
      };

      resize();
      window.addEventListener('resize', resize);
      window.addEventListener('pointermove', handlePointerMove);
      frameId = window.requestAnimationFrame(animate);

      return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', handlePointerMove);
      };
    };

    let removeListeners: (() => void) | undefined;
    boot().then((cleanup) => {
      removeListeners = cleanup;
    });

    return () => {
      disposed = true;
      removeListeners?.();
      window.cancelAnimationFrame(frameId);
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
    };
  }, [prefersReducedMotion]);

  return <canvas ref={canvasRef} className={styles.webglCanvas} aria-hidden="true" />;
}

export function ZoltanPortraitExperience() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<AmbientAudio | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [soundOn, setSoundOn] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
  const [axisValues, setAxisValues] = useState<Record<AxisId, number>>({
    weite: 74,
    klarheit: 82,
    vitalitaet: 71,
  });

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const qScore = useMemo(() => {
    return Math.round(
      (axisValues.weite * axisValues.klarheit * axisValues.vitalitaet) / 10000,
    );
  }, [axisValues]);
  const qStyle = { '--q-score': `${qScore}%` } as CSSProperties;

  const stopAmbient = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      setSoundOn(false);
      return;
    }

    const now = audio.context.currentTime;
    audio.gain.gain.cancelScheduledValues(now);
    audio.gain.gain.linearRampToValueAtTime(0.0001, now + 0.28);

    window.setTimeout(() => {
      audio.oscillators.forEach((oscillator) => {
        oscillator.stop();
        oscillator.disconnect();
      });
      audio.lfo.stop();
      audio.lfo.disconnect();
      audio.gain.disconnect();
      audio.context.close().catch(() => undefined);
    }, 320);

    audioRef.current = null;
    setSoundOn(false);
  }, []);

  const startAmbient = useCallback(() => {
    if (audioRef.current) {
      return;
    }

    const audioWindow = window as Window &
      typeof globalThis & {
        webkitAudioContext?: typeof AudioContext;
      };
    const AudioContextConstructor =
      audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const context = new AudioContextConstructor();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    const oscillators = [93, 141, 222].map((frequency, index) => {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();

      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index * 5 - 3;
      voiceGain.gain.value = index === 0 ? 0.22 : 0.08;
      oscillator.connect(voiceGain);
      voiceGain.connect(filter);
      oscillator.start();
      return oscillator;
    });

    filter.type = 'lowpass';
    filter.frequency.value = 760;
    lfo.frequency.value = 0.045;
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    filter.connect(gain);
    gain.connect(context.destination);
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 1.4);
    lfo.start();

    audioRef.current = {
      context,
      gain,
      oscillators,
      lfo,
    };
    setSoundOn(true);
  }, []);

  const toggleSound = () => {
    if (soundOn) {
      stopAmbient();
      return;
    }

    startAmbient();
  };

  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, [stopAmbient]);

  useEffect(() => {
    if (prefersReducedMotion || !rootRef.current) {
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      gsap.from('[data-hero-line]', {
        y: 44,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.12,
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.from(element, {
          y: 52,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 84%',
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-depth]').forEach((element, index) => {
        gsap.to(element, {
          y: index % 2 === 0 ? -42 : 36,
          rotateX: index % 2 === 0 ? 3 : -3,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            scrub: true,
            start: 'top bottom',
            end: 'bottom top',
          },
        });
      });

      gsap.to('[data-threshold-line]', {
        scaleX: 1,
        transformOrigin: 'left center',
        ease: 'none',
        scrollTrigger: {
          trigger: '[data-threshold-stage]',
          scrub: true,
          start: 'top 75%',
          end: 'bottom 35%',
        },
      });
    }, rootRef);

    return () => context.revert();
  }, [prefersReducedMotion]);

  const updateAxis = (id: AxisId, value: number) => {
    setAxisValues((current) => ({
      ...current,
      [id]: value,
    }));
  };

  return (
    <div ref={rootRef} className={styles.root} style={qStyle}>
      <WebGLField pulse={qScore} />

      <nav className={styles.nav} aria-label="Seitennavigation">
        <a className={styles.brand} href="#field">
          AZG
        </a>
        <div className={styles.navLinks}>
          <a href="#threshold">Mitte</a>
          <a href="#forces">Arbeit</a>
          <a href="#universe">Wabenfeld</a>
          <a href="#kontakt">Kontakt</a>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={soundOn ? 'Klang ausschalten' : 'Klang einschalten'}
          title={soundOn ? 'Klang ausschalten' : 'Klang einschalten'}
          onClick={toggleSound}
        >
          {soundOn ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
        </button>
      </nav>

      <main>
        <section id="field" className={styles.hero}>
          <div className={styles.honeyField} aria-hidden="true" />
          <div className={styles.heroVeil} aria-hidden="true" />

          <div className={styles.heroContent}>
            <p className={styles.kicker} data-hero-line>
              Alexander Zoltan Gál · Psychologe · Philosoph · Gründer
            </p>
            <h1 className={styles.heroTitle} data-hero-line>
              Menschlichkeit
              <span>unter extremen Bedingungen</span>
            </h1>
            <p className={styles.heroClaim} data-hero-line>
              Ich arbeite an Räumen, Methoden und Systemen für Situationen, in
              denen Menschen nicht einfacher werden dürfen, nur weil der Druck
              steigt.
            </p>
            <div className={styles.heroMeta} data-hero-line>
              <span>München</span>
              <span>Psychoonkologie</span>
              <span>KI-Verantwortung</span>
              <span>Bewusstseinsforschung</span>
            </div>
            <aside className={styles.portraitBadge} data-hero-line>
              <Image
                src="/images/faculty/zoltan-gal.png"
                alt="Kleines Porträt von Alexander Zoltan Gál"
                width={112}
                height={124}
                priority
                className={styles.portraitImage}
              />
              <div>
                <span>Arbeitsschwerpunkt</span>
                <strong>Grenzsituationen menschlich organisieren</strong>
              </div>
            </aside>
          </div>
        </section>

        <section id="threshold" className={styles.threshold} data-threshold-stage>
          <div className={styles.sectionInner}>
            <div className={styles.sectionEyebrow} data-reveal>
              Die Mitte
            </div>
            <div className={styles.thresholdGrid}>
              <div className={styles.thresholdStatement} data-reveal>
                <h2>Wo es ernst wird, entscheidet sich, ob ein System dient.</h2>
              </div>
              <div className={styles.thresholdCopy} data-reveal>
                <p>
                  Am Krankenbett ist die Frage nicht, ob ein Konzept elegant
                  ist. In Organisationen mit KI ist die Frage nicht, ob ein
                  Oberfläche beeindruckt. In der eigenen Entwicklung ist die
                  Frage nicht, ob ein Modell schön klingt.
                </p>
                <p>
                  Die Frage ist nüchterner: Was hilft Menschen, wenn Angst,
                  Macht, Krankheit, Technik oder Überforderung den Raum
                  verengen? Meine Arbeit sucht dafür Formen, die klar genug für
                  Verantwortung und warm genug für Wirklichkeit sind.
                </p>
                <div className={styles.thresholdRule}>
                  <span data-threshold-line />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="forces" className={styles.forceSection}>
          <div className={styles.sectionInner}>
            <div className={styles.splitHeader}>
              <div>
                <p className={styles.sectionEyebrow} data-reveal>
                  Fünf Arbeitsformen
                </p>
                <h2 data-reveal>Keine lose Sammlung. Ein Organismus.</h2>
              </div>
              <p data-reveal>
                Die Projekte wirken auf den ersten Blick verschieden. Klinik,
                Fortbildung, Bewusstseinsarbeit und KI-Verantwortung sind aber
                Zellen desselben Wabenbaus: Menschlichkeit unter Bedingungen
                bewahren, die sie schnell beschädigen.
              </p>
            </div>

            <div className={styles.forceList}>
              {forceMap.map((force, index) => (
                <article className={styles.forceItem} key={force.verb} data-reveal>
                  <div className={styles.forceNumber}>{String(index + 1).padStart(2, '0')}</div>
                  <h3>{force.verb}</h3>
                  <p className={styles.forceProject}>{force.project}</p>
                  <p>{force.line}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.axisSection}>
          <div className={styles.sectionInner}>
            <div className={styles.axisGrid}>
              <div className={styles.axisIntro} data-reveal>
                <p className={styles.sectionEyebrow}>Ein Arbeitsmodell</p>
                <h2>Qualität ist kein Gefühl. Sie hat Bedingungen.</h2>
                <p>
                  Die Qualia Engine ist der Versuch, innere Qualität nicht
                  schwammig zu behandeln. Weite, Klarheit und Vitalität werden
                  als drei Achsen gelesen. Fehlt eine davon, wird Entwicklung
                  schnell eng, kalt oder leer.
                </p>
              </div>

              <div className={styles.axisConsole} data-reveal>
                <div className={styles.qMeter}>
                  <div>
                    <span>Q</span>
                    <strong>{qScore}</strong>
                  </div>
                  <div className={styles.qTrack} aria-hidden="true">
                    <span />
                  </div>
                </div>

                {axes.map((axis) => (
                  <label className={styles.axisControl} key={axis.id}>
                    <span>
                      <strong>{axis.short}</strong>
                      {axis.label}
                    </span>
                    <input
                      aria-label={axis.label}
                      type="range"
                      min={24}
                      max={100}
                      value={axisValues[axis.id]}
                      onChange={(event) => updateAxis(axis.id, Number(event.target.value))}
                    />
                    <small>{axis.description}</small>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="universe" className={styles.universeSection}>
          <div className={styles.sectionInner}>
            <div className={styles.splitHeader}>
              <div>
                <p className={styles.sectionEyebrow} data-reveal>
                  Wabenfeld
                </p>
                <h2 data-reveal>Jede Zelle trägt einen Teil der Mitte.</h2>
              </div>
              <p data-reveal>
                Das Feld lässt sich nicht auf eine Berufsbezeichnung reduzieren.
                Es ist eher eine Architektur aus Beratung, Lehre, Forschung,
                Praxis und Infrastruktur. Klicken Sie die Zellen an.
              </p>
            </div>

            <div className={styles.constellationWrap}>
              <div className={styles.constellation} data-depth>
                <div className={styles.constellationCore}>
                  <Hexagon aria-hidden="true" />
                  <span>Menschlichkeit unter extremen Bedingungen</span>
                </div>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={styles.projectNode}
                    data-active={project.id === activeProjectId}
                    style={{ '--x': project.x, '--y': project.y } as CSSProperties}
                    onClick={() => setActiveProjectId(project.id)}
                  >
                    <span>{project.index}</span>
                    {project.title}
                  </button>
                ))}
              </div>

              <article className={styles.projectDetail} data-reveal>
                <p>{activeProject.signal}</p>
                <h3>{activeProject.title}</h3>
                <blockquote>{activeProject.line}</blockquote>
                <div>
                  <Radio aria-hidden="true" />
                  <span>{activeProject.proof}</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.contradictionSection}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow} data-reveal>
              Die produktiven Spannungen
            </p>
            <div className={styles.contradictionGrid}>
              {[
                'Der Therapeut, der Verantwortungsinfrastruktur baut.',
                'Der Bewusstseinsarbeiter, der Evidenz und Widerspruch verlangt.',
                'Der Gründer, der Bürokratie misstraut und trotzdem ein Register baut.',
                'Der Systemdenker, der immer wieder in den konkreten Raum zurückkehrt.',
              ].map((line) => (
                <p key={line} data-reveal>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.readerSection}>
          <div className={styles.sectionInner}>
            <div className={styles.splitHeader}>
              <div>
                <p className={styles.sectionEyebrow} data-reveal>
                  Für interessierte Besucher:innen
                </p>
                <h2 data-reveal>Wert entsteht, wenn ein Gedanke anschlussfähig wird.</h2>
              </div>
              <p data-reveal>
                Hier finden Sie keine Biografie im Lebenslauf-Stil. Eher eine
                Landkarte: für Situationen, in denen Menschen, Organisationen
                und Technologien an Grenzen kommen und trotzdem Würde brauchen.
              </p>
            </div>

            <div className={styles.readerGrid}>
              {readerCards.map((card) => (
                <article key={card.title} className={styles.readerCard} data-reveal>
                  <Hexagon aria-hidden="true" />
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="kontakt" className={styles.finalSection}>
          <div className={styles.sectionInner}>
            <div className={styles.finalCopy} data-reveal>
              <p className={styles.sectionEyebrow}>Kontakt</p>
              <h2>
                Wenn Ihre Arbeit Menschen unter Druck berührt, sollte das
                nächste Gespräch nicht klein bleiben.
              </h2>
              <a href="mailto:mail.zoltangal@gmail.com?subject=Menschlichkeit%20unter%20extremen%20Bedingungen">
                Mit der echten Frage beginnen
                <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
