'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  Suspense,
  lazy,
} from 'react';
import { gsap } from 'gsap';
import styles from '../styles/VideoIntro.module.css';

// Lazy-load Three.js layer
const CinematicLayer = lazy(() => import('./CinematicLayer'));

export default function VideoIntro() {
  const basePath = '/ABHILASH';
  const heroRef = useRef<HTMLElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
  const backdropVideoRef = useRef<HTMLVideoElement>(null);
  const haloVideoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLButtonElement>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSoundHint, setShowSoundHint] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Parallax and active section states (0 = Hero, 1 = Experience, 2 = Projects, 3 = Skills, 4 = Credentials)
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [slide, setSlide] = useState(0);

  // Interactive forecasting simulator states
  const [forecastPoints, setForecastPoints] = useState<number[]>([45, 55, 48, 62, 88, 72, 95, 115, 98, 125, 145, 115, 85, 78, 92, 105]);
  const [forecastingActive, setForecastingActive] = useState(false);
  const [forecastMessage, setForecastMessage] = useState("SYSTEM READY. AWAITING INFERENCE TRIGGER.");

  // Interactive disease symptoms classifier states
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Name Reveal trigger states
  const [revealName, setRevealName] = useState(false);

  // --- Mount guard ---
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setRevealName(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // --- Mouse Parallax Tracker ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2, // -1 to 1
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- Scroll hijacking for active section slides ---
  useEffect(() => {
    let lastScrollTime = 0;
    const scrollCooldown = 1100;

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < scrollCooldown) return;

      if (e.deltaY > 30) {
        // Scroll down: increment slide
        setSlide((prev) => {
          if (prev < 4) {
            lastScrollTime = now;
            return prev + 1;
          }
          return prev;
        });
      } else if (e.deltaY < -30) {
        // Scroll up: decrement slide
        setSlide((prev) => {
          if (prev > 0) {
            lastScrollTime = now;
            return prev - 1;
          }
          return prev;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // --- GSAP entrance animations ---
  useEffect(() => {
    if (!controlsRef.current || !scrollRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        heroRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.5, ease: 'power2.inOut' },
        0
      );

      // Controls
      tl.to(controlsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.9,
      }, 1.8);

      // Scroll indicator
      tl.to(scrollRef.current, {
        opacity: 0.65,
        duration: 0.9,
      }, 2.0);
    });

    return () => ctx.revert();
  }, [mounted]);

  // --- Play/Pause Control ---
  const togglePlay = useCallback(() => {
    const v = mainVideoRef.current;
    const a = ambientVideoRef.current;
    const b = backdropVideoRef.current;
    const h = haloVideoRef.current;
    if (!v) return;

    if (isPlaying) {
      v.pause(); a?.pause(); b?.pause(); h?.pause();
    } else {
      v.play().catch(() => { });
      a?.play().catch(() => { });
      b?.play().catch(() => { });
      h?.play().catch(() => { });
    }
    setIsPlaying((prev) => !prev);
  }, [isPlaying]);

  // --- Sound Unmute & Tap ---
  const handleSoundTap = useCallback(() => {
    const v = mainVideoRef.current;
    if (!v) return;

    const newMuted = !isMuted;
    v.muted = newMuted;
    setIsMuted(newMuted);
    setShowSoundHint(false);
  }, [isMuted]);



  // Letter Splitter for Hollywood Name Reveal (re-triggers on slide change)
  const renderTitleSpans = (text: string, isActive: boolean) => {
    return text.split('').map((char, index) => (
      <span
        key={index}
        className={`${styles.char} ${isActive ? styles.revealChar : ''}`}
        style={{
          transitionDelay: `${index * 0.05}s`,
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  const handleEnterClick = useCallback(() => {
    setSlide(1);
  }, []);

  const getCenterpieceParallax = () => {
    const rotateY = mouse.x * 6;
    const rotateX = -mouse.y * 6;
    return {
      transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translate3d(0, 0, 10px)`,
    };
  };

  return (
    <>
      <section ref={heroRef} className={styles.hero} style={{ opacity: 0 }}>

        {/* ── Ambient Blurred Background (Always active) ── */}
        <video
          ref={ambientVideoRef}
          className={styles.ambientVideo}
          src={`${basePath}/hero.mp4`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        {/* ── Cinematic Glow Points ── */}
        <div className={styles.lightingLeft} />
        <div className={styles.lightingRight} />

        {/* ── Three.js Cinematic Environment Layer ── */}
        {mounted && (
          <Suspense fallback={null}>
            <CinematicLayer soundActive={false} slide={slide} />
          </Suspense>
        )}

        {/* ── Left Column: Section Typography & Details ── */}
        <div className={`${styles.content} ${slide !== 0 ? styles.contentDocked : ''}`}>

          {/* Section 0: Main landing name card */}
          {slide === 0 && (
            <div className="animate-fadeIn">
              <div className={styles.taglineWrapper}>
                <div className={`${styles.taglineLine} ${revealName ? styles.revealTagline : ''}`}>
                  <span style={{ color: 'rgba(243, 106, 8, 1)', textShadow: '0 0 15px rgba(244, 125, 6, 0.7), 0 0 2px #000' }}>MACHINE LEARNING ENGINEER</span>
                  &nbsp;&nbsp;·&nbsp;&nbsp;
                  <span style={{ color: '#ef7008ff', textShadow: '0 0 15px rgba(243, 117, 6, 0.7), 0 0 2px #000' }}>AI ENGINEER</span>
                </div>
              </div>
              <div className={styles.nameBlock}>
                <div className={styles.firstNameContainer}>
                  <h1 className={styles.firstName}>
                    {renderTitleSpans('ABHILASH', revealName)}
                  </h1>
                </div>
                <div className={styles.lastNameContainer}>
                  <h1 className={styles.lastName}>
                    {renderTitleSpans('UPPUNUTHALA', revealName)}
                  </h1>
                </div>
              </div>
              <div className={`${styles.divider} ${revealName ? styles.dividerReveal : ''}`} />
              <div className={styles.roleWrapper}>
                <p className={`${styles.role} ${revealName ? styles.roleReveal : ''}`}>
                  AI Apprentice &nbsp;·&nbsp;{' '}
                  <span className={styles.roleHighlight}>
                    AI/ML Engineer
                  </span>{' '}
                  specializing in time-series passenger forecasting, end-to-end XGBoost pipelines, and Agentic AI workflows.
                </p>
              </div>

              {/* Landing Page Social Icons / Links */}
              <div className={styles.socialRowLanding}>
                <a href="https://www.linkedin.com/in/abhilash47/" target="_blank" rel="noreferrer" className={styles.landingSocialLink}>
                  <svg style={{ width: '13px', height: '13px', fill: 'currentColor' }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn
                </a>
                <a href="https://github.com/Abhilash0201" target="_blank" rel="noreferrer" className={styles.landingSocialLink}>
                  <svg style={{ width: '13px', height: '13px', fill: 'currentColor' }} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          )}

          {/* Section 1: Experience */}
          {slide === 1 && (
            <div className="animate-fadeIn">
              <div className={styles.taglineWrapper}>
                <div className={`${styles.taglineLine} ${styles.revealTagline}`}>
                  DOSSIER SECTION 01
                </div>
              </div>
              <div className={styles.nameBlock}>
                <div className={styles.firstNameContainer}>
                  <h1 className={styles.firstName}>
                    {renderTitleSpans('PROFESSIONAL', true)}
                  </h1>
                </div>
                <div className={styles.lastNameContainer}>
                  <h1 className={styles.lastName}>
                    {renderTitleSpans('EXPERIENCE', true)}
                  </h1>
                </div>
              </div>
              <div className={`${styles.divider} ${styles.dividerReveal}`} />
              <div className={styles.roleWrapper}>
                <p className={`${styles.role} ${styles.roleReveal}`}>
                  Overview of computational roles, production apprenticeships, and time-series demand deployments at <span className={styles.roleHighlight}>TGSRTC</span>.
                </p>
              </div>
            </div>
          )}

          {/* Section 2: Projects */}
          {slide === 2 && (
            <div className="animate-fadeIn">
              <div className={styles.taglineWrapper}>
                <div className={`${styles.taglineLine} ${styles.revealTagline}`}>
                  DOSSIER SECTION 02
                </div>
              </div>
              <div className={styles.nameBlock}>
                <div className={styles.firstNameContainer}>
                  <h1 className={styles.firstName}>
                    {renderTitleSpans('FEATURED', true)}
                  </h1>
                </div>
                <div className={styles.lastNameContainer}>
                  <h1 className={styles.lastName}>
                    {renderTitleSpans('PROJECTS', true)}
                  </h1>
                </div>
              </div>
              <div className={`${styles.divider} ${styles.dividerReveal}`} />
              <div className={styles.roleWrapper}>
                <p className={`${styles.role} ${styles.roleReveal}`}>
                  Interactive simulations of systemic classifiers and time-series dashboards engineered with <span className={styles.roleHighlight}>Logistic Regression, XGBoost and Streamlit</span>.
                </p>
              </div>
            </div>
          )}

          {/* Section 3: Skills */}
          {slide === 3 && (
            <div className="animate-fadeIn">
              <div className={styles.taglineWrapper}>
                <div className={`${styles.taglineLine} ${styles.revealTagline}`}>
                  DOSSIER SECTION 03
                </div>
              </div>
              <div className={styles.nameBlock}>
                <div className={styles.firstNameContainer}>
                  <h1 className={styles.firstName}>
                    {renderTitleSpans('TECHNICAL', true)}
                  </h1>
                </div>
                <div className={styles.lastNameContainer}>
                  <h1 className={styles.lastName}>
                    {renderTitleSpans('SKILLS', true)}
                  </h1>
                </div>
              </div>
              <div className={`${styles.divider} ${styles.dividerReveal}`} />
              <div className={styles.roleWrapper}>
                <p className={`${styles.role} ${styles.roleReveal}`}>
                  Skill breakdown spanning <span className={styles.roleHighlight}>GenAI & Prompting</span>, core Machine Learning, time-series predictions, and developer platforms.
                </p>
              </div>
            </div>
          )}

          {/* Section 4: Credentials / Info */}
          {slide === 4 && (
            <div className="animate-fadeIn">
              <div className={styles.taglineWrapper}>
                <div className={`${styles.taglineLine} ${styles.revealTagline}`}>
                  ACADEMICS SECTION 04
                </div>
              </div>
              <div className={styles.nameBlock}>
                <div className={styles.firstNameContainer}>
                  <h1 className={styles.firstName}>
                    {renderTitleSpans('EDUCATIONAL', true)}
                  </h1>
                </div>
                <div className={styles.lastNameContainer}>
                  <h1 className={styles.lastName}>
                    {renderTitleSpans('LOGS', true)}
                  </h1>
                </div>
              </div>
              <div className={`${styles.divider} ${styles.dividerReveal}`} />
              <div className={styles.roleWrapper}>
                <p className={`${styles.role} ${styles.roleReveal}`}>
                  University degree pathways, professional certifications checklist, and contact vector coordinates.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ── Center Column: Interactive Cards / Floating Centerpiece ── */}
        <div
          className={`${styles.centerpieceWrapper} ${slide === 0 ? styles.fullscreen : `${styles.floating} ${styles.docked}`}`}
          style={slide === 0 ? undefined : getCenterpieceParallax()}
        >

          {/* Section 0: Layered Video Centerpiece */}
          {slide === 0 && (
            <div className="w-full h-full relative">
              <div className={styles.layerBackdropBlur}>
                <video
                  ref={backdropVideoRef}
                  className="w-full h-full object-cover scale-150 filter blur-[40px] opacity-70"
                  src={`${basePath}/hero.mp4`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                />
              </div>

              <div className={styles.layerHaloGlow}>
                <video
                  ref={haloVideoRef}
                  className="w-full h-full object-cover rounded-[28px] filter blur-[15px] opacity-50"
                  src={`${basePath}/hero.mp4`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                />
              </div>

              <div className={styles.layerSharpCenterpiece}>
                <video
                  ref={mainVideoRef}
                  className={styles.centerpieceVideo}
                  src={`${basePath}/hero.mp4`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                />
                <div className={styles.laserScanner} />
              </div>

              <div className={styles.layerGlassOverlay}>
                <div className={styles.glassSweep} />
              </div>
              <div className={styles.cardParticles} />
            </div>
          )}

          {/* Section 1: Experience Glass Card */}
          {slide === 1 && (
            <div className={`${styles.glassCard} animate-fadeIn`}>
              <div>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>Artificial Intelligence Apprentice</h3>
                    <p className={styles.cardSubtitle}>Telangana State Road Transport Corp</p>
                  </div>
                  <span className={styles.cardBadge}>July 2025 – Present</span>
                </div>
                <ul className={styles.experienceList}>
                  <li>Developed AI-based passenger demand forecasting system using time-series features.</li>
                  <li>Built end-to-end ML preprocessing, feature extraction, and prediction pipelines.</li>
                  <li>Tuned and deployed passenger density forecasting via XGBoost.</li>
                  <li>Automated runtimes to support real-time bus scheduling decisions.</li>
                </ul>
              </div>

              {/* Forecaster graph simulator */}
              <div className={styles.forecasterContainer}>
                <div className={styles.cardHeader} style={{ margin: 0, paddingBottom: '0.35rem' }}>
                  <span className={styles.cardSubtitle}>XGBOOST FORECASTING ENGINE</span>
                  <span style={{ fontFamily: 'Courier New', fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>
                    {forecastMessage}
                  </span>
                </div>
                <div className={styles.graphWrapper}>
                  <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="300" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <path
                      d={`M ${forecastPoints.map((p, idx) => `${idx * 20}, ${100 - (p / 160) * 85}`).join(' L ')}`}
                      fill="none"
                      stroke="#ff8c42"
                      strokeWidth="2"
                    />
                    <path
                      d={`M 0, 100 L ${forecastPoints.map((p, idx) => `${idx * 20}, ${100 - (p / 160) * 85}`).join(' L ')} L 300, 100 Z`}
                      fill="url(#orangeGrad)"
                      opacity="0.15"
                    />
                    <defs>
                      <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff8c42" />
                        <stop offset="100%" stopColor="#ff8c42" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Courier New' }}>
                    05:00 - 23:00 HOURS
                  </span>
                  <button
                    disabled={forecastingActive}
                    onClick={() => {
                      setForecastingActive(true);
                      setForecastMessage("RUNNING INF --XGB-FORWARD...");
                      setTimeout(() => {
                        const newPoints = Array.from({ length: 16 }, () => Math.floor(Math.random() * 80) + 40);
                        setForecastPoints(newPoints);
                        setForecastingActive(false);
                        setForecastMessage("FORECAST GRAPH UPDATED.");
                      }, 1200);
                    }}
                    className={styles.forecasterRunBtn}
                  >
                    {forecastingActive ? 'COMPUTING...' : 'RUN INFERENCE'}
                  </button>
                </div>
              </div>

              <div className={styles.cardBottomRow}>
                <button onClick={() => setSlide(0)} className={styles.backBtn}>&larr; HOME</button>
                <button onClick={() => setSlide(2)} className={styles.backBtn}>NEXT SECTION &rarr;</button>
              </div>
            </div>
          )}

          {/* Section 2: Projects Glass Card */}
          {slide === 2 && (
            <div className={`${styles.glassCard} animate-fadeIn`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div className={styles.cardHeader} style={{ marginBottom: 0 }}>
                  <h3 className={styles.cardTitle}>Featured Projects &amp; Simulators</h3>
                  <span className={styles.cardSubtitle}>DISEASE PREDICTION &amp; BUS DEMAND FORECASTING</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* Bus Demand Prediction details */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#ff8c42' }}>AI-Based Bus Demand Prediction System</span>
                      <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Courier New' }}>TGSRTC Pipeline</span>
                    </div>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: '1.4' }}>
                      Built ML systems to forecast passenger demand using time-series features. Preprocessed ridership density metrics, extracted seasonal trends, and tuned XGBoost algorithms to predict hourly passenger volumes. Automated pipelines and built Streamlit operational scheduling dashboards to improve vehicle efficiency.
                    </p>
                  </div>

                  {/* Disease prediction details */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#3a8cff' }}>Disease Prediction System</span>
                      <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Courier New' }}>Classifier</span>
                    </div>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: '1.4' }}>
                      Developed multi-model classifiers (Logistic Regression, Random Forest) to predict diseases from symptom checklists. Performed end-to-end preprocessing, feature selection, and validation to optimize accuracy. Deployed user-friendly Streamlit diagnostics interfaces.
                    </p>
                  </div>
                </div>

                {/* Symptom Classifier Simulator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: 'Courier New', color: 'rgba(255,255,255,0.4)' }}>
                    CLASSIFIER SIMULATOR: TOGGLE SYMPTOMS
                  </div>
                  <div className={styles.symptomGrid}>
                    {['Fever', 'Cough', 'Fatigue', 'Headache', 'Joint Pain', 'Nausea'].map((sym) => {
                      const active = selectedSymptoms.includes(sym);
                      return (
                        <button
                          key={sym}
                          onClick={() => {
                            setSelectedSymptoms((prev) =>
                              active ? prev.filter((s) => s !== sym) : [...prev, sym]
                            );
                          }}
                          className={`${styles.symptomBtn} ${active ? styles.symptomBtnActive : ''}`}
                        >
                          {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Progress probabilities list */}
              <div className={styles.classifierContainer} style={{ marginTop: '0.4rem', padding: '0.6rem' }}>
                {[
                  { name: 'Common Flu Strain', calc: () => (selectedSymptoms.includes('Fever') ? 45 : 0) + (selectedSymptoms.includes('Cough') ? 35 : 0) + (selectedSymptoms.includes('Fatigue') ? 15 : 0) },
                  { name: 'Migraine / Neurological', calc: () => (selectedSymptoms.includes('Headache') ? 75 : 0) + (selectedSymptoms.includes('Fatigue') ? 15 : 0) + (selectedSymptoms.includes('Nausea') ? 10 : 0) },
                  { name: 'Viral Gastric Infection', calc: () => (selectedSymptoms.includes('Nausea') ? 70 : 0) + (selectedSymptoms.includes('Fatigue') ? 20 : 0) + (selectedSymptoms.includes('Fever') ? 10 : 0) },
                ].map((d) => {
                  const prob = Math.min(99, d.calc());
                  return (
                    <div key={d.name} className={styles.classifierRow}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontFamily: 'Courier New' }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{d.name}</span>
                        <span style={{ color: prob > 40 ? '#ff8c42' : 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>{prob}%</span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFill} style={{ width: `${prob}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.cardBottomRow}>
                <button onClick={() => setSlide(1)} className={styles.backBtn}>&larr; BACK</button>
                <button onClick={() => setSlide(3)} className={styles.backBtn}>NEXT SECTION &rarr;</button>
              </div>
            </div>
          )}

          {/* Section 3: Technical Skills Glass Card */}
          {slide === 3 && (
            <div className={`${styles.glassCard} animate-fadeIn`}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Technical Core Matrix</h3>
                <span className={styles.cardSubtitle}>AI/ML CAPABILITIES</span>
              </div>

              <div className={styles.skillsColsGrid}>
                {/* Column 1: GenAI & Programming */}
                <div className={styles.skillSubCol}>
                  <h4 className={styles.skillTitle}>GENAI &amp; CODING</h4>
                  {['LLMs', 'Prompt Engineering', 'RAG', 'Agentic AI', 'n8n Workflows', 'Langchain', 'Python', 'SQL', 'HTML/CSS', 'JavaScript (basics)'].map((s) => (
                    <div key={s} className={styles.skillBadge}>
                      <span>{s}</span>
                      <span className={styles.badgeIndicator} style={{ background: '#10b981' }} />
                    </div>
                  ))}
                </div>

                {/* Column 2: AI/ML & Libraries */}
                <div className={styles.skillSubCol}>
                  <h4 className={styles.skillTitle}>AI/ML &amp; LIBS</h4>
                  {['Machine Learning', 'Deep Learning Basics', 'Feature Engineering', 'Model Evaluation', 'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib'].map((s) => (
                    <div key={s} className={styles.skillBadge}>
                      <span>{s}</span>
                      <span className={styles.badgeIndicator} style={{ background: '#ff8c42' }} />
                    </div>
                  ))}
                </div>

                {/* Column 3: Platforms & Tools */}
                <div className={styles.skillSubCol}>
                  <h4 className={styles.skillTitle}>TOOLS &amp; INFRA</h4>
                  {['Streamlit', 'PyTorch', 'TensorFlow', 'Power BI', 'Jupyter Notebook', 'VS Code', 'Git', 'Google Colab', 'Docker'].map((s) => (
                    <div key={s} className={styles.skillBadge}>
                      <span>{s}</span>
                      <span className={styles.badgeIndicator} style={{ background: '#3b82f6' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.cardBottomRow}>
                <button onClick={() => setSlide(2)} className={styles.backBtn}>&larr; BACK</button>
                <button onClick={() => setSlide(4)} className={styles.backBtn}>NEXT SECTION &rarr;</button>
              </div>
            </div>
          )}

          {/* Section 4: Dossier Details Glass Card (Renamed to Educational Logs) */}
          {slide === 4 && (
            <div className={`${styles.glassCard} animate-fadeIn`}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} style={{ fontSize: '1.25rem' }}>Educational Logs &amp; Credentials</h3>
                <span className={styles.cardSubtitle} style={{ fontSize: '0.85rem' }}>ACADEMICS &amp; CERTIFICATIONS</span>
              </div>

              <div className={styles.dossierGrid}>
                {/* Education */}
                <div className={styles.dossierItem} style={{ padding: '1.2rem', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'Courier New', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>
                    ACADEMIC RECORDS
                  </span>
                  <div style={{ fontSize: '0.98rem', fontWeight: 'bold', color: '#fff', lineHeight: '1.3' }}>
                    Computer Science Engineering (AIML)
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                    Sri Indu College of Eng &amp; Tech (JNTU)
                  </span>
                  <span style={{ fontSize: '0.78rem', fontFamily: 'Courier New', color: '#ff8c42', fontWeight: 'bold' }}>
                    CGPA: 7.53 / 10 &nbsp;|&nbsp; 2021 - 2025
                  </span>
                </div>

                {/* Certifications */}
                <div className={styles.dossierItem} style={{ padding: '1.2rem', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'Courier New', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>
                    CERTIFICATIONS CHECKLIST
                  </span>
                  <ul style={{ listStyleType: 'square', listStylePosition: 'inside', fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>Tata Forage Data Visualization</li>
                    <li>MS LinkedIn Software Development</li>
                    <li>Cisco NetAcad Data Science</li>
                    <li>Hackathon conducted by Brainovision</li>
                  </ul>
                </div>
              </div>

              {/* Contacts info */}
              <div className={styles.contactVectorCard} style={{ padding: '1.2rem', gap: '0.65rem' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.3rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  COMMUNICATION PORT CHANNELS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem' }}>
                  <div>📍 Hyderabad, India</div>
                  <div>✉️ abhilash99595@gmail.com</div>
                  <div style={{ gridColumn: 'span 2' }}>📞 +91-9951887849</div>
                </div>
                <div className={styles.socialRow} style={{ marginTop: '0.4rem' }}>
                  <a href="https://www.linkedin.com/in/abhilash47/" target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem' }}>LINKEDIN &rarr;</a>
                  <a href="https://github.com/Abhilash0201" target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem' }}>GITHUB &rarr;</a>
                </div>
              </div>

              <div className={styles.cardBottomRow}>
                <button onClick={() => setSlide(3)} className={styles.backBtn}>&larr; BACK</button>
                <button onClick={() => setSlide(0)} className={styles.backBtn}>BACK TO HOME</button>
              </div>
            </div>
          )}

        </div>

        {/* ── Vertical Navigation Dots (Right hand side) ── */}
        <div className={styles.navDots}>
          {[0, 1, 2, 3, 4].map((dotIndex) => (
            <button
              key={dotIndex}
              onClick={() => setSlide(dotIndex)}
              className={`${styles.navDot} ${slide === dotIndex ? styles.navDotActive : ''}`}
              aria-label={`Go to slide ${dotIndex + 1}`}
            />
          ))}
        </div>

        {/* ── Sound hint badge ── */}
        <div
          className={`${styles.soundHint} ${showSoundHint ? '' : styles.hidden}`}
          onClick={handleSoundTap}
        >
          <span className={styles.soundDot} />
          TAP FOR SOUND
        </div>

        {/* ── Glassmorphism Controls ── */}
        <div
          ref={controlsRef}
          className={`${styles.controls} ${revealName ? styles.controlsReveal : ''}`}
          style={{ opacity: 0 }}
        >
          <button
            className={styles.glassBtn}
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="4" width="4" height="16" rx="1" />
                <rect x="15" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4l14 8-14 8V4z" />
              </svg>
            )}
          </button>

          <button
            className={styles.glassBtn}
            onClick={handleSoundTap}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
                <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" style={{ fill: 'none' }} />
                <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" style={{ fill: 'none' }} />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
                <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Animated Scroll/Enter Indicator (Only on Hero) ── */}
        <button
          ref={scrollRef}
          className={`${styles.scrollIndicator} ${revealName && slide === 0 ? styles.scrollIndicatorReveal : ''}`}
          onClick={handleEnterClick}
          aria-label="Enter Experience"
          style={{ opacity: 0, pointerEvents: slide === 0 ? 'auto' : 'none' }}
        >
          <span className={styles.scrollLabel}>ENTER EXPERIENCE</span>
          <div className={styles.scrollLine} />
        </button>
      </section>
    </>
  );
}
