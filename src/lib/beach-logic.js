const TIME_ZONE = 'Europe/Madrid';

function getMadridParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });

  const parts = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const hour = Number(parts.hour) % 24;
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;

  return { year, month, day, hour, dateStr };
}

/**
 * Temporada de baño y vigilancia en El Perelló: 1 de junio al 30 de septiembre.
 */
export function isSummerSeason(date = new Date()) {
  const { month } = getMadridParts(date);
  return month >= 6 && month <= 9;
}

/**
 * Calcula los días restantes hasta el próximo 1 de junio (0 si ya estamos en verano).
 */
export function getDaysUntilSummer(date = new Date()) {
  if (isSummerSeason(date)) return 0;

  const { year, month, day } = getMadridParts(date);
  const currentUtc = Date.UTC(year, month - 1, day);
  const targetYear = month >= 10 ? year + 1 : year;
  const juneFirstUtc = Date.UTC(targetYear, 5, 1);

  return Math.max(1, Math.round((juneFirstUtc - currentUtc) / (1000 * 60 * 60 * 24)));
}

/**
 * Devuelve el estado de temporada y la clave de turno de votación activa.
 */
export function getVotingPeriod(date = new Date()) {
  const isSummer = isSummerSeason(date);
  const { hour, dateStr } = getMadridParts(date);

  if (!isSummer) {
    return { isSummer: false, period: null, periodKey: null, dateStr };
  }

  let period = null;
  if (hour >= 7 && hour < 15) {
    period = 'morning';
  } else if (hour >= 16 && hour < 21) {
    period = 'afternoon';
  }

  return {
    isSummer: true,
    period,
    periodKey: period ? `${dateStr}_${period}` : null,
    dateStr,
  };
}

function normalizeDegrees(deg = 0) {
  return ((Number(deg) % 360) + 360) % 360;
}

function isAngleBetween(deg, min, max) {
  const d = normalizeDegrees(deg);
  return d >= min && d <= max;
}

/**
 * Modelo físico de predicción de bandera para la Playa del Perelló (orientación Este ~75°-90°).
 * Contempla altura de ola, período (energía de rompiente en el escalón post-regeneración),
 * dirección de oleaje y régimen de vientos (Levante/Gregal vs Garbí térmico vs Poniente).
 */
export function predictBeachFlag(weatherData = {}) {
  const waveHeight = Number(weatherData.waveHeight) || 0;
  const wavePeriod = Number(weatherData.wavePeriod) || 0;
  const waveDirection = normalizeDegrees(weatherData.waveDirection);
  const windSpeed = Number(weatherData.windSpeed) || 0;
  const windGusts = Number(weatherData.windGusts) || windSpeed;
  const windDirection = normalizeDegrees(weatherData.windDirection);

  // 1. Exposición según orientación de la costa del Perelló (mira al Este)
  let waveExposure = 1.0;
  if (isAngleBetween(waveDirection, 30, 150)) {
    waveExposure = 1.0; // Impacto frontal (NE - E - SE)
  } else if (isAngleBetween(waveDirection, 0, 30) || isAngleBetween(waveDirection, 150, 185)) {
    waveExposure = 0.85; // Incidencia oblicua
  } else {
    waveExposure = 0.65; // Sombra terrestre (Oeste)
  }

  // 2. Factor de período (mar de fondo golpea más fuerte el escalón de la orilla)
  let periodMultiplier = 1.0;
  if (wavePeriod >= 7.5) {
    periodMultiplier = 1.3;
  } else if (wavePeriod >= 6.0) {
    periodMultiplier = 1.15;
  } else if (wavePeriod > 0 && wavePeriod < 4.0) {
    periodMultiplier = 0.95;
  }

  const effectiveWaveHeight = waveHeight * waveExposure * periodMultiplier;

  // Componentes de viento
  const isPureOnshoreWind = isAngleBetween(windDirection, 35, 125); // Gregal / Levante
  const isThermalOrObliqueOnshore = isAngleBetween(windDirection, 126, 165); // Xaloc / Garbí
  const isOnshoreWind = isPureOnshoreWind || isThermalOrObliqueOnshore;

  // --- REGLAS DE BANDERA ROJA ---
  if (waveHeight >= 0.65 || effectiveWaveHeight >= 0.62) {
    return { flag: 'red', reasonKey: 'high_waves', effectiveWaveHeight };
  }
  if (waveHeight >= 0.45 && wavePeriod >= 7.5 && waveExposure >= 0.85) {
    return { flag: 'red', reasonKey: 'heavy_swell', effectiveWaveHeight };
  }
  if (isOnshoreWind && (windSpeed >= 25 || windGusts >= 38)) {
    return { flag: 'red', reasonKey: 'strong_onshore', effectiveWaveHeight };
  }
  if (windSpeed >= 32 || windGusts >= 48) {
    return { flag: 'red', reasonKey: 'gale_wind', effectiveWaveHeight };
  }

  // --- REGLAS DE BANDERA AMARILLA ---
  // Mar de fondo largo que rompe brusco en el escalón de la orilla
  if (waveHeight >= 0.24 && wavePeriod >= 7.0 && waveExposure >= 0.85) {
    return { flag: 'yellow', reasonKey: 'shorebreak', effectiveWaveHeight };
  }
  // Oleaje moderado
  if (effectiveWaveHeight >= 0.30 || waveHeight >= 0.32) {
    return { flag: 'yellow', reasonKey: 'moderate_waves', effectiveWaveHeight };
  }
  // Viento de componente marítimo moderado (mete corriente y rompiente)
  if (isPureOnshoreWind && (windSpeed >= 17 || windGusts >= 26)) {
    return { flag: 'yellow', reasonKey: 'onshore_wind', effectiveWaveHeight };
  }
  // Brisa térmica o viento general moderado-fuerte
  if (windSpeed >= 20 || windGusts >= 30) {
    return { flag: 'yellow', reasonKey: 'moderate_wind', effectiveWaveHeight };
  }

  // --- BANDERA VERDE ---
  return { flag: 'green', reasonKey: 'calm', effectiveWaveHeight };
}
