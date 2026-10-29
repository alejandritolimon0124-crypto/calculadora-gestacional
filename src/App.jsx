import { useEffect, useMemo, useState } from 'react';
import { babyGrowthAtWeek } from './babyGrowth';
import doctorLogo from './assets/logo-doctor-cropped.png';
import { Appointments, Symptoms, Labor, Diets } from './sections';
import Emergency from './Emergency';
import './App.css';
import './sections.css';

const KEY = 'calcData';
const DAY = 86400000;
const SHARE_URL = 'https://dralexmercado.com.mx/calculadora';
const APPOINTMENT_URL = 'https://wa.me/528446001824?text=Hola%20Dr.%20Alex%20Mercado%2C%20me%20gustar%C3%ADa%20reservar%20una%20cita.';

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
function addDays(date, days) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function daysBetween(start, end) { return Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / DAY); }
function formatDate(date) { return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(date); }
function formatLength(value) { return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(value); }
function todayValue() { const now = new Date(); return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'); }
function saved() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } }
const initial = saved();

export default function App() {
  const [mode, setMode] = useState(['fur', 'us', 'manual'].includes(initial.mode) ? initial.mode : 'fur');
  const [fur, setFur] = useState(initial.fur || '');
  const [usDate, setUsDate] = useState(initial.usDate || '');
  const [usWeeks, setUsWeeks] = useState(initial.usWeeks || '');
  const [usDays, setUsDays] = useState(initial.usDays || '');
  const [manualWeeks, setManualWeeks] = useState(initial.manualWeeks ?? '');
  const [manualDays, setManualDays] = useState(initial.manualDays ?? '');
  const [shareStatus, setShareStatus] = useState('');
  const [activeSection, setActiveSection] = useState(() => window.location.hash === '#urgencias' ? 'urgencias' : 'inicio');
  const today = todayValue();

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ mode, fur, usDate, usWeeks, usDays, manualWeeks, manualDays })); }
    catch { /* El cálculo también funciona si no se puede guardar. */ }
  }, [mode, fur, usDate, usWeeks, usDays, manualWeeks, manualDays]);

  useEffect(() => {
    const onHashChange = () => setActiveSection(window.location.hash === '#urgencias' ? 'urgencias' : 'inicio');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const error = useMemo(() => {
    if (mode === 'fur') {
      if (!fur) return '';
      const date = parseDate(fur);
      if (!date || fur > today) return 'Revisa la fecha.';
      if (daysBetween(date, new Date()) > 308) return 'Fecha fuera de rango. Revísala.';
      return '';
    }
    if (mode === 'manual') {
      if (manualWeeks === '') return manualDays === '' ? '' : 'Ingresa tus semanas.';
      const weeks = Number(manualWeeks), days = manualDays === '' ? 0 : Number(manualDays);
      if (!Number.isInteger(weeks) || weeks < 0 || weeks > 42 || !Number.isInteger(days) || days < 0 || days > 6) return 'Usa 0–42 semanas y 0–6 días.';
      return '';
    }
    if (!usDate && usWeeks === '' && usDays === '') return '';
    if (!usDate || usWeeks === '') return 'Completa la fecha y las semanas.';
    if (!parseDate(usDate) || usDate > today) return 'Revisa la fecha.';
    const weeks = Number(usWeeks), days = usDays === '' ? 0 : Number(usDays);
    if (!Number.isInteger(weeks) || weeks < 0 || weeks > 42 || !Number.isInteger(days) || days < 0 || days > 6) return 'Usa 0–42 semanas y 0–6 días.';
    if (weeks * 7 + days + daysBetween(parseDate(usDate), new Date()) > 308) return 'Datos fuera de rango. Revísalos.';
    return '';
  }, [mode, fur, usDate, usWeeks, usDays, manualWeeks, manualDays, today]);

  const result = useMemo(() => {
    if (error) return null;
    if (mode === 'manual') {
      if (manualWeeks === '') return null;
      const weeks = Number(manualWeeks), days = Number(manualDays || 0);
      return { weeks, days, due: addDays(parseDate(today), 280 - weeks * 7 - days), manual: true };
    }
    let base;
    if (mode === 'fur' && fur) base = parseDate(fur);
    if (mode === 'us' && usDate && usWeeks !== '') base = addDays(parseDate(usDate), -(Number(usWeeks) * 7 + Number(usDays || 0)));
    if (!base) return null;
    const total = daysBetween(base, new Date());
    if (total < 0 || total > 308) return null;
    return { weeks: Math.floor(total / 7), days: total % 7, due: addDays(base, 280) };
  }, [mode, fur, usDate, usWeeks, usDays, manualWeeks, manualDays, today, error]);
  const growth = result ? babyGrowthAtWeek(result.weeks, result.days) : null;

  async function shareCalculator() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Calculadora de embarazo', url: SHARE_URL });
        return;
      }
      await navigator.clipboard.writeText(SHARE_URL);
      setShareStatus('Enlace copiado');
    } catch (error) {
      if (error.name !== 'AbortError') setShareStatus('No se pudo compartir');
    }
  }
  const sections = [
    { key: 'inicio', icon: '♡', label: 'Inicio' },
    { key: 'citas', icon: '▦', label: 'Citas' },
    { key: 'urgencias', icon: '✚', label: 'Urgencias' },
    { key: 'sintomas', icon: '✎', label: 'Síntomas' },
    { key: 'parto', icon: '⏱', label: 'Parto' },
    { key: 'dietas', icon: '◈', label: 'Dietas' },
  ];
  function selectSection(key) {
    setActiveSection(key);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${key === 'urgencias' ? '#urgencias' : ''}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return <div className="app-shell">
    <header className="brand-bar"><div className="wrap brand-inner"><img src={doctorLogo} alt="Dr. Alex Mercado · Ginecología, obstetricia y colposcopía" /><a className="booking-button" href={APPOINTMENT_URL} target="_blank" rel="noreferrer">Reservar una cita ↗</a></div></header>
    <nav className="app-nav" aria-label="Secciones de la app"><div className="app-nav-inner">{sections.map(section => <button key={section.key} type="button" className={`${activeSection === section.key ? 'active' : ''} ${section.key === 'urgencias' ? 'urgent-nav-button' : ''}`} aria-current={activeSection === section.key ? 'page' : undefined} onClick={() => selectSection(section.key)}><span aria-hidden="true">{section.icon}</span><small>{section.label}</small></button>)}</div></nav>
    <main className="wrap main-content">
      {activeSection === 'citas' && <Appointments />}
      {activeSection === 'sintomas' && <Symptoms currentWeek={result?.weeks} />}
      {activeSection === 'parto' && <Labor />}
      {activeSection === 'dietas' && <Diets currentWeek={result?.weeks} />}
      {activeSection === 'urgencias' && <Emergency />}
      {activeSection === 'inicio' && <>
      <h1 className="page-title">Conoce tus semanas de embarazo</h1>
      <div className="main-grid">
        <section className="entry-card" aria-label="Datos para calcular">
          <div className="method-switch" role="group" aria-label="Método de cálculo">
            <button type="button" className={mode === 'fur' ? 'selected' : ''} aria-pressed={mode === 'fur'} onClick={() => setMode('fur')}>Última regla</button>
            <button type="button" className={mode === 'us' ? 'selected' : ''} aria-pressed={mode === 'us'} onClick={() => setMode('us')}>Ultrasonido</button>
            <button type="button" className={mode === 'manual' ? 'selected' : ''} aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>Por semana</button>
          </div>
          {mode === 'fur' && <div className="fields"><label htmlFor="fur">Primer día de tu última regla</label><input id="fur" type="date" max={today} value={fur} onChange={event => setFur(event.target.value)} /></div>}
          {mode === 'us' && <div className="fields"><label htmlFor="us-date">Fecha del ultrasonido</label><input id="us-date" type="date" max={today} value={usDate} onChange={event => setUsDate(event.target.value)} /><div className="field-pair"><div><label htmlFor="us-weeks">Semanas</label><input id="us-weeks" type="number" inputMode="numeric" min="0" max="42" placeholder="12" value={usWeeks} onChange={event => setUsWeeks(event.target.value)} /></div><div><label htmlFor="us-days">Días</label><input id="us-days" type="number" inputMode="numeric" min="0" max="6" placeholder="3" value={usDays} onChange={event => setUsDays(event.target.value)} /></div></div></div>}
          {mode === 'manual' && <div className="fields"><p className="manual-prompt">¿Cuántas semanas tienes hoy?</p><div className="field-pair manual-pair"><div><label htmlFor="manual-weeks">Semanas</label><input id="manual-weeks" type="number" inputMode="numeric" min="0" max="42" placeholder="Ej. 20" value={manualWeeks} onChange={event => setManualWeeks(event.target.value)} /></div><div><label htmlFor="manual-days">Días</label><input id="manual-days" type="number" inputMode="numeric" min="0" max="6" placeholder="0" value={manualDays} onChange={event => setManualDays(event.target.value)} /></div></div></div>}
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="entry-share"><button className="share-button" type="button" onClick={shareCalculator}><span aria-hidden="true">↗</span> Compartir calculadora</button><span role="status">{shareStatus}</span></div>
        </section>
        <section className={'summary-card' + (result ? ' ready' : '')} aria-live="polite" aria-label="Resultado de la calculadora">
          {result ? <>
            <div className="visual-scene">
              <div className="baby-visual">{growth.image ? <img src={growth.image} alt={`Ilustración orientativa del desarrollo fetal: ${growth.imageStage}`} /> : <span aria-hidden="true">✳</span>}</div>
              <div className="compare-visual" role="img" aria-label={`Referencia de tamaño: ${growth.comparisonName}`}><span className="compare-emoji" aria-hidden="true">{growth.visual}</span><span className="compare-name">{growth.comparisonName}</span></div>
            </div>
            <p className="length-line">{growth.length === null ? result.weeks > 40 ? 'Mi talla se valora en consulta' : 'Aún es pronto para estimar mi longitud' : <>En esta semana mido aprox. <strong>{formatLength(growth.length)} cm</strong><small>{growth.lengthBasis}</small></>}</p>
            <div className="week-display"><strong>{result.weeks} semanas, {result.days} días</strong></div>
            <div className="facts-row">
              <div className="fact"><span>FECHA MÁXIMA PARA EL PARTO</span><strong>{formatDate(result.due)}</strong></div>
            </div>
          </> : <div className="empty-result"><span aria-hidden="true">♡</span><strong>Tu bebé, semana a semana</strong><p>{mode === 'manual' ? 'Escribe tus semanas para ver a tu bebé.' : 'Ingresa una fecha para ver tu resultado.'}</p></div>}
        </section>
      </div>
      <div className="share-actions"><button className="share-button" type="button" onClick={shareCalculator}><span aria-hidden="true">↗</span> Compartir calculadora</button><span role="status">{shareStatus}</span></div>
      </>}
    </main>
  </div>;
}
