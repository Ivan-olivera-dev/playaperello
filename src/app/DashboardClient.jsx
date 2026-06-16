'use client';
import { useState, useEffect } from 'react';

export default function DashboardClient({ weatherData }) {
  const { 
    waveHeight, waveDirection, wavePeriod, 
    windSpeed, windDirection, windGusts, 
    temperature 
  } = weatherData;
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState({ green: 0, yellow: 0, red: 0 });
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [periodKey, setPeriodKey] = useState(null);

  const getDirectionText = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    return directions[Math.round(degrees / 45) % 8];
  };

  // --- Algoritmo de Predicción Avanzada (El Perelló) ---
  let predictedFlag = 'green';
  let flagText = 'Verde';
  
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
    flagText = 'Roja';
  } else if (riskLevel === 1) {
    predictedFlag = 'yellow';
    flagText = 'Amarilla';
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
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        title="Cambiar tema"
      >
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

      <div className="header">
        <h1>El Perelló</h1>
        <p>Estado del mar</p>
      </div>

      <div className="flag-prediction">
        <h2>Bandera estimada</h2>
        <div className="flag-indicator">
          <span className="flag-text">{flagText}</span>
          <div className={`flag-color flag-${predictedFlag}`}></div>
        </div>
      </div>

      <div className="metrics-list">
        <div className="metric-row">
          <span className="metric-label">Altura de olas</span>
          <span className="metric-value">{waveHeight.toFixed(1)} m</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Periodo y Dirección (Olas)</span>
          <span className="metric-value">{wavePeriod.toFixed(1)}s ({getDirectionText(waveDirection)})</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Viento</span>
          <span className="metric-value">{windSpeed.toFixed(0)} km/h ({getDirectionText(windDirection)})</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Rachas máximas</span>
          <span className="metric-value">{windGusts.toFixed(0)} km/h</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Temperatura exterior</span>
          <span className="metric-value">{temperature.toFixed(1)} °C</span>
        </div>
      </div>

      <div className="social-votes">
        <h3>Corroboración en la playa</h3>
        
        {isVotingClosed ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Votación cerrada ahora mismo.<br/>(Horarios: 07:00 a 15:00 y 16:00 a 21:00)
          </p>
        ) : (
          <div className="vote-buttons">
            <button className="vote-btn green" onClick={() => handleVote('green')} disabled={hasVoted} title="Verde"></button>
            <button className="vote-btn yellow" onClick={() => handleVote('yellow')} disabled={hasVoted} title="Amarilla"></button>
            <button className="vote-btn red" onClick={() => handleVote('red')} disabled={hasVoted} title="Roja"></button>
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
