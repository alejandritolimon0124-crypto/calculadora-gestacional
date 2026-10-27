import { useEffect, useState } from 'react';
import { useStoredState } from './useStoredState';

const dateTimeValue = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const displayDateTime = value => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const id = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

export function Appointments() {
  const [appointment, setAppointment] = useStoredState('gestacion:cita', null);
  const [dateTime, setDateTime] = useState(appointment?.dateTime || '');

  function save(event) {
    event.preventDefault();
    const date = new Date(dateTime);
    if (!dateTime || Number.isNaN(date.getTime())) return;
    setAppointment({ dateTime: date.toISOString() });
  }

  return <section className="tool-page" aria-labelledby="citas-title">
    <div className="tool-heading"><span className="tool-heading-icon" aria-hidden="true">📅</span><div><h1 id="citas-title">Mi próxima cita</h1><p>Guarda la fecha y la hora para tenerlas a mano.</p></div></div>
    <div className="tool-card">
      {appointment && <div className="saved-highlight"><span>PRÓXIMA CITA GUARDADA</span><strong>{displayDateTime(appointment.dateTime)}</strong></div>}
      <form onSubmit={save} className="stack-form">
        <label htmlFor="appointment-date">Fecha y hora</label>
        <input id="appointment-date" type="datetime-local" required value={dateTime} onChange={event => setDateTime(event.target.value)} />
        <button className="primary-action" type="submit">{appointment ? 'Actualizar cita' : 'Guardar cita'}</button>
      </form>
      {appointment && <button className="text-action" type="button" onClick={() => { setAppointment(null); setDateTime(''); }}>Quitar cita guardada</button>}
    </div>
    <p className="storage-note">Esta cita se guarda en este dispositivo. No envía recordatorios.</p>
  </section>;
}

const TRIMESTERS = [
  { title: 'Primer trimestre', range: 'Semanas 0 a 13', symptoms: ['Náuseas', 'Cansancio', 'Senos sensibles', 'Orinar con frecuencia', 'Cambios en el olfato'] },
  { title: 'Segundo trimestre', range: 'Semanas 14 a 27', symptoms: ['Acidez', 'Estreñimiento', 'Dolor de espalda', 'Calambres en piernas', 'Congestión nasal'] },
  { title: 'Tercer trimestre', range: 'Desde la semana 28', symptoms: ['Acidez', 'Cansancio', 'Dificultad para dormir', 'Dolor de espalda o pelvis', 'Hinchazón leve de pies'] },
];

export function Symptoms({ currentWeek }) {
  const [trimester, setTrimester] = useState(currentWeek == null ? 0 : currentWeek < 14 ? 0 : currentWeek < 28 ? 1 : 2);
  const [records, setRecords] = useStoredState('gestacion:sintomas', []);
  const [week, setWeek] = useState(currentWeek == null ? '' : String(currentWeek));
  const [symptom, setSymptom] = useState('');

  function save(event) {
    event.preventDefault();
    const parsedWeek = Number(week);
    if (!Number.isInteger(parsedWeek) || parsedWeek < 0 || parsedWeek > 44 || !symptom.trim()) return;
    setRecords(previous => [{ id: id(), week: parsedWeek, symptom: symptom.trim(), createdAt: new Date().toISOString() }, ...previous]);
    setSymptom('');
  }

  return <section className="tool-page" aria-labelledby="symptoms-title">
    <div className="tool-heading"><span className="tool-heading-icon" aria-hidden="true">♡</span><div><h1 id="symptoms-title">Síntomas</h1><p>Consulta los habituales y anota los tuyos.</p></div></div>
    <div className="tool-card">
      <h2>Síntomas comunes</h2>
      <div className="subtabs" role="group" aria-label="Trimestre">
        {TRIMESTERS.map((item, index) => <button key={item.title} type="button" aria-pressed={trimester === index} className={trimester === index ? 'active' : ''} onClick={() => setTrimester(index)}>{index + 1}º trimestre</button>)}
      </div>
      <p className="range-label">{TRIMESTERS[trimester].range}</p>
      <div className="symptom-chips">{TRIMESTERS[trimester].symptoms.map(item => <span key={item}>{item}</span>)}</div>
    </div>
    <div className="tool-card">
      <h2>Mis síntomas</h2>
      <form onSubmit={save} className="stack-form">
        <label htmlFor="symptom-week">¿En qué semana estás?</label>
        <input id="symptom-week" type="number" inputMode="numeric" min="0" max="44" required value={week} onChange={event => setWeek(event.target.value)} />
        <label htmlFor="symptom-description">¿Qué sientes?</label>
        <textarea id="symptom-description" rows="3" maxLength="300" required placeholder="Ejemplo: náuseas por la mañana" value={symptom} onChange={event => setSymptom(event.target.value)} />
        <button className="primary-action" type="submit">Guardar síntoma</button>
      </form>
      {records.length > 0 && <div className="record-list" aria-label="Síntomas guardados">{records.map(record => <div className="record-item" key={record.id}><div><strong>Semana {record.week}</strong><span>{displayDateTime(record.createdAt)}</span><p>{record.symptom}</p></div><button type="button" className="delete-action" aria-label={`Borrar síntoma de la semana ${record.week}`} onClick={() => setRecords(previous => previous.filter(item => item.id !== record.id))}>Borrar</button></div>)}</div>}
    </div>
    <p className="care-note">Si hay sangrado, dolor intenso, dolor de cabeza fuerte, visión borrosa, salida de líquido o menos movimientos del bebé, contacta a tu equipo médico.</p>
  </section>;
}

