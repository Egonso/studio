'use client';

/**
 * KI REGISTER — "DER NACHWEIS"
 * An experiential register walk-through in four acts.
 * Chaos of undocumented AI use → ordered register → verifiable pass.
 *
 * Experimental route. Does not replace the production landing page.
 */

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import LaunchFilmSection from '@/components/landing/launch-film-section';

import s from './experience.module.css';

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

interface ExperienceCopy {
  kicker: string;
  phase1Title: string;
  phase1Sub: string;
  phase2Title: string;
  phase2Sub: string;
  phase3Title: string;
  phase3Sub: string;
  scrollHint: string;
  chromeCta: string;
  chromeLogin: string;
  chromeJoin: string;
  entryLabel: string;
  entries: { title: string; body: string; action: string; kind: 'create' | 'join' | 'open' }[];
  ctaOpen: string;
  quickLinks: { label: string; href: string; external?: boolean }[];
  spine: string[];
  mandatLabel: string;
  fineSuffix: string;
  mandatP1: string;
  mandatP2: string;
  mandatCite: string;
  mandatFacts: { title: string; body: string }[];
  statusLabel: string;
  dossierRef: string;
  dossierDate: string;
  dossierTitle: string;
  dossierRows: { term: string; value: string }[];
  statusSteps: { code: string; body: string }[];
  filesLabel: string;
  files: { index: string; title: string; body: string; foot: string }[];
  passLabel: string;
  passTitle: [string, string, string];
  passP1: string;
  passP2: string;
  verifyPrefix: string;
  verifyCode: string;
  passLinkPdf: string;
  passLinkVerify: string;
  stepsLabel: string;
  steps: { title: string; body: string }[];
  promiseTitle: string;
  promiseBody: string;
  finaleTitlePre: string;
  finaleTitleEm: string;
  ctaPrimary: string;
  ctaSecondary: string;
  finaleMeta: string;
  footerNote: string;
}

