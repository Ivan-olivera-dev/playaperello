'use client';
import { useState, useEffect } from 'react';

const DICT = {
  es: {
    subtitle: "Estado del mar",
    predictedFlag: "Bandera estimada",
    flagGreen: "Verde",
    flagYellow: "Amarilla",
    flagRed: "Roja",
    waveHeight: "Altura de olas",
    wavePeriod: "Periodo y dirección",
    wind: "Viento",
    windGusts: "Rachas máximas",
    temp: "Temperatura exterior",
    uv: "Fuerza del sol (UV)",
    uvLow: "Bajo",
    uvMod: "Moderado",
    uvHigh: "Alto",
    uvVHigh: "Muy Alto",
    uvExt: "Extremo",
    social: "Corroboración en la playa",
    closed: "Votación cerrada ahora mismo.",
    schedule: "(Horarios: 07:00 a 15:00 y 16:00 a 21:00)",
    directions: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  },
  va: {
    subtitle: "Estat de la mar",
    predictedFlag: "Bandera estimada",
    flagGreen: "Verda",
    flagYellow: "Groga",
    flagRed: "Roja",
    waveHeight: "Altura de les ones",
    wavePeriod: "Període i direcció",
    wind: "Vent",
    windGusts: "Ràfegues màximes",
    temp: "Temperatura exterior",
    uv: "Força del sol (UV)",
    uvLow: "Baix",
    uvMod: "Moderat",
    uvHigh: "Alt",
    uvVHigh: "Molt Alt",
    uvExt: "Extrem",
    social: "Corroboració a la platja",
    closed: "Votació tancada ara mateix.",
    schedule: "(Horaris: 07:00 a 15:00 i 16:00 a 21:00)",
    directions: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  }
};

