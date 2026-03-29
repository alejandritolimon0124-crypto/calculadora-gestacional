import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

import logoDoctor from './assets/logo-doctor.png';
import logoMaternidad from './assets/logo-maternidad.png';
import logoAXM from './assets/logo-axm.png';

const STORAGE_KEY = 'calcData';
const APP_SHARE_URL = 'https://calculadora-gestacional.vercel.app/?v=7';

function readSavedData() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function diffInDays(start, end) {
  const startCopy = new Date(start);
  const endCopy = new Date(end);
  const ms = endCopy.setHours(12, 0, 0, 0) - startCopy.setHours(12, 0, 0, 0);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function gestationFromDays(totalDays) {
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days };
}

function trimesterFromWeeks(weeks) {
  if (weeks <= 13) return 'Primer trimestre';
  if (weeks <= 27) return 'Segundo trimestre';
  return 'Tercer trimestre';
}

function approximateBabyData(weeks) {
  const table = [
    { w: 8, length: '1.6 cm', weight: '< 2 g' },
    { w: 12, length: '5.4 cm', weight: '14 g' },
    { w: 16, length: '11.6 cm', weight: '100 g' },
    { w: 20, length: '16.4 cm', weight: '300 g' },
    { w: 24, length: '30 cm', weight: '600 g' },
    { w: 28, length: '37.6 cm', weight: '1 kg' },
    { w: 32, length: '42.4 cm', weight: '1.7 kg' },
    { w: 36, length: '47.4 cm', weight: '2.6 kg' },
    { w: 40, length: '51.2 cm', weight: '3.4 kg' },
  ];

  let closest = table[0];
  for (const item of table) {
    if (weeks >= item.w) closest = item;
  }
  return closest;
}

function weeklyTips(weeks) {
  if (weeks < 12) return 'Etapa clave: inicia ácido fólico y control prenatal temprano.';
  if (weeks < 20) return 'Momento ideal para ultrasonido estructural y seguimiento médico.';
  if (weeks < 28) return 'Vigila movimientos fetales, crecimiento y tus controles.';
  if (weeks < 36) return 'Controla presión arterial y reconoce signos de alarma.';
  return 'Preparación para parto: monitoreo cercano y valoración final.';
}

function urgencyMessage(weeks) {
  if (weeks < 12) return 'Primera etapa crítica: agenda tu valoración.';
  if (weeks < 28) return 'Seguimiento adecuado = embarazo más seguro.';
  return 'Etapa final: evita riesgos y acude a revisión.';
}

function cardStyle() {
  return {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 18px 45px rgba(125, 98, 115, 0.12)',
    border: '1px solid rgba(214, 188, 196, 0.4)',
  };
}

function labelStyle() {
  return {
    display: 'block',
    fontSize: '14px',
    fontWeight: 700,
    color: '#6d5a63',
    marginBottom: '8px',
  };
}

function inputStyle() {
  return {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid #d9c7ce',
    background: '#fff',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
  };
}

function smallCard(title, value) {
  return { title, value };
}