const DE: ExperienceCopy = {
  kicker: 'KI Register · Registerführung nach EU AI Act',
  phase1Title: 'KI ist in Ihrem Unternehmen längst im Einsatz.',
  phase1Sub:
    'In Vertrieb, Entwicklung, Personal und Einkauf. Meist ohne Verzeichnis, ohne Verantwortliche, ohne Nachweis.',
  phase2Title: 'Die Dokumentation ist verstreut — in Tools, Teams und Tabellen.',
  phase2Sub:
    'Informationen zu KI-Einsatz, Zweck und Verantwortung liegen an verschiedenen Orten. Ohne zentrale Erfassung fehlen Übersicht und belastbarer Nachweis.',
  phase3Title: 'Das Register ordnet. Der Pass bündelt den Nachweis.',
  phase3Sub:
    'Das Register dokumentiert jeden KI-Einsatzfall mit Zweck, Verantwortung, Status und Nachweisen. Daraus entsteht ein prüfbarer Use Case Pass für interne Reviews und Audits.',
  scrollHint: 'Registerführung beginnen',
  chromeCta: 'Register anlegen',
  chromeLogin: 'Anmelden',
  chromeJoin: 'Register beitreten',
  entryLabel: 'Direkt starten — drei Wege',
  entries: [
    {
      kind: 'create',
      title: 'KI-Register kostenfrei einrichten',
      body: 'Für Organisationen, die starten: Konto anlegen, Organisation benennen, Register teilen. Dauert etwa zwei Minuten, keine Kreditkarte.',
      action: 'Register einrichten',
    },
    {
      kind: 'join',
      title: 'Bestehendem Register beitreten',
      body: 'Sie haben einen Einladungscode oder Link von Ihrem Team? Hier einlösen und direkt Einsatzfälle erfassen.',
      action: 'Einladung einlösen',
    },
    {
      kind: 'open',
      title: 'Bestehendes Register öffnen',
      body: 'Ihre Organisation hat bereits ein Register: anmelden und dort weiterarbeiten, wo Sie aufgehört haben.',
      action: 'Anmelden',
    },
  ],
  ctaOpen: 'Bestehendes Register öffnen',
  quickLinks: [
    { label: 'Use Case in 30 s erfassen', href: '/capture' },
    { label: 'Kostenlose Art.-4-Rollenkurse', href: '/academy/ki-kompetenz' },
    { label: 'Fortbildungspaket', href: '/fortbildung' },
    { label: 'Governance / Control', href: '/governance' },
    { label: 'Downloads', href: '/downloads' },
    {
      label: 'Whitepaper',
      href: '/downloads/KIregister_Whitepaper_EU_AI_Act.pdf',
      external: true,
    },
    {
      label: 'Beispiel-Pass (PDF)',
      href: '/resources/examples/ki-register-use-case-pass-beispiel.pdf',
      external: true,
    },
    { label: 'Wie sich das KI Register trägt', href: '/plattform' },
  ],
  spine: ['Prolog', 'Akt I — Mandat', 'Akt II — Statusweg', 'Akt III — Registerwerk', 'Akt IV — Pass', 'Schluss'],
  mandatLabel: 'Akt I — Das Mandat',
  fineSuffix: 'oder 7 % des weltweiten Jahresumsatzes.',
  mandatP1:
    'Die Verordnung (EU) 2024/1689 ist seit August 2024 in Kraft. Sie verpflichtet Organisationen, den Einsatz von KI nachvollziehbar zu dokumentieren — unabhängig von Größe und Branche.',
  mandatP2:
    'Das ist keine Frage der Überzeugung. Es ist eine Frage der Aktenlage.',
  mandatCite: 'Art. 99 · Verordnung (EU) 2024/1689 · Sanktionen',
  mandatFacts: [
    {
      title: 'Gilt bereits',
      body: 'Der EU AI Act ist in Kraft. Übergangsfristen laufen — nicht die Pflicht zur Übersicht.',
    },
    {
      title: 'Gilt auch für Anwender',
      body: 'Nicht nur Hersteller: Wer KI-Systeme betreibt oder einkauft, trägt Dokumentationspflichten.',
    },
    {
      title: 'Gilt über die EU hinaus',
      body: 'Extraterritoriale Reichweite: Der Markt, nicht der Firmensitz, entscheidet.',
    },
  ],
  statusLabel: 'Akt II — Der Statusweg',
  dossierRef: 'Registerauszug · UC-2026-014',
  dossierDate: 'Stand: laufend',
  dossierTitle: 'Chatbot Kundenservice — Antwortvorschläge',
  dossierRows: [
    { term: 'System', value: 'LLM-gestützter Assistent, extern bezogen' },
    { term: 'Zweck', value: 'Vorformulierung von Antworten im Support' },
    { term: 'Verantwortung', value: 'Leitung Customer Care' },
    { term: 'Risikoklasse', value: 'Begrenztes Risiko · Transparenzpflicht' },
    { term: 'Evidenz', value: 'Weisung, Schulungsnachweis, Anbieter-DPA' },
  ],
  statusSteps: [
    {
      code: 'UNREVIEWED',
      body: 'Der Einsatzfall ist erfasst. In rund 30 Sekunden, von jedem im Team.',
    },
    {
      code: 'REVIEW_RECOMMENDED',
      body: 'Risk Assist schlägt eine Einstufung vor. Sichtbar als Vorschlag — nie als Automatik.',
    },
    {
      code: 'REVIEWED',
      body: 'Ein Mensch bestätigt. Risikoklasse, Verantwortung und Pflichten sind geklärt.',
    },
    {
      code: 'PROOF_READY',
      body: 'Vollständig dokumentiert. Der Eintrag ist bereit für Prüfung, Beschaffung und Audit.',
    },
  ],
  filesLabel: 'Akt III — Das Registerwerk',
  files: [
    {
      index: 'Akte 01',
      title: 'Quick Capture',
      body: 'Ein KI-Einsatzfall wird in rund 30 Sekunden erfasst — per Link, ohne Login-Hürde, von jedem im Team.',
      foot: 'Erfassung',
    },
    {
      index: 'Akte 02',
      title: 'Risk Assist',
      body: 'Vorschlagsbasierte Risikoeinstufung im Bearbeitungsfluss. Sichtbar, begründet, immer mit menschlicher Bestätigung.',
      foot: 'Assistenz · keine Automatik',
    },
    {
      index: 'Akte 03',
      title: 'Compliance Dashboard',
      body: 'Der Stand aller KI-Systeme einer Organisation auf einer Seite. Was offen ist, was geprüft ist, was nachweisbar ist.',
      foot: 'Übersicht',
    },
    {
      index: 'Akte 04',
      title: 'Use Case Pass',
      body: 'Das standardisierte Nachweis-Artefakt: ein Einsatzfall als Dokument, exportierbar als PDF und JSON.',
      foot: 'Nachweis · PDF + JSON',
    },
    {
      index: 'Akte 05',
      title: 'Proof Pack & Verify Link',
      body: 'Dokumentenbündel für Prüfsituationen — und ein öffentlich prüfbarer Link pro Pass. Nachweis ohne E-Mail-Anhänge.',
      foot: 'Audit',
    },
    {
      index: 'Akte 06',
      title: 'Trust Portal & Lieferanten',
      body: 'Transparenz nach außen, Anfragen nach innen: Lieferantenanfragen laufen direkt aus dem Register.',
      foot: 'Beschaffung',
    },
  ],
  passLabel: 'Akt IV — Der Pass',
  passTitle: ['Ein Dokument, das man ', 'vorlegen', ' kann.'],
  passP1:
    'Der Use Case Pass fasst zusammen, was zählt: Einsatzfall, Zweck, Verantwortung, Review-Stand, Kontrollen und Evidenzkette — in einem Dokument mit einer Logik.',
  passP2:
    'Intern für die Geschäftsführung. Extern für Beschaffung, Partner und Prüfsituationen. Verifizierbar über einen öffentlichen Link.',
  verifyPrefix: 'VERIFY',
  verifyCode: 'KIR-2026-D41F-8A3C',
  passLinkPdf: 'Beispiel-PDF öffnen',
  passLinkVerify: 'Verify-Link ansehen',
  stepsLabel: 'Der Weg — drei Schritte',
  steps: [
    {
      title: 'Organisation anlegen',
      body: 'Name, Rolle, Registerbasis. Keine Kreditkarte, keine Beratungstermine.',
    },
    {
      title: 'Einsatzfall dokumentieren',
      body: 'System, Zweck, Verantwortung und Nachweise — geführt, in Minuten.',
    },
    {
      title: 'Pass teilen',
      body: 'Als Registerauszug intern, für Beschaffung oder als öffentlich prüfbarer Nachweis.',
    },
  ],
  promiseTitle: '„Pflichtdokumentation bleibt dauerhaft kostenlos."',
  promiseBody:
    'Das Erfüllen des Gesetzes darf keine Preisfrage sein. Registereintrag, Use Case Pass, standardisierte Nachweise und die kurzen Art.-4-Rollenschulungen bleiben frei zugänglich. Wer Governance, Academy und Policy-Arbeit auf derselben Plattform bündelt, trägt die Infrastruktur für alle mit.',
  finaleTitlePre: 'Vom Einsatz ',
  finaleTitleEm: 'zum Nachweis.',
  ctaPrimary: 'Register anlegen',
  ctaSecondary: 'Use Case in 30 Sekunden erfassen',
  finaleMeta: 'Kostenfrei · Organisationsintern · Export als PDF und JSON',
  footerNote: 'KI Register · Registerführung nach EU AI Act',
};

