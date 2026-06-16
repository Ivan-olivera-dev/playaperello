import DashboardClient from './DashboardClient';

// Forzar revalidación para evitar que Next.js deje la página cacheada para siempre
export const revalidate = 60; // revalida cada 60 segundos

async function getWeatherData() {
  const lat = 39.278;
  const lon = -0.278;
  
  try {
    // Open-Meteo Marine API y Weather API
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period&timezone=Europe%2FMadrid`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Europe%2FMadrid`;
    
    const [marineRes, weatherRes] = await Promise.all([
      fetch(marineUrl),
      fetch(weatherUrl)
    ]);
    
    const marineData = await marineRes.json();
    const weatherData = await weatherRes.json();
    
    return {
      waveHeight: marineData?.current?.wave_height || 0,
      waveDirection: marineData?.current?.wave_direction || 0,
      wavePeriod: marineData?.current?.wave_period || 0,
      windSpeed: weatherData?.current?.wind_speed_10m || 0,
      windDirection: weatherData?.current?.wind_direction_10m || 0,
      windGusts: weatherData?.current?.wind_gusts_10m || 0,
      temperature: weatherData?.current?.temperature_2m || 0
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return { 
      waveHeight: 0, waveDirection: 0, wavePeriod: 0, 
      windSpeed: 0, windDirection: 0, windGusts: 0, temperature: 0 
    };
  }
}

export default async function Home() {
  const weatherData = await getWeatherData();
  
  return (
    <main>
      <DashboardClient weatherData={weatherData} />
    </main>
  );
}