export default function App() {
  const initialData = readSavedData();

  const [fur, setFur] = useState(initialData.fur || '');
  const [usDate, setUsDate] = useState(initialData.usDate || '');
  const [usWeeks, setUsWeeks] = useState(initialData.usWeeks || '');
  const [usDays, setUsDays] = useState(initialData.usDays || '');
  const [mode, setMode] = useState(initialData.mode || 'fur');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fur, usDate, usWeeks, usDays, mode })
      );
    } catch {
      // no-op
    }
  }, [fur, usDate, usWeeks, usDays, mode]);

  const whatsappLink =
    'https://wa.me/528443934366?text=Hola%20Dr.%20Alex%20Mercado,%20acabo%20de%20usar%20su%20calculadora%20gestacional%20y%20me%20gustar%C3%ADa%20agendar%20una%20consulta%20para%20seguimiento%20de%20mi%20embarazo';

  const result = useMemo(() => {
    let baseDate;

    if (mode === 'us' && usDate && usWeeks !== '') {
      const scanDate = new Date(`${usDate}T12:00:00`);
      const baseDays = parseInt(usWeeks || '0', 10) * 7 + parseInt(usDays || '0', 10);
      baseDate = addDays(scanDate, -baseDays);
    } else if (mode === 'fur' && fur) {
      baseDate = new Date(`${fur}T12:00:00`);
    } else {
      return null;
    }

    if (Number.isNaN(baseDate.getTime())) return null;

    const totalDays = diffInDays(baseDate, new Date());
    if (Number.isNaN(totalDays) || totalDays < 0) return null;

    const { weeks, days } = gestationFromDays(totalDays);

    return {
      weeks,
      days,
      trimester: trimesterFromWeeks(weeks),
      fpp: addDays(baseDate, 280),
      baby: approximateBabyData(weeks),
      tip: weeklyTips(weeks),
      urgency: urgencyMessage(weeks),
    };
  }, [fur, usDate, usWeeks, usDays, mode]);

  useEffect(() => {
    if (typeof window === 'undefined' || !result) return;
    try {
      const current = parseInt(window.localStorage.getItem('usageCount') || '0', 10);
      window.localStorage.setItem('usageCount', String(current + 1));
    } catch {
      // no-op
    }
  }, [result?.weeks, result?.days, result?.trimester]);

  const dataCards = result
    ? [
        smallCard('Trimestre actual', result.trimester),
        smallCard('Fecha probable de parto', formatDate(result.fpp)),
        smallCard('Longitud aproximada', result.baby.length),
        smallCard('Peso aproximado', result.baby.weight),
      ]
    : [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fff8fa 0%, #fffdfd 48%, #fff5f7 100%)',
        padding: '24px 16px 48px',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '0px', position: 'relative', paddingTop: '0px' }}>
          <img
            src={logoDoctor}
            alt="Dr. Alex Mercado"
            style={{ maxWidth: '280px', width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
          />

          <div style={{ marginTop: '-35px' }}>
            <img
              src={logoMaternidad}
              alt="Maternidad 360"
              style={{ maxWidth: '250px', width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
            />
          </div>

          <h1
            style={{
              margin: '6px 0 2px',
              fontSize: '20px',
              lineHeight: 1.2,
              color: '#53434a',
            }}
          >
            {result ? (
              <>
                <span style={{ display: 'block' }}>Tu bebé tiene {result.weeks} semanas 💕</span>
                <span style={{ display: 'block', fontSize: '16px', fontWeight: 600 }}>
                  ({result.trimester})
                </span>
              </>
            ) : (
              'Semanas de embarazo al instante'
            )}
          </h1>
          <p
            style={{
              margin: '0px',
              lineHeight: 1.2,
              fontSize: '15px',
              color: '#7a6871',
              maxWidth: '520px',
              marginInline: 'auto',
            }}
          >
            Obtén fácil y rápido las semanas de gestación de tu bebé
          </p>
        </div>

        <div style={{ ...cardStyle(), marginBottom: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <button
              onClick={() => setMode('fur')}
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                border: mode === 'fur' ? '1px solid #c98ca0' : '1px solid #e4d5da',
                background: mode === 'fur' ? '#f8e7ed' : '#fff',
                color: '#5e4b53',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Calcular por FUR
            </button>

            <button
              onClick={() => setMode('us')}
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                border: mode === 'us' ? '1px solid #c98ca0' : '1px solid #e4d5da',
                background: mode === 'us' ? '#f8e7ed' : '#fff',
                color: '#5e4b53',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Calcular por ultrasonido
            </button>
          </div>

          {mode === 'fur' ? (
            <div>
              <label style={labelStyle()}>Fecha de última regla</label>
              <input
                type="date"
                value={fur}
                onChange={(e) => setFur(e.target.value)}
                style={inputStyle()}
              />
              <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#8a7a82' }}>
                Úsalo cuando la fecha de última menstruación sea confiable.
              </p>
            </div>
          ) : (
            <div>
              <label style={labelStyle()}>Fecha del ultrasonido</label>
              <input
                type="date"
                value={usDate}
                onChange={(e) => setUsDate(e.target.value)}
                style={{ ...inputStyle(), marginBottom: '14px' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle()}>Semanas reportadas</label>
                  <input
                    placeholder="Ej. 12"
                    type="number"
                    value={usWeeks}
                    onChange={(e) => setUsWeeks(e.target.value)}
                    style={inputStyle()}
                  />
                </div>
                <div>
                  <label style={labelStyle()}>Días reportados</label>
                  <input
                    placeholder="Ej. 3"
                    type="number"
                    value={usDays}
                    onChange={(e) => setUsDays(e.target.value)}
                    style={inputStyle()}
                  />
                </div>
              </div>
              <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#8a7a82' }}>
                Ideal para actualizar la edad gestacional a partir de un ultrasonido previo.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none', flex: 1 }}
              onClick={() => {
                if (typeof window === 'undefined') return;
                try {
                  const clicks = parseInt(window.localStorage.getItem('consultClicks') || '0', 10);
                  window.localStorage.setItem('consultClicks', String(clicks + 1));
                } catch {
                  // no-op
                }
              }}
            >
              <button
                style={{
                  width: '100%',
                  padding: '15px 10px',
                  border: 'none',
                  borderRadius: '16px',
                  background: '#25D366',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 14px 24px rgba(37, 211, 102, 0.25)',
                }}
              >
                Agenda una consulta conmigo
              </button>
            </a>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  try {
                    const shares = parseInt(window.localStorage.getItem('shareClicks') || '0', 10);
                    window.localStorage.setItem('shareClicks', String(shares + 1));
                  } catch {
                    // no-op
                  }
                }
                const url = APP_SHARE_URL;
                if (navigator.share) {
                  navigator.share({ url });
                } else {
                  window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
                }
              }}
              style={{
                flex: 1,
                padding: '15px 10px',
                border: 'none',
                borderRadius: '16px',
                background: '#ff6f61',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Compartir con otra mamá
            </button>
          </div>
        </div>

        <div style={cardStyle()}>
          {result ? (
            <>
              <div
                style={{
                  background: 'linear-gradient(135deg, #fff1f5, #ffe4ec)',
                  border: '1px solid #f3c6d3',
                  borderRadius: '20px',
                  padding: '16px',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 700, color: '#8a4b63', fontSize: '14px', marginBottom: '6px' }}>
                  ¿Estás embarazada o planeando un embarazo?
                </div>
                <div style={{ fontSize: '13px', color: '#6f5a63', marginBottom: '12px' }}>
                  Únete a mi Diplomado Maternidad 360 y vive tu embarazo con información, seguridad y acompañamiento.
                </div>
                <a
                  href="https://wa.me/528443934366?text=Hola%20Dr.%20Alex%20Mercado,%20quiero%20informes%20del%20Diplomado%20Maternidad%20360"
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    style={{
                      background: '#c98ca0',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '12px 18px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Quiero información del diplomado
                  </button>
                </a>
              </div>

              <div
                style={{
                  background: '#fff3f7',
                  border: '1px solid #f0d6df',
                  borderRadius: '18px',
                  padding: '14px 16px',
                  marginBottom: '12px',
                  textAlign: 'center',
                  color: '#745664',
                  fontSize: '13px',
                  lineHeight: 1.4,
                }}
              >
                <strong>{result.tip}</strong>
              </div>

              <div
                style={{
                  background: '#fff0f0',
                  border: '1px solid #f0d0d0',
                  borderRadius: '18px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  color: '#7c5b5b',
                  fontSize: '13px',
                  lineHeight: 1.4,
                }}
              >
                <strong>{result.urgency}</strong>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#f7e7ec',
                    color: '#9a6174',
                    padding: '8px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Edad gestacional actual
                </div>
                <div style={{ fontSize: '84px', fontWeight: 700, lineHeight: 1, color: '#524149', marginTop: '14px' }}>
                  {result.weeks}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#6f5a63' }}>
                  semanas + {result.days} días
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {dataCards.map((item) => (
                  <div
                    key={item.title}
                    style={{
                      background: '#fff7f9',
                      border: '1px solid #eedde3',
                      borderRadius: '18px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#8d7b83', marginBottom: '8px', fontWeight: 700 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '17px', color: '#55454c', fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '18px',
                  background: '#fff8ef',
                  border: '1px solid #f0dfb9',
                  borderRadius: '18px',
                  padding: '16px',
                  fontSize: '13px',
                  color: '#7a6848',
                  lineHeight: 1.55,
                }}
              >
                <strong>Cálculo orientativo.</strong> La edad gestacional definitiva debe correlacionarse con valoración médica y ultrasonido, especialmente si existen discrepancias.
              </div>

              <div
                style={{
                  marginTop: '14px',
                  background: '#f8f5f6',
                  border: '1px solid #e8dee2',
                  borderRadius: '18px',
                  padding: '16px',
                  fontSize: '13px',
                  color: '#706068',
                  lineHeight: 1.55,
                }}
              >
                <strong>Lógica clínica orientativa:</strong> si la FUR es confiable, puede utilizarse como base inicial. Si el ultrasonido temprano muestra discrepancias relevantes, debe darse prioridad a la correlación clínica y médica con ultrasonido.
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#5b4b52', marginBottom: '10px' }}>
                Ingresa tus datos
              </div>
              <div style={{ fontSize: '15px', color: '#83717a', lineHeight: 1.6 }}>
                Selecciona el método de cálculo y obtén semanas de embarazo, trimestre actual, fecha probable de parto y medidas aproximadas del bebé.
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '0px' }}>
          <img
            src={logoAXM}
            alt="AXM Technologies"
            style={{
              maxWidth: '160px',
              width: '100%',
              height: 'auto',
              opacity: 0.8,
              display: 'block',
              margin: '0 auto -48px',
            }}
          />
          <div style={{ color: '#96828b', fontSize: '13px', marginTop: '0px', lineHeight: 1 }}>
            powered by AXM technologies
          </div>
        </div>
      </div>
    </div>
  );
}
