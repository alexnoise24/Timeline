import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import { FREE_FOR_ALL } from '@/lib/utils';
import Ticket from '@/components/ui/Ticket';
import screenshot01 from '../assets/screenshots/dashboard.jpg';
import screenshot02 from '../assets/screenshots/timeline.jpg';
import screenshot03 from '../assets/screenshots/shotlist.jpg';
import screenshot04 from '../assets/screenshots/screenshot-04-notif.jpg';
import screenshot05 from '../assets/screenshots/screenshot-05-watch.png';

const FEATURES = [
  { num: '01', title: 'Timelines en vivo', desc: 'Crea el timeline una sola vez. Si algo cambia, todos lo ven al instante / sin PDFs, sin reenvíos.' },
  { num: '02', title: 'Notificaciones push', desc: 'Avisa a todo tu equipo cuando un evento está por comenzar. Nadie pierde el momento.' },
  { num: '03', title: 'Apple Watch', desc: 'Consulta el timeline de un vistazo en tu muñeca. Tus manos libres, tu ojo en los novios.' },
  { num: '04', title: 'Colaboración en equipo', desc: 'Invita a segunda cámara, videógrafos y a los novios. Cada quien ve lo que necesita / sin costo extra.' },
  { num: '05', title: 'Listas de tomas', desc: 'Adjunta shot lists a cada evento. Nunca más olvidar las fotos que la mamá de la novia pidió.' },
  { num: '06', title: 'Funciona en todos lados', desc: 'App para iOS y acceso web. Tu equipo no necesita descargar nada / un link es suficiente.' },
];

const STEPS = [
  { num: '01', title: 'Crea tu proyecto', desc: 'Agrega la fecha, el venue y todos los eventos / ceremonia, cocktail, recepción.' },
  { num: '02', title: 'Invita a tu equipo', desc: 'Manda un link a tu segunda cámara, videógrafos y a los novios. Se unen al instante.' },
  { num: '03', title: 'Mantente sincronizado', desc: 'Las notificaciones y el Apple Watch mantienen a todos a tiempo, incluso cuando el itinerario cambia.' },
  { num: '04', title: 'Entrega el día', desc: 'Enfócate completamente en las fotos. La logística se cuida sola.' },
];

const CHAOS = [
  'El grupo de WhatsApp donde nadie leyó el último mensaje',
  'El PDF que mandaste hace 3 días y ya está desactualizado',
  'La ceremonia empezó tarde y el videógrafo no supo a tiempo',
  'Los novios no saben qué sigue / y te preguntan en medio de la sesión',
];

const SCREENSHOTS = [
  { num: '01', headline: 'Todas tus bodas, organizadas', label: 'Dashboard', img: screenshot01, isWatch: false },
  { num: '02', headline: 'Nunca pierdas un momento', label: 'Timeline', img: screenshot02, isWatch: false },
  { num: '03', headline: 'Cada foto, controlada', label: 'Shot Lists', img: screenshot03, isWatch: false },
  { num: '04', headline: 'El app que trabaja por ti', label: 'Notificaciones', img: screenshot04, isWatch: false },
  { num: '05', headline: 'En tu muñeca, donde lo necesitas', label: 'Apple Watch', img: screenshot05, isWatch: true },
];