const EN: ExperienceCopy = {
  kicker: 'AI Register · Register-based governance under the EU AI Act',
  phase1Title: 'AI is already in use across your organisation.',
  phase1Sub:
    'In sales, engineering, HR and procurement. Mostly without an inventory, without owners, without evidence.',
  phase2Title: 'Documentation is scattered — across tools, teams and spreadsheets.',
  phase2Sub:
    'Information about AI use, purpose and ownership sits in different places. Without central capture, there is no clear overview or reliable evidence.',
  phase3Title: 'The register creates order. The pass bundles the evidence.',
  phase3Sub:
    'The register documents every AI use case with its purpose, owner, status and supporting records. This creates a verifiable Use Case Pass for internal reviews and audits.',
  scrollHint: 'Begin the register walk-through',
  chromeCta: 'Set up register',
  chromeLogin: 'Sign in',
  chromeJoin: 'Join a register',
  entryLabel: 'Start now — three paths',
  entries: [
    {
      kind: 'create',
      title: 'Set up an AI register free of charge',
      body: 'For organisations starting out: create an account, name your organisation, share the register. About two minutes, no credit card.',
      action: 'Set up register',
    },
    {
      kind: 'join',
      title: 'Join an existing register',
      body: 'You received an invitation code or link from your team? Redeem it here and start capturing use cases.',
      action: 'Redeem invitation',
    },
    {
      kind: 'open',
      title: 'Open your existing register',
      body: 'Your organisation already has a register: sign in and continue where you left off.',
      action: 'Sign in',
    },
  ],
  ctaOpen: 'Open existing register',
  quickLinks: [
    { label: 'Capture a use case in 30 s', href: '/capture' },
    { label: 'Free Article 4 role training', href: '/academy/ki-kompetenz' },
    { label: 'Training package', href: '/fortbildung' },
    { label: 'Governance / Control', href: '/governance' },
    { label: 'Downloads', href: '/downloads' },
    {
      label: 'Whitepaper',
      href: '/downloads/KIregister_Whitepaper_EU_AI_Act.pdf',
      external: true,
    },
    {
      label: 'Sample pass (PDF)',
      href: '/resources/examples/ki-register-use-case-pass-beispiel.pdf',
      external: true,
    },
    { label: 'How the AI Register sustains itself', href: '/plattform' },
  ],
  spine: ['Prologue', 'Act I — Mandate', 'Act II — Status path', 'Act III — The files', 'Act IV — The pass', 'Close'],
  mandatLabel: 'Act I — The mandate',
  fineSuffix: 'or 7 % of global annual turnover.',
  mandatP1:
    'Regulation (EU) 2024/1689 has been in force since August 2024. It obliges organisations to document their use of AI traceably — regardless of size or sector.',
  mandatP2: 'This is not a matter of conviction. It is a matter of record.',
  mandatCite: 'Art. 99 · Regulation (EU) 2024/1689 · Penalties',
  mandatFacts: [
    {
      title: 'Already in force',
      body: 'The EU AI Act applies. Transition periods are running — the duty to keep an overview is not suspended.',
    },
    {
      title: 'Applies to deployers',
      body: 'Not only providers: organisations operating or procuring AI systems carry documentation duties.',
    },
    {
      title: 'Reaches beyond the EU',
      body: 'Extraterritorial scope: the market decides, not the company seat.',
    },
  ],
  statusLabel: 'Act II — The status path',
  dossierRef: 'Register extract · UC-2026-014',
  dossierDate: 'Status: ongoing',
  dossierTitle: 'Customer service chatbot — reply suggestions',
  dossierRows: [
    { term: 'System', value: 'LLM-based assistant, externally sourced' },
    { term: 'Purpose', value: 'Drafting reply suggestions in support' },
    { term: 'Owner', value: 'Head of Customer Care' },
    { term: 'Risk class', value: 'Limited risk · transparency duty' },
    { term: 'Evidence', value: 'Directive, training record, vendor DPA' },
  ],
  statusSteps: [
    {
      code: 'UNREVIEWED',
      body: 'The use case is captured. In about 30 seconds, by anyone on the team.',
    },
    {
      code: 'REVIEW_RECOMMENDED',
      body: 'Risk Assist suggests a classification. Visible as a suggestion — never as automation.',
    },
    {
      code: 'REVIEWED',
      body: 'A human confirms. Risk class, ownership and duties are settled.',
    },
    {
      code: 'PROOF_READY',
      body: 'Fully documented. The entry is ready for review, procurement and audit.',
    },
  ],
  filesLabel: 'Act III — The register files',
  files: [
    {
      index: 'File 01',
      title: 'Quick Capture',
      body: 'An AI use case is captured in about 30 seconds — via link, without login friction, by anyone on the team.',
      foot: 'Capture',
    },
    {
      index: 'File 02',
      title: 'Risk Assist',
      body: 'Suggestion-based risk classification inside the editing flow. Visible, reasoned, always with human confirmation.',
      foot: 'Assistance · no autopilot',
    },
    {
      index: 'File 03',
      title: 'Compliance Dashboard',
      body: 'The state of every AI system in one place. What is open, what is reviewed, what can be proven.',
      foot: 'Overview',
    },
    {
      index: 'File 04',
      title: 'Use Case Pass',
      body: 'The standardised evidence artefact: one use case as a document, exportable as PDF and JSON.',
      foot: 'Evidence · PDF + JSON',
    },
    {
      index: 'File 05',
      title: 'Proof Pack & Verify Link',
      body: 'Document bundles for audit situations — and a publicly verifiable link per pass. Evidence without email attachments.',
      foot: 'Audit',
    },
    {
      index: 'File 06',
      title: 'Trust Portal & Suppliers',
      body: 'Transparency outwards, requests inwards: supplier requests run straight from the register.',
      foot: 'Procurement',
    },
  ],
  passLabel: 'Act IV — The pass',
  passTitle: ['A document you can ', 'present', '.'],
  passP1:
    'The Use Case Pass condenses what matters: use case, purpose, ownership, review status, controls and evidence chain — one document, one logic.',
  passP2:
    'Internally for management. Externally for procurement, partners and audits. Verifiable via a public link.',
  verifyPrefix: 'VERIFY',
  verifyCode: 'KIR-2026-D41F-8A3C',
  passLinkPdf: 'Open sample PDF',
  passLinkVerify: 'See verify link',
  stepsLabel: 'The path — three steps',
  steps: [
    {
      title: 'Set up organisation',
      body: 'Name, role, register base. No credit card, no consulting calls.',
    },
    {
      title: 'Document a use case',
      body: 'System, purpose, ownership and evidence — guided, in minutes.',
    },
    {
      title: 'Share the pass',
      body: 'As a register extract internally, for procurement, or as publicly verifiable evidence.',
    },
  ],
  promiseTitle: '"Mandatory documentation stays free of charge. Permanently."',
  promiseBody:
    'Complying with the law must not be a question of budget. Register entries, Use Case Passes, standardised evidence and the short Article 4 role trainings remain freely accessible. Organisations bundling governance, Academy and policy work on the same platform carry the infrastructure for everyone.',
  finaleTitlePre: 'From use ',
  finaleTitleEm: 'to proof.',
  ctaPrimary: 'Set up register',
  ctaSecondary: 'Capture a use case in 30 seconds',
  finaleMeta: 'Free of charge · Private to your organisation · PDF and JSON export',
  footerNote: 'AI Register · Register-based governance under the EU AI Act',
};

