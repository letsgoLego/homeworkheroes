import { motion } from 'framer-motion';
import { useWeather, getWeatherIcon, getWeatherTip } from '@/hooks/useWeather';
import { Cloud } from 'lucide-react';

interface WeatherWidgetProps {
  date: Date;
  compact?: boolean;
}

export function WeatherWidget({ date, compact = false }: WeatherWidgetProps) {
  const { weather, loading } = useWeather(date);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Cloud className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Laddar väder...</span>
      </div>
    );
  }

  if (!weather) return null;

  const icon = getWeatherIcon(weather.weatherCode);
  const tip = getWeatherTip(weather);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium">{weather.temperature}°</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-200/50 p-3"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{weather.temperature}°C</span>
          </div>
          <p className="text-sm text-muted-foreground">{tip}</p>
        </div>
      </div>
    </motion.div>
  );
}