export default function Landing() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        fontFamily: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
        background: '#F1EFEA',
        color: '#0A0A0A',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        .fade-up { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .landing-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #0A0A0A; color: #F1EFEA;
          border: 1.5px solid #0A0A0A;
          padding: 14px 22px;
          font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 12px;
          letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none;
          transition: background 80ms ease-out, color 80ms ease-out;
          cursor: pointer;
        }
        .landing-btn-primary:hover { background: #F1EFEA; color: #0A0A0A; }
        .landing-btn-accent {
          display: inline-flex; align-items: center; gap: 8px;
          background: #7B7FE0; color: #0A0A0A;
          border: 1.5px solid #0A0A0A;
          padding: 14px 22px;
          font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 12px;
          letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none;
          transition: background 80ms ease-out;
          cursor: pointer;
        }
        .landing-btn-accent:hover { background: #5A5FC9; }
        .landing-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #0A0A0A;
          border: 1.5px dashed #0A0A0A;
          padding: 14px 22px;
          font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 12px;
          letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none;
          transition: background 80ms ease-out, color 80ms ease-out;
        }
        .landing-btn-ghost:hover { background: #0A0A0A; color: #F1EFEA; }
        .landing-btn-white {
          display: inline-flex; align-items: center; gap: 8px;
          background: #F1EFEA; color: #0A0A0A;
          border: 1.5px solid #F1EFEA;
          padding: 14px 22px;
          font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 12px;
          letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none;
          transition: background 80ms ease-out, color 80ms ease-out;
        }
        .landing-btn-white:hover { background: #0A0A0A; color: #F1EFEA; border-color: #0A0A0A; }
        .alto-label-sm {
          font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 10px;
          letter-spacing: 0.12em; text-transform: uppercase; line-height: 1;
        }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .hero-actions { flex-direction: column; align-items: flex-start; }
          .problem-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .story-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .screenshots-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .footer-inner { flex-direction: column !important; gap: 1.5rem !important; text-align: center; }
        }
        @media (max-width: 480px) {
          .screenshots-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
        }
        /* Safe area + mobile layout */
        .landing-nav {
          padding: env(safe-area-inset-top) 3rem 0;
          height: calc(60px + env(safe-area-inset-top));
        }
        .hero-section { padding-top: calc(60px + env(safe-area-inset-top)); }
        @media (max-width: 768px) {
          .landing-nav { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
          .hero-inner { padding: 2.5rem 1.25rem 3rem !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-ticket { display: none !important; }
          .section-pad { padding: 3.5rem 1.25rem !important; }
          .cta-pad { padding: 5rem 1.25rem !important; }
          .footer-pad { padding: 1.5rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="landing-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#F1EFEA',
        borderBottom: '1.5px solid #0A0A0A',
      }}>
        <Link to="/"><Logo size="sm" variant="paper" /></Link>
        <ul className="nav-links-desktop" style={{ display: 'flex', gap: '2.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><a href="#como" className="alto-label-sm" style={{ color: '#6B6B6B', textDecoration: 'none' }}>Cómo funciona</a></li>
          {!FREE_FOR_ALL && (
            <li><Link to="/pricing" className="alto-label-sm" style={{ color: '#6B6B6B', textDecoration: 'none' }}>Precios</Link></li>
          )}
          <li><Link to="/login" className="alto-label-sm" style={{ color: '#6B6B6B', textDecoration: 'none' }}>Iniciar sesión</Link></li>
        </ul>
        <Link to="/register" className="landing-btn-accent">Comenzar gratis →</Link>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-inner hero-grid" style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 3rem', width: '100%', display: 'grid', gridTemplateColumns: '1fr auto', gap: '4rem', alignItems: 'center' }}>
          <div>
            <span className="alto-label-sm" style={{ color: '#6B6B6B', display: 'block', marginBottom: '1.5rem' }}>
              LENZU · APP PARA FOTÓGRAFOS DE BODAS
            </span>
            <h1 style={{
              fontFamily: '"Inter Tight", "Helvetica Neue", Arial, sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(3rem, 6vw, 5.5rem)',
              letterSpacing: '-0.04em',
              lineHeight: 0.92,
              color: '#0A0A0A',
              marginBottom: '1.5rem',
            }}>
              TU EQUIPO.<br />
              SIEMPRE<br />
              EN PUNTO<span style={{ color: '#7B7FE0' }}>.</span>
            </h1>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', lineHeight: 1.8, color: '#6B6B6B', maxWidth: 480, marginBottom: '2.5rem' }}>
              El timeline que comparten tú, tu segunda cámara, los videógrafos y los novios / para que nadie pierda ni un momento del día.
            </p>
            <div className="hero-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/register" className="landing-btn-accent">Empieza gratis →</Link>
              <a href="#como" className="landing-btn-ghost">Cómo funciona</a>
              <a
                href="https://testflight.apple.com/join/UbSPGPQ2"
                target="_blank" rel="noopener noreferrer"
                className="landing-btn-primary"
                style={{ flexDirection: 'column', gap: '2px', padding: '10px 18px' }}
              >
                <span>Probar en iPhone</span>
                <span style={{ fontSize: '9px', opacity: 0.5, letterSpacing: '0.10em', fontWeight: 400 }}>BETA · TESTFLIGHT</span>
              </a>
            </div>
          </div>
          {/* Ticket hero stamp */}
          <div className="hero-ticket" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', opacity: 0.9 }}>
            <Ticket size={120} content="L" rotate={-6} shadow />
            <span className="alto-label-sm" style={{ color: '#6B6B6B', textAlign: 'center', lineHeight: 1.5 }}>
              PARA FOTÓGRAFOS<br />Y EVENT PLANNERS
            </span>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: '1.5px solid #0A0A0A' }} />

      {/* ── SCREENSHOTS ── */}
      <div className="section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '6rem 2rem' }}>
        <div className="fade-up" style={{ marginBottom: '2.5rem' }}>
          <span className="alto-label-sm" style={{ color: '#6B6B6B' }}>LA APP · EN ACCIÓN</span>
        </div>
        <div className="screenshots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, border: '1.5px solid #0A0A0A' }}>
          {SCREENSHOTS.map((s, i) => (
            <div
              key={s.num}
              className="fade-up"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                padding: '1.5rem 1rem',
                borderLeft: i > 0 ? '1px solid #0A0A0A' : 'none',
                background: '#F7F5F0',
              }}
            >
              <span className="alto-label-sm" style={{ color: '#6B6B6B', alignSelf: 'flex-start' }}>{s.num} /</span>
              <p style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '-0.02em', color: '#0A0A0A', textAlign: 'center', lineHeight: 1.3, flex: 1 }}>
                {s.headline.toUpperCase()}
              </p>
              <div style={{
                width: '100%',
                maxWidth: s.isWatch ? 120 : 160,
                aspectRatio: s.isWatch ? '5/6' : '9/19.5',
                overflow: 'hidden',
                border: s.isWatch ? 'none' : '1px solid #0A0A0A',
                boxShadow: s.isWatch ? '0 2px 14px rgba(0,0,0,0.28)' : 'none',
              }}>
                <img src={s.img} alt={s.label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
              </div>
              <span className="alto-label-sm" style={{ color: '#6B6B6B' }}>{s.label.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: '1.5px solid #0A0A0A' }} />

      {/* ── PROBLEM ── */}
      <div className="section-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 3rem' }}>
        <div className="problem-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'start' }}>
          <div className="fade-up">
            <span className="alto-label-sm" style={{ color: '#6B6B6B', display: 'block', marginBottom: '1rem' }}>EL PROBLEMA REAL</span>
            <h2 style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', letterSpacing: '-0.04em', lineHeight: 0.95, color: '#0A0A0A', marginBottom: '1.2rem' }}>
              EL DÍA DE LA BODA ES HERMOSO CAOS<span style={{ color: '#7B7FE0' }}>.</span>
            </h2>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', lineHeight: 1.8, color: '#6B6B6B' }}>
              Estás coordinando a tu segunda cámara, dos videógrafos, los novios y el coordinador del venue / cada quien en su propio mundo. Un momento perdido no regresa.
            </p>
          </div>
          <ul className="fade-up" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {CHAOS.map((item, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '1rem 1.2rem',
                borderTop: i === 0 ? '1.5px solid #0A0A0A' : '1px dashed #0A0A0A',
                borderBottom: i === CHAOS.length - 1 ? '1.5px solid #0A0A0A' : 'none',
              }}>
                <span className="alto-label-sm" style={{ color: '#6B6B6B', flexShrink: 0, marginTop: 2 }}>{String(i + 1).padStart(2, '0')} /</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: '#0A0A0A', lineHeight: 1.7 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: '1.5px solid #0A0A0A' }} />

      {/* ── FEATURES ── */}
      <div style={{ background: '#F7F5F0', borderBottom: '1.5px solid #0A0A0A' }}>
        <div className="section-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 3rem' }}>
          <div className="fade-up" style={{ marginBottom: '3rem' }}>
            <span className="alto-label-sm" style={{ color: '#6B6B6B', display: 'block', marginBottom: '0.75rem' }}>LA SOLUCIÓN</span>
            <h2 style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', letterSpacing: '-0.04em', lineHeight: 0.95, color: '#0A0A0A' }}>
              UN SOLO TIMELINE<span style={{ color: '#7B7FE0' }}>.</span><br />TODO EL EQUIPO EN SINCRONÍA<span style={{ color: '#7B7FE0' }}>.</span>
            </h2>
          </div>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1.5px solid #0A0A0A' }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.num}
                className="fade-up"
                style={{
                  padding: '2rem',
                  borderLeft: i % 3 !== 0 ? '1px solid #0A0A0A' : 'none',
                  borderTop: i >= 3 ? '1px solid #0A0A0A' : 'none',
                  background: '#F7F5F0',
                }}
              >
                <span className="alto-label-sm" style={{ color: '#7B7FE0', display: 'block', marginBottom: '0.75rem' }}>{f.num} /</span>
                <h3 style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em', color: '#0A0A0A', marginBottom: '0.5rem' }}>
                  {f.title.toUpperCase()}
                </h3>
                <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#6B6B6B', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUOTE ── */}
      <section className="cta-pad" style={{ background: '#0A0A0A', padding: '6rem 3rem', textAlign: 'center', borderBottom: '1.5px solid #0A0A0A' }}>
        <div className="fade-up" style={{ maxWidth: 680, margin: '0 auto' }}>
          <blockquote style={{
            fontFamily: '"Inter Tight", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(1.3rem, 2.5vw, 2rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: '#F1EFEA',
            marginBottom: '1.5rem',
          }}>
            "CONSTRUÍ LA HERRAMIENTA QUE SIEMPRE NECESITÉ / Y LA USÉ EN UNA BODA REAL EN TULUM PARA ASEGURARME DE QUE REALMENTE FUNCIONA<span style={{ color: '#7B7FE0' }}>."</span>
          </blockquote>
          <p className="alto-label-sm" style={{ color: 'rgba(241,239,234,0.40)' }}>
            ALEX OBREGON · FOTÓGRAFO DE BODAS DE DESTINO · MÉXICO
          </p>
        </div>
      </section>

      {/* ── HOW ── */}
      <div className="section-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 3rem' }} id="como">
        <div className="fade-up" style={{ marginBottom: '3rem' }}>
          <span className="alto-label-sm" style={{ color: '#6B6B6B', display: 'block', marginBottom: '0.75rem' }}>CÓMO FUNCIONA</span>
          <h2 style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', letterSpacing: '-0.04em', lineHeight: 0.95, color: '#0A0A0A' }}>
            LISTO EN MINUTOS<span style={{ color: '#7B7FE0' }}>.</span>
          </h2>
        </div>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1.5px solid #0A0A0A' }}>
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className="fade-up"
              style={{
                padding: '2rem',
                borderLeft: i > 0 ? '1px solid #0A0A0A' : 'none',
              }}
            >
              <span className="alto-label-sm" style={{ color: '#7B7FE0', display: 'block', marginBottom: '0.75rem' }}>{s.num} /</span>
              <h3 style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '-0.02em', color: '#0A0A0A', marginBottom: '0.5rem' }}>
                {s.title.toUpperCase()}
              </h3>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#6B6B6B', lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ borderTop: '1.5px solid #0A0A0A' }} />

      {/* ── STORY ── */}
      <div style={{ background: '#F7F5F0', borderBottom: '1.5px solid #0A0A0A' }}>
        <div className="story-grid section-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 3rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '5rem', alignItems: 'center' }}>
          <div className="fade-up">
            <span className="alto-label-sm" style={{ color: '#6B6B6B', display: 'block', marginBottom: '1rem' }}>HECHA POR UN FOTÓGRAFO MEXICANO</span>
            <h2 style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 'clamp(1.6rem, 2.8vw, 2.4rem)', letterSpacing: '-0.04em', lineHeight: 0.95, color: '#0A0A0A', marginBottom: '1.5rem' }}>
              NO ES OTRA APP GENÉRICA<span style={{ color: '#7B7FE0' }}>.</span><br />NACIÓ EN EL CAMPO<span style={{ color: '#7B7FE0' }}>.</span>
            </h2>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: '#6B6B6B', lineHeight: 1.8, marginBottom: '0.75rem' }}>
              Lenzu fue construida por Alex Obregon, fotógrafo de bodas de destino basado en México. Después de años coordinando equipos por WhatsApp y PDFs que nadie leía, construyó la herramienta que siempre quiso tener.
            </p>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: '#6B6B6B', lineHeight: 1.8 }}>
              Se probó por primera vez en una boda real / Caitlin &amp; Christopher en Tulum / y no ha dejado de evolucionar. Cada feature existe porque resolvió un problema real en un día de boda real.
            </p>
          </div>
          <div className="stats-grid fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1.5px solid #0A0A0A' }}>
            {[
              { num: '∞', label: 'Invitados por proyecto / siempre gratis' },
              { num: '1', label: 'Lugar donde vive todo tu equipo' },
              { num: '0', label: 'PDFs. Sin documentos estáticos.' },
              { num: '⌚', label: 'Apple Watch integrado' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '1.5rem',
                borderLeft: i % 2 !== 0 ? '1px solid #0A0A0A' : 'none',
                borderTop: i >= 2 ? '1px solid #0A0A0A' : 'none',
              }}>
                <div style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: '2.2rem', letterSpacing: '-0.04em', lineHeight: 1, color: '#0A0A0A', marginBottom: '0.4rem' }}>
                  {stat.num}
                </div>
                <div className="alto-label-sm" style={{ color: '#6B6B6B', lineHeight: 1.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING TEASER — free-for-all: everything is free, no plan tiers ── */}
      <div className="section-pad" style={{ maxWidth: 860, margin: '0 auto', padding: '6rem 3rem', textAlign: 'center' }}>
        <div className="fade-up">
          {FREE_FOR_ALL ? (
            <>
              <span className="alto-label-sm" style={{ color: '#6B6B6B', display: 'block', marginBottom: '0.75rem' }}>PRECIO</span>
              <h2 style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', letterSpacing: '-0.04em', lineHeight: 0.95, color: '#0A0A0A', marginBottom: '1.2rem' }}>
                GRATIS<span style={{ color: '#7B7FE0' }}>.</span><br />ASÍ DE SIMPLE<span style={{ color: '#7B7FE0' }}>.</span>
              </h2>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: '#6B6B6B', lineHeight: 1.8, marginBottom: '2rem' }}>
                Proyectos ilimitados, colaboradores ilimitados, Apple Watch y moodboard de inspiración. Todo incluido.
              </p>
              <p className="alto-label-sm" style={{ color: '#6B6B6B', marginTop: '1.2rem' }}>
                NO NECESITAS TARJETA · SOLO CREA TU CUENTA
              </p>
            </>
          ) : (
            <>
              <span className="alto-label-sm" style={{ color: '#6B6B6B', display: 'block', marginBottom: '0.75rem' }}>PRECIOS</span>
              <h2 style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', letterSpacing: '-0.04em', lineHeight: 0.95, color: '#0A0A0A', marginBottom: '1.2rem' }}>
                DOS PLANES<span style={{ color: '#7B7FE0' }}>.</span><br />SIN COMPLICACIONES<span style={{ color: '#7B7FE0' }}>.</span>
              </h2>
              <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: '#6B6B6B', lineHeight: 1.8, marginBottom: '2rem' }}>
                Proyectos ilimitados en ambos planes. Pro agrega Apple Watch y el moodboard de inspiración.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                {[
                  { label: 'GRATIS / PROYECTOS ILIMITADOS', accent: false },
                  { label: 'PRO $5/MES / WATCH + INSPIRACIÓN', accent: true },
                ].map(p => (
                  <span
                    key={p.label}
                    className="alto-label-sm"
                    style={{
                      padding: '6px 12px',
                      border: p.accent ? '1.5px solid #0A0A0A' : '1px solid #0A0A0A',
                      background: p.accent ? '#7B7FE0' : 'transparent',
                      color: '#0A0A0A',
                    }}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
              <Link to="/pricing" className="landing-btn-ghost">Ver precios completos →</Link>
              <p className="alto-label-sm" style={{ color: '#6B6B6B', marginTop: '1.2rem' }}>
                NO NECESITAS TARJETA PARA EMPEZAR · 30 DÍAS DE PRUEBA GRATIS
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="cta-pad" style={{ background: '#0A0A0A', padding: '8rem 3rem', textAlign: 'center', borderTop: '1.5px solid #0A0A0A', borderBottom: '1.5px solid #0A0A0A' }}>
        <div className="fade-up" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: '"Inter Tight", sans-serif', fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 3.8rem)', letterSpacing: '-0.04em', lineHeight: 0.92, color: '#F1EFEA', marginBottom: '1.5rem' }}>
            TU PRÓXIMA BODA<span style={{ color: '#7B7FE0' }}>.</span><br />
            <span style={{ opacity: 0.45 }}>SIN CAOS.</span>
          </h2>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: 'rgba(241,239,234,0.50)', lineHeight: 1.8, marginBottom: '2.5rem' }}>
            Únete a los fotógrafos que ya corren su día de boda con un timeline que todo su equipo realmente sigue.
          </p>
          <Link to="/register" className="landing-btn-white">Empieza gratis →</Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer-pad" style={{ background: '#F7F5F0', borderTop: '1.5px solid #0A0A0A', padding: '1.5rem 3rem' }}>
        <div className="footer-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <Logo size="sm" variant="paper" />
          <ul style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
            {!FREE_FOR_ALL && (
            <li><Link to="/pricing" className="alto-label-sm" style={{ color: '#6B6B6B', textDecoration: 'none' }}>Precios</Link></li>
          )}
            <li><Link to="/login" className="alto-label-sm" style={{ color: '#6B6B6B', textDecoration: 'none' }}>Iniciar sesión</Link></li>
            <li><Link to="/register" className="alto-label-sm" style={{ color: '#6B6B6B', textDecoration: 'none' }}>Registrarse</Link></li>
            <li><Link to="/privacy" className="alto-label-sm" style={{ color: '#6B6B6B', textDecoration: 'none' }}>Privacidad</Link></li>
          </ul>
          <span className="alto-label-sm" style={{ color: '#6B6B6B' }}>© 2026 LENZU · HECHA PARA FOTÓGRAFOS</span>
        </div>
      </footer>
    </div>
  );
}