/* ------------------------------------------------------------------ */
/* Three.js hero scene: drifting documents assemble into a register    */
/* ------------------------------------------------------------------ */

interface HeroScene {
  setProgress: (p: number) => void;
  setPointer: (x: number, y: number) => void;
  setRunning: (running: boolean) => void;
  dispose: () => void;
}

function createDocumentTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 176;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fffefb';
    ctx.fillRect(0, 0, 128, 176);
    ctx.strokeStyle = '#cfcdc5';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 126, 174);
    // header bar
    ctx.fillStyle = '#e3e1d9';
    ctx.fillRect(14, 16, 62, 7);
    ctx.fillRect(14, 30, 38, 5);
    // body lines
    ctx.fillStyle = '#dddbd3';
    for (let i = 0; i < 9; i += 1) {
      const w = 100 - (i % 3) * 14;
      ctx.fillRect(14, 52 + i * 12, w, 4);
    }
    // seal
    ctx.strokeStyle = '#c9c7bf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(102, 152, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function tryCreateHeroScene(container: HTMLElement): HeroScene | null {
  try {
    return createHeroScene(container);
  } catch (error) {
    // No WebGL available: the page must still work as a document.
    console.warn('[experience] WebGL unavailable, running without hero scene.', error);
    return null;
  }
}

