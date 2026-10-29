import { useState } from 'react';

const PHONE = '844 189 2008';
const CALL_URL = 'tel:+528441892008';
const MAPS_URL = 'https://maps.app.goo.gl/mAXJE8mSYJvik4Ex8';
const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=25.4771829%2C-100.9786991';
const SHARE_URL = 'https://dralexmercado.com.mx/calculadora#urgencias';
const ADDRESS = 'Carretera Saltillo–Monterrey km 4.5, Las Brisas, C.P. 25210, Saltillo, Coahuila';

export default function Emergency() {
  const [shareStatus, setShareStatus] = useState('');

  async function shareEmergency() {
    const message = `Urgencias · Dr. Alex Mercado\nLlama al ${PHONE}\nConsultorio: ${ADDRESS}\nUbicación: ${MAPS_URL}\nCómo llegar: ${DIRECTIONS_URL}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Urgencias · Dr. Alex Mercado', text: message, url: SHARE_URL });
        setShareStatus('Datos compartidos');
      } else {
        await navigator.clipboard.writeText(`${message}\nPantalla de urgencias: ${SHARE_URL}`);
        setShareStatus('Datos y enlace copiados');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setShareStatus('No se pudo compartir. Puedes copiar el número y la dirección.');
    }
  }

  return <section className="tool-page emergency-page" aria-labelledby="emergency-title">
    <div className="emergency-heading"><span className="emergency-heading-icon" aria-hidden="true">✚</span><h1 id="emergency-title">Urgencias</h1><p>Dr. Alex Mercado</p></div>
    <div className="tool-card emergency-card">
      <h2>Comunícate ahora</h2>
      <p>Toca el número para abrir el marcador de tu celular.</p>
      <a className="emergency-call" href={CALL_URL}><span aria-hidden="true">☎</span><span>Llamar al Dr. Alex Mercado<strong>{PHONE}</strong></span></a>
    </div>
    <div className="tool-card emergency-card">
      <h2>Cómo llegar al consultorio</h2>
      <address>{ADDRESS}</address>
      <a className="emergency-map" href={DIRECTIONS_URL} target="_blank" rel="noreferrer"><span aria-hidden="true">➤</span> Abrir indicaciones en Google Maps</a>
    </div>
    <button className="emergency-share" type="button" onClick={shareEmergency}><span aria-hidden="true">↗</span> Compartir estos datos</button>
    <p role="status" className="emergency-share-status">{shareStatus}</p>
  </section>;
}
