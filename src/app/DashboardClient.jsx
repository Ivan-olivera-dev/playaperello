'use client';
import { useState, useEffect } from 'react';

export default function DashboardClient({ weatherData }) {
  const { waveHeight, windSpeed, temperature } = weatherData;
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState({ green: 0, yellow: 0, red: 0 });
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // Algoritmo predictivo de bandera
  let predictedFlag = 'green';
  let flagText = 'Verde';
  if (waveHeight >= 1.2 || windSpeed > 30) {
    predictedFlag = 'red';
    flagText = 'Roja';
  } else if (waveHeight >= 0.5 || windSpeed > 15) {
    predictedFlag = 'yellow';
    flagText = 'Amarilla';
  }

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

    // Comprobar si ya votó
    const votedToday = localStorage.getItem(`voted_flag_${new Date().toLocaleDateString()}`);
    if (votedToday) {
      setHasVoted(true);
    }
    fetchVotes();
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const fetchVotes = async () => {
    try {
      const res = await fetch('/api/votes');
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
    setHasVoted(true);
    localStorage.setItem(`voted_flag_${new Date().toLocaleDateString()}`, color);
    
    // Actualización optimista
    setVotes(prev => ({ ...prev, [color]: prev[color] + 1 }));

    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color })
    });
  };

  const totalVotes = votes.green + votes.yellow + votes.red;

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
          <span className="metric-label">Viento</span>
          <span className="metric-value">{windSpeed.toFixed(0)} km/h</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Temperatura exterior</span>
          <span className="metric-value">{temperature.toFixed(1)} °C</span>
        </div>
      </div>

      <div className="social-votes">
        <h3>Corroboración en la playa</h3>
        <div className="vote-buttons">
          <button className="vote-btn green" onClick={() => handleVote('green')} disabled={hasVoted} title="Verde"></button>
          <button className="vote-btn yellow" onClick={() => handleVote('yellow')} disabled={hasVoted} title="Amarilla"></button>
          <button className="vote-btn red" onClick={() => handleVote('red')} disabled={hasVoted} title="Roja"></button>
        </div>
        
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
