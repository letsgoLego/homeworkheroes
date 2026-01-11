import { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isRainy: boolean;
  isCold: boolean;
}

interface SavedLocation {
  latitude: number;
  longitude: number;
  savedAt: number;
}

const LOCATION_STORAGE_KEY = 'weather_location';
const LOCATION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Weather codes from Open-Meteo
// https://open-meteo.com/en/docs
const RAINY_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];

function getSavedLocation(): SavedLocation | null {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!saved) return null;
    
    const location: SavedLocation = JSON.parse(saved);
    // Check if location is still valid (not older than 24 hours)
    if (Date.now() - location.savedAt < LOCATION_MAX_AGE) {
      return location;
    }
    return null;
  } catch {
    return null;
  }
}

function saveLocation(latitude: number, longitude: number) {
  try {
    const location: SavedLocation = {
      latitude,
      longitude,
      savedAt: Date.now(),
    };
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Ignore storage errors
  }
}

export function useWeather(date: Date) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Default to Stockholm coordinates
        let latitude = 59.33;
        let longitude = 18.07;

        // First check for saved location
        const savedLocation = getSavedLocation();
        if (savedLocation) {
          latitude = savedLocation.latitude;
          longitude = savedLocation.longitude;
        } else if (navigator.geolocation) {
          // Try to get user's location
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            // Save for future use
            saveLocation(latitude, longitude);
          } catch {
            // Use default Stockholm coordinates
          }
        }

        const dateStr = date.toISOString().split('T')[0];
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`
        );

        if (!response.ok) throw new Error('Weather fetch failed');

        const data = await response.json();
        const daily = data.daily;

        if (daily && daily.temperature_2m_max && daily.temperature_2m_max.length > 0) {
          const avgTemp = (daily.temperature_2m_max[0] + daily.temperature_2m_min[0]) / 2;
          const weatherCode = daily.weathercode[0];

          setWeather({
            temperature: Math.round(avgTemp),
            weatherCode,
            isRainy: RAINY_CODES.includes(weatherCode) || daily.precipitation_probability_max[0] > 50,
            isCold: avgTemp < 10,
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [date.toISOString().split('T')[0]]);

  return { weather, loading };
}

export function getWeatherIcon(weatherCode: number): string {
  if (weatherCode === 0) return '☀️';
  if (weatherCode <= 3) return '⛅';
  if (weatherCode <= 48) return '🌫️';
  if (weatherCode <= 67) return '🌧️';
  if (weatherCode <= 77) return '❄️';
  if (weatherCode <= 82) return '🌧️';
  if (weatherCode <= 86) return '🌨️';
  return '⛈️';
}

export function getWeatherTip(weather: WeatherData): string {
  const tips: string[] = [];
  
  if (weather.isRainy) {
    tips.push('Ta med regnjacka');
  }
  
  if (weather.isCold) {
    tips.push('Klä dig varmt');
  }
  
  if (weather.temperature > 20) {
    tips.push('Glöm inte vattenflaska');
  }
  
  return tips.join(' • ') || 'Bra väder idag!';
}