export default function DashboardClient({ weatherData }) {
  const { 
    waveHeight, waveDirection, wavePeriod, 
    windSpeed, windDirection, windGusts, 
    temperature, uvIndex 
  } = weatherData;
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState({ green: 0, yellow: 0, red: 0 });
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState('es');
  const [periodKey, setPeriodKey] = useState(null);

  const t = DICT[lang];

  const getDirectionText = (degrees) => {
    return t.directions[Math.round(degrees / 45) % 8];
  };

  const getUvText = (uv) => {
    if (uv < 3) return t.uvLow;
    if (uv < 6) return t.uvMod;
    if (uv < 8) return t.uvHigh;
    if (uv < 11) return t.uvVHigh;
    return t.uvExt;
  };

  const getUvColor = (uv) => {
    if (uv < 3) return 'var(--success)';
    if (uv < 6) return 'var(--warning)';
    if (uv < 8) return '#f97316';
    if (uv < 11) return 'var(--danger)';
    return '#9333ea';
  };

  // --- Algoritmo de Predicción Avanzada (El Perelló) ---
  let predictedFlag = 'green';
  let flagText = t.flagGreen;
  
  // 1. Evaluar Viento
  const isPoniente = windDirection >= 225 && windDirection <= 315;
  const isLevante = windDirection >= 45 && windDirection <= 135;

  let riskLevel = 0; // 0: Verde, 1: Amarilla, 2: Roja

  // Reglas de Viento
  if (isPoniente && (windSpeed > 20 || windGusts > 35)) {
    // Viento de tierra a mar: peligro de arrastre
    riskLevel = Math.max(riskLevel, 1);
    if (windGusts > 50) riskLevel = Math.max(riskLevel, 2);
  } else if (isLevante && windSpeed > 25) {
    // Levante: mar picado rápidamente
    riskLevel = Math.max(riskLevel, 2);
  } else if (windSpeed > 30 || windGusts > 40) {
    // Viento fuerte general
    riskLevel = Math.max(riskLevel, 1);
  }

  // Reglas de Oleaje
  if (waveHeight >= 1.2) {
    riskLevel = Math.max(riskLevel, 2);
  } else if (waveHeight >= 0.5) {
    riskLevel = Math.max(riskLevel, 1);
    // Si hay mar de fondo (periodo largo), la resaca es peligrosa
    if (wavePeriod > 8) {
      riskLevel = Math.max(riskLevel, 2);
    }
  }

  // Asignar bandera final
  if (riskLevel === 2) {
    predictedFlag = 'red';
    flagText = t.flagRed;
  } else if (riskLevel === 1) {
    predictedFlag = 'yellow';
    flagText = t.flagYellow;
  }

  const getPeriodKey = () => {
    const hour = new Date().getHours();
    const dateStr = new Date().toLocaleDateString();
    if (hour >= 7 && hour < 15) return `${dateStr}_morning`;
    if (hour >= 16 && hour < 21) return `${dateStr}_afternoon`;
    return null;
  };

  useEffect(() => {
    // Configurar tema inicial
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Configurar idioma inicial
    const savedLang = localStorage.getItem('lang');
    if (savedLang === 'va' || savedLang === 'es') {
      setLang(savedLang);
    }

    const currentPeriod = getPeriodKey();
    setPeriodKey(currentPeriod);

    // Comprobar si ya votó en este periodo específico
    if (currentPeriod) {
      const votedInPeriod = localStorage.getItem(`voted_flag_${currentPeriod}`);
      if (votedInPeriod) {
        setHasVoted(true);
      }
    }
    fetchVotes();
    
    // Configurar refresco automático (auto-reload) cada 10 segundos
    const interval = setInterval(fetchVotes, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleLang = () => {
    const newLang = lang === 'es' ? 'va' : 'es';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const fetchVotes = async () => {
    try {
      const res = await fetch('/api/votes', { cache: 'no-store' });
      const data = await res.json();
      if (data.votes) {
        const counts = { green: 0, yellow: 0, red: 0 };
        data.votes.forEach(v => {
          counts[v.color] = v.count;
        });
        setVotes(counts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVotes(false);
    }
  };

  const handleVote = async (color) => {
    if (!periodKey) return;

    setHasVoted(true);
    localStorage.setItem(`voted_flag_${periodKey}`, color);
    
    // Actualización optimista
    setVotes(prev => ({ ...prev, [color]: prev[color] + 1 }));

    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color })
    });
  };

  const totalVotes = votes.green + votes.yellow + votes.red;
  const isVotingClosed = !periodKey;

  return (
    <div className="dashboard-container">
      <div className="top-controls">
        <button className="control-btn" onClick={toggleLang} title="Cambiar idioma">
          <span className="lang-text">{lang === 'es' ? 'VA' : 'ES'}</span>
        </button>
        <button className="control-btn" onClick={toggleTheme} title="Cambiar tema">
          {isDark ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>

      <div className="header">
        <h1>El Perelló</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="flag-prediction">
        <h2>{t.predictedFlag}</h2>
        <div className="flag-indicator">
          <span className="flag-text">{flagText}</span>
          <div className={`flag-color flag-${predictedFlag}`}></div>
        </div>
      </div>

      <div className="metrics-list">
        <div className="metric-row">
          <span className="metric-label">{t.waveHeight}</span>
          <span className="metric-value">{waveHeight.toFixed(1)} m</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">{t.wavePeriod}</span>
          <span className="metric-value">{wavePeriod.toFixed(1)}s ({getDirectionText(waveDirection)})</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">{t.wind}</span>
          <span className="metric-value">{windSpeed.toFixed(0)} km/h ({getDirectionText(windDirection)})</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">{t.windGusts}</span>
          <span className="metric-value">{windGusts.toFixed(0)} km/h</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">{t.temp}</span>
          <span className="metric-value">{temperature.toFixed(1)} °C</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">{t.uv}</span>
          <span className="metric-value" style={{ color: getUvColor(uvIndex) }}>
            {getUvText(uvIndex)} ({uvIndex.toFixed(1)})
          </span>
        </div>
      </div>

      <div className="social-votes">
        <h3>{t.social}</h3>
        
        {isVotingClosed ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            {t.closed}<br/>{t.schedule}
          </p>
        ) : (
          <div className="vote-buttons">
            <button className="vote-btn green" onClick={() => handleVote('green')} disabled={hasVoted} title={t.flagGreen}></button>
            <button className="vote-btn yellow" onClick={() => handleVote('yellow')} disabled={hasVoted} title={t.flagYellow}></button>
            <button className="vote-btn red" onClick={() => handleVote('red')} disabled={hasVoted} title={t.flagRed}></button>
          </div>
        )}
        
        {!loadingVotes && totalVotes > 0 && (
          <div className="vote-stats">
            <span className="vote-stat-item"><span style={{color:'var(--success)', fontSize:'1.2rem'}}>•</span> {votes.green}</span>
            <span className="vote-stat-item"><span style={{color:'var(--warning)', fontSize:'1.2rem'}}>•</span> {votes.yellow}</span>
            <span className="vote-stat-item"><span style={{color:'var(--danger)', fontSize:'1.2rem'}}>•</span> {votes.red}</span>
          </div>
        )}
      </div>
    </div>
  );
}