function elapsedLabel(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function Labor() {
  const [contractions, setContractions] = useStoredState('gestacion:contracciones', []);
  const [startedAt, setStartedAt] = useStoredState('gestacion:contraccion-activa', null);
  const [waterBreak, setWaterBreak] = useStoredState('gestacion:ruptura-fuente', null);
  const [now, setNow] = useState(0);
  const [waterDateTime, setWaterDateTime] = useState(waterBreak ? dateTimeValue(new Date(waterBreak)) : dateTimeValue());

  useEffect(() => {
    if (!startedAt) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  function stopTimer() {
    if (!startedAt) return;
    const end = new Date();
    const start = new Date(startedAt);
    setContractions(previous => [{ id: id(), startedAt, endedAt: end.toISOString(), durationMs: Math.max(0, end - start) }, ...previous]);
    setStartedAt(null);
  }

  function saveWater(event) {
    event.preventDefault();
    const date = new Date(waterDateTime);
    if (!waterDateTime || Number.isNaN(date.getTime())) return;
    setWaterBreak(date.toISOString());
  }

  return <section className="tool-page" aria-labelledby="labor-title">
    <div className="tool-heading"><span className="tool-heading-icon" aria-hidden="true">⏱</span><div><h1 id="labor-title">Parto</h1><p>Registra contracciones y ruptura de fuente.</p></div></div>
    <div className="tool-card">
      <h2>Contracciones</h2>
      <p className="short-help">Toca «Iniciar» cuando empiece. Toca «Detener» cuando termine.</p>
      <div className="timer-display" aria-live="off">{startedAt ? elapsedLabel(now - new Date(startedAt).getTime()) : '00:00'}<span>minutos : segundos</span></div>
      {startedAt ? <button className="primary-action timer-button" type="button" onClick={stopTimer}>Detener y guardar</button> : <button className="primary-action timer-button" type="button" onClick={() => { setStartedAt(new Date().toISOString()); setNow(Date.now()); }}>Iniciar contracción</button>}
      <div className="count-line">Contracciones registradas: <strong>{contractions.length}</strong></div>
      {contractions.length > 0 && <div className="record-list" aria-label="Contracciones guardadas">{contractions.map((record, index) => <div className="record-item" key={record.id}><div><strong>#{contractions.length - index} · {elapsedLabel(record.durationMs)} min</strong><span>{displayDateTime(record.startedAt)}</span></div><button type="button" className="delete-action" aria-label={`Borrar contracción ${contractions.length - index}`} onClick={() => setContractions(previous => previous.filter(item => item.id !== record.id))}>Borrar</button></div>)}</div>}
    </div>
    <div className="tool-card">
      <h2>¿Se rompió la fuente?</h2>
      {waterBreak && <div className="saved-highlight"><span>HORA GUARDADA</span><strong>{displayDateTime(waterBreak)}</strong></div>}
      <form onSubmit={saveWater} className="stack-form"><label htmlFor="water-time">Fecha y hora en que ocurrió</label><input id="water-time" type="datetime-local" required value={waterDateTime} onChange={event => setWaterDateTime(event.target.value)} /><button className="primary-action" type="submit">{waterBreak ? 'Actualizar hora' : 'Guardar hora'}</button></form>
      {waterBreak && <button type="button" className="text-action" onClick={() => setWaterBreak(null)}>Quitar registro</button>}
      <p className="care-note water-guidance">Si se rompe la fuente, guarda la calma. Puede ocurrir antes de que empiece el trabajo de parto y sin una causa aparente. Anota la hora y avísame en cuanto suceda; te daré indicaciones.</p>
      <a className="water-call" href="tel:+528441892008">☎ Avisar al Dr. Alex: 844 189 2008</a>
      <p className="water-warning">Si hay sangrado, el líquido es verde u oscuro, tu bebé se mueve menos o aún no cumples 37 semanas, busca atención médica inmediata.</p>
    </div>
  </section>;
}

const DIETS = [
  { title: 'Primer trimestre', range: 'Antes y semanas 0 a 13', image: '/dietas/primer-trimestre.jpg' },
  { title: 'Segundo trimestre', range: 'Semanas 14 a 27', image: '/dietas/segundo-trimestre.jpg' },
  { title: 'Tercer trimestre', range: 'Desde la semana 28', image: '/dietas/tercer-trimestre.jpg' },
  { title: 'Lactancia', range: 'Después del nacimiento', image: '/dietas/lactancia.jpg' },
];

export function Diets({ currentWeek }) {
  const [selected, setSelected] = useState(currentWeek == null ? 0 : currentWeek < 14 ? 0 : currentWeek < 28 ? 1 : 2);
  const [enlarged, setEnlarged] = useState(false);
  const diet = DIETS[selected];

  useEffect(() => {
    if (!enlarged) return undefined;
    function onKey(event) { if (event.key === 'Escape') setEnlarged(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enlarged]);

  return <section className="tool-page diet-page" aria-labelledby="diets-title">
    <div className="tool-heading"><span className="tool-heading-icon" aria-hidden="true">🍽</span><div><h1 id="diets-title">Dietas</h1><p>Planes del Dr. Alex Mercado.</p></div></div>
    <div className="tool-card">
      <h2>Cómo usar la lámina</h2>
      <ol className="diet-instructions"><li><strong>Arriba:</strong> busca la comida del día: desayuno, colación, comida o cena.</li><li><strong>Cuenta los puntos</strong> de cada fila. Cada punto es una porción de ese grupo de alimentos.</li><li><strong>Abajo:</strong> elige una opción de la columna de ese grupo por cada punto. No tienes que comer toda la lista.</li></ol>
      <p className="example-note">Ejemplo: si hay 2 puntos en «Frutas», elige 2 porciones de las opciones de frutas de abajo.</p>
    </div>
    <div className="diet-tabs" role="group" aria-label="Plan de alimentación">{DIETS.map((item, index) => <button type="button" key={item.title} className={selected === index ? 'active' : ''} aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.title}</button>)}</div>
    <div className="tool-card diet-image-card"><h2>{diet.title}</h2><p className="range-label">{diet.range}</p><button type="button" className="diet-image-button" onClick={() => setEnlarged(true)} aria-label={`Ampliar plan de ${diet.title}`}><img src={diet.image} alt={`Lámina completa del plan de alimentación para ${diet.title.toLowerCase()}`} /></button><button type="button" className="secondary-action" onClick={() => setEnlarged(true)}>Ver imagen grande</button></div>
    {selected !== 3 && <p className="care-note"><strong>Atención:</strong> la lámina original menciona hígado. Evítalo durante el embarazo por su alto contenido de vitamina A. El plan debe ajustarse contigo y tu profesional de salud; no sigas las calorías como un límite fijo.</p>}
    {enlarged && <div className="image-overlay" role="dialog" aria-modal="true" aria-label={`Plan de ${diet.title}`} onClick={() => setEnlarged(false)}><div className="image-dialog" onClick={event => event.stopPropagation()}><button type="button" className="close-image" onClick={() => setEnlarged(false)}>Cerrar ✕</button><div className="image-scroll"><img src={diet.image} alt={`Lámina completa del plan de alimentación para ${diet.title.toLowerCase()}`} /></div></div></div>}
  </section>;
}