function createHeroScene(container: HTMLElement): HeroScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    42,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    100,
  );
  camera.position.set(0, 0, 15);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 1.15);
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(4, 6, 8);
  scene.add(ambient, key);

  const COLS = 16;
  const ROWS = 12;
  const COUNT = COLS * ROWS;
  const SPACING_X = 1.16;
  const SPACING_Y = 1.52;

  const geometry = new THREE.PlaneGeometry(1, 1.36);
  const texture = createDocumentTexture();
  const material = new THREE.MeshLambertMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  interface InstanceState {
    chaosPos: THREE.Vector3;
    chaosRot: THREE.Euler;
    gridPos: THREE.Vector3;
    delay: number;
    driftSeed: number;
    tint: 'none' | 'blue' | 'green';
  }

  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  const states: InstanceState[] = [];
  const paperColor = new THREE.Color('#ffffff');
  const blueColor = new THREE.Color('#b9cdf6');
  const greenColor = new THREE.Color('#bfe3cd');

  for (let i = 0; i < COUNT; i += 1) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const gridPos = new THREE.Vector3(
      (col - (COLS - 1) / 2) * SPACING_X,
      ((ROWS - 1) / 2 - row) * SPACING_Y,
      0,
    );
    const tintRoll = Math.random();
    states.push({
      chaosPos: new THREE.Vector3(rand(-16, 16), rand(-10, 10), rand(-9, 5)),
      chaosRot: new THREE.Euler(
        rand(-1.4, 1.4),
        rand(-1.4, 1.4),
        rand(-0.9, 0.9),
      ),
      gridPos,
      delay: Math.random() * 0.55,
      driftSeed: Math.random() * Math.PI * 2,
      tint: tintRoll > 0.94 ? 'green' : tintRoll > 0.85 ? 'blue' : 'none',
    });
    mesh.setColorAt(i, paperColor);
  }
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }

  const dummy = new THREE.Object3D();
  const workColor = new THREE.Color();

  let progress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let running = true;
  let disposed = false;
  let rafId = 0;
  let time = 0;

  const smoothstep = (t: number) => t * t * (3 - 2 * t);

  const update = () => {
    time += 0.004;
    for (let i = 0; i < COUNT; i += 1) {
      const st = states[i];
      const local = smoothstep(
        Math.min(Math.max((progress * 1.55 - st.delay) / 0.55, 0), 1),
      );

      const driftX = Math.sin(time * 2 + st.driftSeed) * 0.35 * (1 - local);
      const driftY =
        Math.cos(time * 1.6 + st.driftSeed * 1.7) * 0.3 * (1 - local);

      dummy.position.set(
        st.chaosPos.x + (st.gridPos.x - st.chaosPos.x) * local + driftX,
        st.chaosPos.y + (st.gridPos.y - st.chaosPos.y) * local + driftY,
        st.chaosPos.z + (st.gridPos.z - st.chaosPos.z) * local,
      );
      dummy.rotation.set(
        st.chaosRot.x * (1 - local),
        st.chaosRot.y * (1 - local),
        st.chaosRot.z * (1 - local),
      );
      const scale = 0.9 + local * 0.1;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (st.tint !== 'none') {
        const tintAmount = Math.min(
          Math.max((progress - 0.72) / 0.28, 0),
          1,
        );
        workColor
          .copy(paperColor)
          .lerp(st.tint === 'blue' ? blueColor : greenColor, tintAmount);
        mesh.setColorAt(i, workColor);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }

    camera.position.x += (pointerX * 0.9 - camera.position.x) * 0.05;
    camera.position.y += (-pointerY * 0.6 - camera.position.y) * 0.05;
    camera.position.z = 15 - progress * 2.2;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  const loop = () => {
    if (disposed) {
      return;
    }
    if (running) {
      update();
    }
    rafId = window.requestAnimationFrame(loop);
  };
  loop();

  const handleResize = () => {
    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / Math.max(clientHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
  };
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  return {
    setProgress: (p: number) => {
      progress = p;
    },
    setPointer: (x: number, y: number) => {
      pointerX = x;
      pointerY = y;
    },
    setRunning: (value: boolean) => {
      running = value;
    },
    dispose: () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ExperienceClient({ locale }: { locale: string }) {
  const copy = locale === 'en' ? EN : DE;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const phaseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const heroHintRef = useRef<HTMLDivElement | null>(null);
  const spineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mandatRef = useRef<HTMLElement | null>(null);
  const fineRef = useRef<HTMLSpanElement | null>(null);
  const statusSectionRef = useRef<HTMLElement | null>(null);
  const dossierRef = useRef<HTMLDivElement | null>(null);
  const stampRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const railFillRef = useRef<HTMLDivElement | null>(null);
  const filesSectionRef = useRef<HTMLElement | null>(null);
  const filesTrackRef = useRef<HTMLDivElement | null>(null);
  const passSectionRef = useRef<HTMLElement | null>(null);
  const passCardRef = useRef<HTMLDivElement | null>(null);
  const passGlareRef = useRef<HTMLDivElement | null>(null);
  const verifyRef = useRef<HTMLSpanElement | null>(null);
  const promiseRef = useRef<HTMLElement | null>(null);
  const finaleRef = useRef<HTMLElement | null>(null);
  const ctaRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvasHost = canvasHostRef.current;
    if (!root || !canvasHost) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const heroScene = tryCreateHeroScene(canvasHost);
    if (heroScene && prefersReducedMotion) {
      heroScene.setProgress(1);
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!heroScene) {
        return;
      }
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      heroScene.setPointer(nx, ny);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const ctx = gsap.context(() => {
      const phases = phaseRefs.current.filter(Boolean) as HTMLDivElement[];
      const stamps = stampRefs.current.filter(Boolean) as HTMLSpanElement[];
      const steps = stepRefs.current.filter(Boolean) as HTMLDivElement[];

      if (prefersReducedMotion) {
        gsap.set(phases[0], { autoAlpha: 0 });
        gsap.set(phases[1], { autoAlpha: 0 });
        gsap.set(phases[2], { autoAlpha: 1 });
        gsap.set(stamps, { autoAlpha: 1 });
        if (fineRef.current) {
          fineRef.current.textContent = new Intl.NumberFormat(
            locale === 'en' ? 'en-IE' : 'de-DE',
            { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
          ).format(35_000_000);
        }
        if (verifyRef.current) {
          verifyRef.current.textContent = copy.verifyCode;
        }
        return;
      }

      /* ---------- HERO: pin + chaos→order + phase crossfades ---------- */
      gsap.set(phases[1], { autoAlpha: 0, y: 30 });
      gsap.set(phases[2], { autoAlpha: 0, y: 30 });

      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=320%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => heroScene?.setProgress(self.progress),
          onToggle: (self) => heroScene?.setRunning(self.isActive),
        },
      });

      heroTl
        .to(heroHintRef.current, { autoAlpha: 0, duration: 0.06 }, 0.02)
        .to(phases[0], { autoAlpha: 0, y: -30, duration: 0.16 }, 0.16)
        .fromTo(
          phases[1],
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.16 },
          0.3,
        )
        .to(phases[1], { autoAlpha: 0, y: -30, duration: 0.16 }, 0.52)
        .fromTo(
          phases[2],
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.18 },
          0.7,
        );

      /* ---------- FILM: the intro resolves into the explainer ---------- */
      const filmSection = root.querySelector<HTMLElement>('[data-launch-film]');
      const filmMedia = filmSection?.querySelector<HTMLElement>(
        '[data-launch-film-media]',
      );
      const filmCopy = filmSection?.querySelector<HTMLElement>(
        '[data-launch-film-copy]',
      );
      if (filmSection && filmMedia && filmCopy) {
        const filmReveal = gsap.timeline({
          onComplete: () => {
            gsap.set(filmSection, { clearProps: 'clipPath' });
            gsap.set(filmMedia, { clearProps: 'transform' });
          },
          scrollTrigger: {
            trigger: filmSection,
            start: 'top 92%',
            once: true,
          },
        });
        filmReveal
          .fromTo(
            filmSection,
            { clipPath: 'inset(0 0 12% 0)' },
            {
              clipPath: 'inset(0 0 0% 0)',
              duration: 1.15,
              ease: 'power4.out',
            },
          )
          .fromTo(
            filmMedia,
            { scale: 1.035 },
            { scale: 1, duration: 1.35, ease: 'power3.out' },
            0,
          )
          .fromTo(
            Array.from(filmCopy.children),
            { autoAlpha: 0, y: 24 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              stagger: 0.08,
            },
            0.2,
          );
      }

      /* ---------- AKT I: fine counter + line reveals ---------- */
      const formatter = new Intl.NumberFormat(
        locale === 'en' ? 'en-IE' : 'de-DE',
        { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
      );
      const counter = { value: 0 };
      ScrollTrigger.create({
        trigger: mandatRef.current,
        start: 'top 65%',
        once: true,
        onEnter: () => {
          gsap.to(counter, {
            value: 35_000_000,
            duration: 2.4,
            ease: 'power3.out',
            onUpdate: () => {
              if (fineRef.current) {
                fineRef.current.textContent = formatter.format(
                  Math.round(counter.value),
                );
              }
            },
          });
        },
      });

      const mandatParagraphs = mandatRef.current?.querySelectorAll('p');
      if (mandatParagraphs) {
        mandatParagraphs.forEach((p) => {
          const split = new SplitText(p, { type: 'lines', mask: 'lines' });
          gsap.from(split.lines, {
            yPercent: 110,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.07,
            scrollTrigger: { trigger: p, start: 'top 80%', once: true },
          });
        });
      }

      /* ---------- AKT II: pinned status path with stamps ---------- */
      gsap.set(stamps, {
        autoAlpha: 0,
        scale: 2.1,
        rotation: -14,
        transformOrigin: '50% 50%',
      });
      gsap.set(steps, { autoAlpha: 0.25 });

      const stampSlots = [0.1, 0.34, 0.58, 0.82];
      const statusTl = gsap.timeline({
        scrollTrigger: {
          trigger: statusSectionRef.current,
          start: 'top top',
          end: '+=340%',
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
        },
      });

      statusTl.fromTo(
        dossierRef.current,
        { y: 60, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.08, ease: 'power2.out' },
        0,
      );

      stamps.forEach((stamp, index) => {
        const at = stampSlots[index];
        statusTl
          .to(
            stamp,
            {
              autoAlpha: 1,
              scale: 1,
              rotation: index % 2 === 0 ? -5 : -8,
              duration: 0.05,
              ease: 'power4.in',
            },
            at,
          )
          .fromTo(
            dossierRef.current,
            { x: 0 },
            {
              x: index % 2 === 0 ? 5 : -5,
              duration: 0.012,
              yoyo: true,
              repeat: 1,
              ease: 'power1.inOut',
            },
            at + 0.05,
          )
          .to(steps[index], { autoAlpha: 1, duration: 0.04 }, at)
          .to(
            stamp,
            { autoAlpha: index === stamps.length - 1 ? 1 : 0, duration: 0.05 },
            index === stamps.length - 1 ? at + 0.05 : stampSlots[index + 1] - 0.06,
          );
      });

      if (railFillRef.current) {
        statusTl.fromTo(
          railFillRef.current,
          { scaleY: 0 },
          { scaleY: 1, duration: 0.86, ease: 'none' },
          0.06,
        );
      }

      /* ---------- AKT III: horizontal register files (desktop) ---------- */
      const mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', () => {
        const track = filesTrackRef.current;
        const viewportEl = filesSectionRef.current;
        if (!track || !viewportEl) {
          return;
        }
        const getDistance = () =>
          Math.max(track.scrollWidth - window.innerWidth + 96, 0);
        gsap.to(track, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: viewportEl,
            start: 'top top',
            end: () => `+=${getDistance()}`,
            scrub: 0.7,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      });

      /* ---------- AKT IV: pass tilt + glare + verify scramble ---------- */
      const passCard = passCardRef.current;
      const passSection = passSectionRef.current;
      if (passCard && passSection) {
        const rotX = gsap.quickTo(passCard, 'rotationX', {
          duration: 0.7,
          ease: 'power3.out',
        });
        const rotY = gsap.quickTo(passCard, 'rotationY', {
          duration: 0.7,
          ease: 'power3.out',
        });
        const onCardMove = (event: PointerEvent) => {
          const rect = passCard.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          rotY(px * 16);
          rotX(-py * 12);
        };
        const onCardLeave = () => {
          rotX(0);
          rotY(0);
        };
        passSection.addEventListener('pointermove', onCardMove);
        passSection.addEventListener('pointerleave', onCardLeave);

        gsap.fromTo(
          passCard,
          { y: 90, rotationX: 12, autoAlpha: 0 },
          {
            y: 0,
            rotationX: 0,
            autoAlpha: 1,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: passSection,
              start: 'top 70%',
              once: true,
            },
          },
        );

        ScrollTrigger.create({
          trigger: passSection,
          start: 'top 55%',
          once: true,
          onEnter: () => {
            gsap.fromTo(
              passGlareRef.current,
              { xPercent: -120 },
              { xPercent: 220, duration: 1.4, ease: 'power2.inOut', delay: 0.4 },
            );
            if (verifyRef.current) {
              gsap.to(verifyRef.current, {
                duration: 1.8,
                delay: 0.5,
                scrambleText: {
                  text: copy.verifyCode,
                  chars: '0123456789ABCDEF',
                  speed: 0.4,
                },
              });
            }
          },
        });
      }

      /* ---------- big line reveals ---------- */
      const revealTargets = root.querySelectorAll('[data-reveal]');
      revealTargets.forEach((el) => {
        const split = new SplitText(el as HTMLElement, {
          type: 'lines',
          mask: 'lines',
        });
        gsap.from(split.lines, {
          yPercent: 115,
          duration: 1.05,
          ease: 'power4.out',
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 82%', once: true },
        });
      });

      const fadeTargets = root.querySelectorAll('[data-fade]');
      fadeTargets.forEach((el) => {
        gsap.from(el, {
          y: 40,
          autoAlpha: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        });
      });

      /* ---------- spine (file index) ---------- */
      const spineSections: (HTMLElement | null)[] = [
        heroRef.current,
        mandatRef.current,
        statusSectionRef.current,
        filesSectionRef.current,
        passSectionRef.current,
        finaleRef.current,
      ];
      spineSections.forEach((section, index) => {
        if (!section) {
          return;
        }
        ScrollTrigger.create({
          trigger: section,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            const item = spineRefs.current[index];
            if (item) {
              item.classList.toggle(s.spineItemActive, self.isActive);
            }
          },
        });
      });

      /* ---------- magnetic finale CTA ---------- */
      const cta = ctaRef.current;
      const finale = finaleRef.current;
      if (cta && finale) {
        const ctaX = gsap.quickTo(cta, 'x', { duration: 0.5, ease: 'power3.out' });
        const ctaY = gsap.quickTo(cta, 'y', { duration: 0.5, ease: 'power3.out' });
        const onFinaleMove = (event: PointerEvent) => {
          const rect = cta.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = event.clientX - cx;
          const dy = event.clientY - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < 220) {
            const pull = (1 - dist / 220) * 0.35;
            ctaX(dx * pull);
            ctaY(dy * pull);
          } else {
            ctaX(0);
            ctaY(0);
          }
        };
        finale.addEventListener('pointermove', onFinaleMove);
        finale.addEventListener('pointerleave', () => {
          ctaX(0);
          ctaY(0);
        });
      }
    }, root);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      ctx.revert();
      heroScene?.dispose();
    };
  }, [copy.verifyCode, locale]);

  const setupHref = `/${locale}?mode=signup&intent=create_register`;
  const joinHref = `/${locale}?mode=signup&intent=join_register`;
  const loginHref = `/${locale}?mode=login`;
  const captureHref = `/${locale}/capture`;
  const verifyHref = `/${locale}/verify`;

  return (
    <div ref={rootRef} className={s.root}>
      <div className={s.grain} aria-hidden />

      {/* fixed chrome */}
      <header className={s.chrome}>
        <Link href={`/${locale}`} className={s.wordmark}>
          KI Register
        </Link>
        <nav className={s.chromeNav}>
          <Link href={loginHref} className={s.chromeLink}>
            {copy.chromeLogin}
          </Link>
          <Link href={joinHref} className={s.chromeLink}>
            {copy.chromeJoin}
          </Link>
          <Link href={setupHref} className={s.chromeCta}>
            {copy.chromeCta}
          </Link>
        </nav>
      </header>

      <nav className={s.spine} aria-hidden>
        {copy.spine.map((label, index) => (
          <span
            key={label}
            ref={(el) => {
              spineRefs.current[index] = el;
            }}
            className={s.spineItem}
          >
            {label}
          </span>
        ))}
      </nav>

      {/* ============ PROLOG / HERO ============ */}
      <section ref={heroRef} className={s.hero} aria-label="Prolog">
        <div ref={canvasHostRef} className={s.heroCanvas} aria-hidden />
        <div className={s.heroVignette} aria-hidden />

        <div className={s.heroText}>
          <div
            ref={(el) => {
              phaseRefs.current[0] = el;
            }}
            className={s.heroPhase}
          >
            <p className={s.heroKicker}>{copy.kicker}</p>
            <h1 className={s.heroTitle}>{copy.phase1Title}</h1>
            <p className={s.heroSub}>{copy.phase1Sub}</p>
            <nav className={s.quickRow} aria-label="Direktzugriff">
              {copy.quickLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className={s.quickLink}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={`/${locale}${link.href}`}
                    className={s.quickLink}
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
          </div>
          <div
            ref={(el) => {
              phaseRefs.current[1] = el;
            }}
            className={s.heroPhase}
          >
            <h2 className={s.heroTitle}>{copy.phase2Title}</h2>
            <p className={s.heroSub}>{copy.phase2Sub}</p>
          </div>
          <div
            ref={(el) => {
              phaseRefs.current[2] = el;
            }}
            className={s.heroPhase}
          >
            <h2 className={s.heroTitle}>
              <em>{copy.phase3Title}</em>
            </h2>
            <p className={s.heroSub}>{copy.phase3Sub}</p>
          </div>
        </div>

        <div ref={heroHintRef} className={s.heroHint}>
          {copy.scrollHint}
        </div>
      </section>

      <LaunchFilmSection locale={locale} />

      {/* ============ DIREKT STARTEN ============ */}
      <section className={s.act} aria-label={copy.entryLabel}>
        <p className={s.actLabel}>{copy.entryLabel}</p>
        <div className={s.entryGrid}>
          {copy.entries.map((entry) => {
            const href =
              entry.kind === 'create'
                ? setupHref
                : entry.kind === 'join'
                  ? joinHref
                  : loginHref;
            return (
              <Link key={entry.kind} href={href} className={s.entryCard}>
                <h2>{entry.title}</h2>
                <p>{entry.body}</p>
                <span className={s.entryAction}>{entry.action} →</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ AKT I — DAS MANDAT ============ */}
      <section ref={mandatRef} className={`${s.act} ${s.dark}`}>
        <p className={s.actLabel}>{copy.mandatLabel}</p>
        <div className={s.mandatGrid}>
          <h2 className={s.fineSum}>
            <span ref={fineRef}>0&nbsp;€</span>
            <span className={s.fineSuffix}>{copy.fineSuffix}</span>
          </h2>
          <div className={s.mandatCopy}>
            <p>{copy.mandatP1}</p>
            <p>{copy.mandatP2}</p>
            <p className={s.mandatCite}>{copy.mandatCite}</p>
          </div>
        </div>
        <div className={s.mandatFacts}>
          {copy.mandatFacts.map((fact) => (
            <div key={fact.title} className={s.mandatFact} data-fade>
              <h3>{fact.title}</h3>
              <p>{fact.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ AKT II — DER STATUSWEG ============ */}
      <section
        ref={statusSectionRef}
        className={s.statusStage}
        aria-label={copy.statusLabel}
      >
        <div ref={dossierRef} className={s.dossier}>
          <div className={s.dossierHead}>
            <span>{copy.dossierRef}</span>
            <span>{copy.dossierDate}</span>
          </div>
          <h3 className={s.dossierTitle}>{copy.dossierTitle}</h3>
          <dl>
            {copy.dossierRows.map((row) => (
              <div key={row.term} className={s.dossierRow}>
                <dt>{row.term}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className={s.stampZone}>
            {copy.statusSteps.map((step, index) => (
              <span
                key={step.code}
                ref={(el) => {
                  stampRefs.current[index] = el;
                }}
                className={`${s.stamp} ${
                  index === 0
                    ? s.stampGray
                    : index === 1
                      ? s.stampOutline
                      : index === 2
                        ? s.stampBlue
                        : s.stampGreen
                }`}
              >
                {step.code}
              </span>
            ))}
          </div>
        </div>

        <div className={s.statusCopy}>
          <p className={s.actLabel}>{copy.statusLabel}</p>
          <div className={s.statusSteps}>
            <div className={s.statusRail} aria-hidden>
              <div ref={railFillRef} className={s.statusRailFill} />
            </div>
            {copy.statusSteps.map((step, index) => (
              <div
                key={step.code}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                className={s.statusStep}
              >
                <h3>{step.code}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AKT III — DAS REGISTERWERK ============ */}
      <section ref={filesSectionRef} className={s.filesViewport}>
        <div className={s.act} style={{ paddingBottom: '2rem' }}>
          <p className={s.actLabel}>{copy.filesLabel}</p>
        </div>
        <div ref={filesTrackRef} className={s.filesTrack}>
          {copy.files.map((file) => (
            <article key={file.index} className={s.fileCard} data-fade>
              <div className={s.fileIndex}>
                <span>{file.index}</span>
                <span>KIR</span>
              </div>
              <h3 className={s.fileTitle}>{file.title}</h3>
              <p className={s.fileDesc}>{file.body}</p>
              <div className={s.fileFoot}>{file.foot}</div>
            </article>
          ))}
        </div>
      </section>

      {/* ============ AKT IV — DER PASS ============ */}
      <section ref={passSectionRef} className={s.act}>
        <p className={s.actLabel}>{copy.passLabel}</p>
        <div className={s.passGrid}>
          <div className={s.passScene}>
            <div>
              <div ref={passCardRef} className={s.passCard}>
                <Image
                  src="/images/use-case-pass-example.png"
                  alt="Use Case Pass — Beispieldokument"
                  width={1489}
                  height={2105}
                  sizes="(min-width: 900px) 24rem, 82vw"
                />
                <div ref={passGlareRef} className={s.passGlare} aria-hidden />
              </div>
              <p className={s.verifyRow}>
                <span className={s.verifyBadge} aria-hidden />
                <span>{copy.verifyPrefix}</span>
                <span ref={verifyRef}>····-····-····-····</span>
              </p>
            </div>
          </div>
          <div className={s.passCopy}>
            <h2 data-reveal>
              {copy.passTitle[0]}
              <em>{copy.passTitle[1]}</em>
              {copy.passTitle[2]}
            </h2>
            <p data-fade>{copy.passP1}</p>
            <p data-fade>{copy.passP2}</p>
            <div className={s.passLinks} data-fade>
              <a
                href="/resources/examples/ki-register-use-case-pass-beispiel.pdf"
                target="_blank"
                rel="noreferrer"
                className={s.textLink}
              >
                {copy.passLinkPdf}
              </a>
              <Link href={verifyHref} className={s.textLink}>
                {copy.passLinkVerify}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DREI SCHRITTE ============ */}
      <section className={s.act}>
        <p className={s.actLabel}>{copy.stepsLabel}</p>
        <div className={s.steps}>
          {copy.steps.map((step, index) => (
            <div key={step.title} className={s.step} data-fade>
              <span className={s.stepNum}>{'I'.repeat(index + 1)}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ DAS VERSPRECHEN ============ */}
      <section ref={promiseRef} className={s.promise}>
        <h2 data-reveal>{copy.promiseTitle}</h2>
        <p data-fade>{copy.promiseBody}</p>
      </section>

      {/* ============ FINALE ============ */}
      <section ref={finaleRef} className={s.finale}>
        <h2 className={s.finaleTitle} data-reveal>
          {copy.finaleTitlePre}
          <em>{copy.finaleTitleEm}</em>
        </h2>
        <div className={s.finaleActions}>
          <Link ref={ctaRef} href={setupHref} className={s.btnPrimary}>
            {copy.entries[0].title}
          </Link>
          <Link href={joinHref} className={s.btnGhost}>
            {copy.chromeJoin}
          </Link>
          <Link href={loginHref} className={s.btnGhost}>
            {copy.ctaOpen}
          </Link>
        </div>
        <p className={s.finaleMeta}>
          {copy.finaleMeta}
          {' · '}
          <Link href={captureHref} className={s.finaleMetaLink}>
            {copy.ctaSecondary}
          </Link>
        </p>
      </section>

      <footer className={s.footer}>
        <span>{copy.footerNote}</span>
        <span>
          <Link href={loginHref}>{copy.chromeLogin}</Link>
          {' · '}
          <Link href={`/${locale}/downloads`}>Downloads</Link>
          {' · '}
          <Link href={`/${locale}/plattform`}>Plattform</Link>
          {' · '}
          <Link href={`/${locale}/impressum`}>Impressum</Link>
          {' · '}
          <Link href={`/${locale}/datenschutz`}>Datenschutz</Link>
        </span>
      </footer>
    </div>
  );
}
