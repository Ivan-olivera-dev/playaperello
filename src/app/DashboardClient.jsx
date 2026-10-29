'use client';
import { useState, useEffect } from 'react';
import {
  isSummerSeason,
  getDaysUntilSummer,
  getVotingPeriod,
  predictBeachFlag,
} from '@/lib/beach-logic';

const DICT = {
  es: {
    subtitle: "Estado del mar",
    predictedFlag: "Bandera estimada",
    theoreticalFlag: "Bandera teórica (fuera de temporada)",
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
    closedOffSeason: "Votación inactiva fuera de la temporada de baño (1 jun – 30 sep).",
    schedule: "(Horarios: 07:00 a 15:00 y 16:00 a 21:00)",
    offSeasonBadge: "Temporada cerrada · 1 jun – 30 sep",
    offSeasonTitle: "Esperando al verano",
    offSeasonText: "El servicio de vigilancia y banderas de la playa del Perelló opera durante los meses de verano. Mientras tanto, puedes consultar la telemetría marítima y la estimación física en tiempo real.",
    daysRemaining: (days) => days === 1 ? "Falta 1 día para el 1 de junio" : `Faltan ${days} días para el 1 de junio`,
    viewLiveBtn: "Ver estado del mar en tiempo real →",
    backToSeasonBtn: "← Volver a aviso de temporada",
    reasons: {
      calm: "Mar en calma y viento suave",
      shorebreak: "Mar de fondo en el escalón de la orilla",
      moderate_waves: "Oleaje moderado en la rompiente",
      onshore_wind: "Viento marítimo moderado (corriente)",
      moderate_wind: "Ráfagas de viento moderadas",
      high_waves: "Oleaje intenso en la costa",
      heavy_swell: "Mar de fondo fuerte y peligroso",
      strong_onshore: "Temporal de componente marítimo",
      gale_wind: "Viento muy fuerte",
    },
    directions: ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  },
  va: {
    subtitle: "Estat de la mar",
    predictedFlag: "Bandera estimada",
    theoreticalFlag: "Bandera teòrica (fora de temporada)",
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
    closedOffSeason: "Votació inactiva fora de la temporada de bany (1 juny – 30 set).",
    schedule: "(Horaris: 07:00 a 15:00 i 16:00 a 21:00)",
    offSeasonBadge: "Temporada tancada · 1 juny – 30 set",
    offSeasonTitle: "Esperant l'estiu",
    offSeasonText: "El servei de vigilància i banderes de la platja del Perelló funciona durant els mesos d'estiu. Mentrestant, pots consultar la telemetria marítima i l'estimació física en temps real.",
    daysRemaining: (days) => days === 1 ? "Falta 1 dia per a l'1 de juny" : `Falten ${days} dies per a l'1 de juny`,
    viewLiveBtn: "Veure estat de la mar en temps real →",
    backToSeasonBtn: "← Tornar a l'avís de temporada",
    reasons: {
      calm: "Mar en calma i vent suau",
      shorebreak: "Mar de fons a l'escaló de la vora",
      moderate_waves: "Onatge moderat a la trencant",
      onshore_wind: "Vent marítim moderat (corrent)",
      moderate_wind: "Ràfegues de vent moderades",
      high_waves: "Onatge intens a la costa",
      heavy_swell: "Mar de fons fort i perillós",
      strong_onshore: "Temporal de component marítim",
      gale_wind: "Vent molt fort",
    },
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
  const [isSummer, setIsSummer] = useState(() => isSummerSeason());
  const [daysUntilSummer, setDaysUntilSummer] = useState(() => getDaysUntilSummer());
  const [showLiveInOffSeason, setShowLiveInOffSeason] = useState(false);

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

  const { flag: predictedFlag, reasonKey } = predictBeachFlag(weatherData);
  const flagText =
    predictedFlag === 'red'
      ? t.flagRed
      : predictedFlag === 'yellow'
        ? t.flagYellow
        : t.flagGreen;
  const flagReason = t.reasons[reasonKey] || '';

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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.setAttribute('data-theme', 'light');
    }

    const savedLang = localStorage.getItem('lang');
    if (savedLang === 'va' || savedLang === 'es') {
      setLang(savedLang);
    }

    const now = new Date();
    const votingState = getVotingPeriod(now);
    setIsSummer(votingState.isSummer);
    setDaysUntilSummer(getDaysUntilSummer(now));
    setPeriodKey(votingState.periodKey);

    if (votingState.periodKey) {
      const votedInPeriod = localStorage.getItem(`voted_flag_${votingState.periodKey}`);
      if (votedInPeriod) {
        setHasVoted(true);
      }
      fetchVotes();
      const interval = setInterval(fetchVotes, 10000);
      return () => clearInterval(interval);
    } else {
      setLoadingVotes(false);
    }
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

  const handleVote = async (color) => {
    if (!periodKey || !isSummer) return;

    setHasVoted(true);
    localStorage.setItem(`voted_flag_${periodKey}`, color);

    setVotes(prev => ({ ...prev, [color]: prev[color] + 1 }));

    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color })
    });
  };

  const totalVotes = votes.green + votes.yellow + votes.red;
  const isVotingClosed = !isSummer || !periodKey;

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

      {!isSummer && !showLiveInOffSeason ? (
        <div className="offseason-card">
          <span className="offseason-badge">{t.offSeasonBadge}</span>
          <h2 className="offseason-title">{t.offSeasonTitle}</h2>
          <p className="offseason-text">{t.offSeasonText}</p>
          <p className="offseason-countdown">{t.daysRemaining(daysUntilSummer)}</p>
          <button
            type="button"
            className="offseason-live-btn"
            onClick={() => setShowLiveInOffSeason(true)}
          >
            {t.viewLiveBtn}
          </button>
        </div>
      ) : (
        <>
          {!isSummer && (
            <div className="offseason-banner">
              <button
                type="button"
                className="offseason-back-btn"
                onClick={() => setShowLiveInOffSeason(false)}
              >
                {t.backToSeasonBtn}
              </button>
            </div>
          )}

          <div className="flag-prediction">
            <div className="flag-label-group">
              <h2>{isSummer ? t.predictedFlag : t.theoreticalFlag}</h2>
              {flagReason && <span className="flag-reason">{flagReason}</span>}
            </div>
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
                {!isSummer ? (
                  t.closedOffSeason
                ) : (
                  <>
                    {t.closed}<br />{t.schedule}
                  </>
                )}
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
                <span className="vote-stat-item"><span style={{ color: 'var(--success)', fontSize: '1.2rem' }}>•</span> {votes.green}</span>
                <span className="vote-stat-item"><span style={{ color: 'var(--warning)', fontSize: '1.2rem' }}>•</span> {votes.yellow}</span>
                <span className="vote-stat-item"><span style={{ color: 'var(--danger)', fontSize: '1.2rem' }}>•</span> {votes.red}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
