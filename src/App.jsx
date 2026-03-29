// 🔥 VERSION ESCALAMIENTO PACIENTES
// Se agregan: recomendaciones por semana + urgencia + CTA inteligente

import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

import logoDoctor from './assets/logo-doctor.png';
import logoMaternidad from './assets/logo-maternidad.png';
import logoAXM from './assets/logo-axm.png';

const STORAGE_KEY = 'calcData';
const APP_SHARE_URL = 'https://calculadora-gestacional.vercel.app/?v=7';

function weeklyTips(weeks) {
  if (weeks < 12) return 'Etapa clave: inicia ácido fólico y control prenatal temprano';
  if (weeks < 20) return 'Momento ideal para ultrasonido estructural y seguimiento';
  if (weeks < 28) return 'Vigila movimientos fetales y crecimiento';
  if (weeks < 36) return 'Controla presión arterial y signos de alarma';
  return 'Preparación para parto: monitoreo cercano recomendado';
}

function urgencyMessage(weeks) {
  if (weeks < 12) return '⚠️ Primera etapa crítica: agenda tu valoración';
  if (weeks < 28) return '💡 Seguimiento adecuado = embarazo seguro';
  return '⏳ Etapa final: evita riesgos, acude a revisión';
}

export default function App() {
  const [fur, setFur] = useState('');
  const [mode, setMode] = useState('fur');

  const whatsappLink =
    'https://wa.me/528443934366?text=Hola%20Dr.%20Alex%20Mercado,%20acabo%20de%20usar%20su%20calculadora%20y%20quiero%20agendar%20mi%20consulta';

  const result = useMemo(() => {
    if (!fur) return null;
    const baseDate = new Date(fur);
    const today = new Date();
    const diff = Math.floor((today - baseDate) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diff / 7);

    return {
      weeks,
      tip: weeklyTips(weeks),
      urgency: urgencyMessage(weeks)
    };
  }, [fur]);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>

      <img src={logoDoctor} style={{ width: 220 }} />
      <img src={logoMaternidad} style={{ width: 180 }} />

      <h2>
        {result
          ? `Tu bebé tiene ${result.weeks} semanas 💕`
          : 'Calcula tus semanas de embarazo'}
      </h2>

      <input
        type="date"
        value={fur}
        onChange={(e) => setFur(e.target.value)}
      />

      {result && (
        <>
          {/* 🔥 BLOQUE DE AUTORIDAD */}
          <div style={{
            background: '#fff3f7',
            padding: 15,
            borderRadius: 12,
            marginTop: 15
          }}>
            <strong>{result.tip}</strong>
          </div>

          {/* ⚠️ URGENCIA */}
          <div style={{
            background: '#ffe5e5',
            padding: 12,
            borderRadius: 12,
            marginTop: 10
          }}>
            {result.urgency}
          </div>

          {/* 💰 CTA FUERTE */}
          <a href={whatsappLink} target="_blank">
            <button style={{
              marginTop: 20,
              padding: 15,
              width: '100%',
              background: '#25D366',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 'bold'
            }}>
              Agendar valoración conmigo
            </button>
          </a>

          {/* 🔥 SHARE VIRAL */}
          <button
            onClick={() => {
              const url = APP_SHARE_URL;
              window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
            }}
            style={{
              marginTop: 10,
              padding: 15,
              width: '100%',
              background: '#ff6f61',
              color: '#fff',
              border: 'none',
              borderRadius: 12
            }}
          >
            Compartir con otra mamá 💕
          </button>
        </>
      )}

      <img src={logoAXM} style={{ width: 120, marginTop: 30 }} />

    </div>
  );
}
