import DashboardClient from './DashboardClient';

// Forzar revalidación para evitar que Next.js deje la página cacheada para siempre
export const revalidate = 60; // revalida cada 60 segundos

async function getWeatherData() {
  const lat = 39.278;
  const lon = -0.278;
  
  try {
    // Open-Meteo Marine API (Oleaje)
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period&timezone=Europe%2FMadrid`;
    
    // Inforatge El Perelló (Scraping de estación terrestre y UV)
    const inforatgeUrl = `https://inforatge.com/meteo-elperello`;
    
    const [marineRes, inforatgeRes] = await Promise.all([
      fetch(marineUrl, { next: { revalidate: 60 } }),
      fetch(inforatgeUrl, { next: { revalidate: 60 } })
    ]);
    
    const marineData = await marineRes.json();
    const inforatgeHtml = await inforatgeRes.text();
    
    // --- Parsear Inforatge usando Regex ---
    
    // Temperatura: <div class="blocValorTM">23<span class="vPetit">,4</span>
    const tempMatch = inforatgeHtml.match(/<div class="blocValorTM">(\d+)<span class="vPetit">,(\d+)<\/span>/);
    const temperature = tempMatch ? parseFloat(`${tempMatch[1]}.${tempMatch[2]}`) : 0;
    
    // Viento velocidad y dirección: <div class="blocValor">8<span class="vPetit"> NO</span></div>
    const windMatch = inforatgeHtml.match(/<div class="blocVariableVV">[\s\S]*?<div class="blocValor">(\d+)<span class="vPetit">\s*([A-Z]+)<\/span><\/div>/);
    const windSpeed = windMatch ? parseFloat(windMatch[1]) : 0;
    const windDirStr = windMatch ? windMatch[2] : 'N';
    
    // Mapeo de dirección a grados
    const dirMap = {
      'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SO': 225, 'O': 270, 'NO': 315
    };
    const windDirection = dirMap[windDirStr] !== undefined ? dirMap[windDirStr] : 0;
    
    // Rachas máximas: <a href="#" class="boxpetitkVX negreT"><span class="varmobil">m&agrave;x</span>10 <span class="tPetit">km/h</span></a>
    const gustMatch = inforatgeHtml.match(/<a href="#" class="boxpetitkVX negreT"><span class="varmobil">m&agrave;x<\/span>(\d+)\s*<span class="tPetit">km\/h<\/span><\/a>/);
    const windGusts = gustMatch ? parseFloat(gustMatch[1]) : windSpeed;
    
    // UV: hui<span class="varuv8">8</span>
    const uvMatch = inforatgeHtml.match(/hui<span class="varuv\d+">(\d+)<\/span>/);
    const uvIndex = uvMatch ? parseFloat(uvMatch[1]) : 0;
    
    return {
      waveHeight: marineData?.current?.wave_height || 0,
      waveDirection: marineData?.current?.wave_direction || 0,
      wavePeriod: marineData?.current?.wave_period || 0,
      windSpeed,
      windDirection,
      windGusts,
      temperature,
      uvIndex
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return { 
      waveHeight: 0, waveDirection: 0, wavePeriod: 0, 
      windSpeed: 0, windDirection: 0, windGusts: 0, temperature: 0, uvIndex: 0 
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
