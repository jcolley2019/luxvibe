import { useQuery } from "@tanstack/react-query";
import { Droplets } from "lucide-react";
import { format, parseISO } from "date-fns";

const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: "Clear sky", emoji: "☀️" },
  1: { label: "Mainly clear", emoji: "🌤️" },
  2: { label: "Partly cloudy", emoji: "⛅" },
  3: { label: "Overcast", emoji: "☁️" },
  45: { label: "Foggy", emoji: "🌫️" },
  48: { label: "Freezing fog", emoji: "🌫️" },
  51: { label: "Light drizzle", emoji: "🌦️" },
  53: { label: "Drizzle", emoji: "🌦️" },
  55: { label: "Heavy drizzle", emoji: "🌧️" },
  61: { label: "Light rain", emoji: "🌧️" },
  63: { label: "Rain", emoji: "🌧️" },
  65: { label: "Heavy rain", emoji: "🌧️" },
  71: { label: "Light snow", emoji: "🌨️" },
  73: { label: "Snow", emoji: "❄️" },
  75: { label: "Heavy snow", emoji: "❄️" },
  80: { label: "Rain showers", emoji: "🌦️" },
  81: { label: "Rain showers", emoji: "🌦️" },
  82: { label: "Heavy showers", emoji: "🌧️" },
  85: { label: "Snow showers", emoji: "🌨️" },
  86: { label: "Heavy snow showers", emoji: "🌨️" },
  95: { label: "Thunderstorm", emoji: "⛈️" },
  96: { label: "Thunderstorm", emoji: "⛈️" },
  99: { label: "Thunderstorm", emoji: "⛈️" },
};

function getWeatherInfo(code: number) {
  const exact = WMO_CODES[code];
  if (exact) return exact;
  for (const k of Object.keys(WMO_CODES).map(Number).sort((a, b) => b - a)) {
    if (code >= k) return WMO_CODES[k];
  }
  return { label: "Unknown", emoji: "🌡️" };
}

interface WeatherWidgetProps {
  lat: number | null;
  lng: number | null;
  checkIn: string;
  checkOut: string;
  hotelName: string;
}

export function WeatherWidget({ lat, lng, checkIn, checkOut, hotelName }: WeatherWidgetProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["weather", lat, lng, checkIn, checkOut],
    queryFn: async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=auto&start_date=${checkIn}&end_date=${checkOut}&forecast_days=14`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather unavailable");
      return res.json();
    },
    enabled: !!(lat && lng && checkIn && checkOut),
    staleTime: 3600000,
    retry: 1,
  });

  if (!lat || !lng || isLoading || isError || !data?.daily?.time?.length) return null;

  const { time, temperature_2m_max, temperature_2m_min, precipitation_probability_mean, weathercode } = data.daily;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mb-10" data-testid="weather-widget">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🌤️</span>
        <h2 className="text-xl font-bold">Weather During Your Stay</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Forecast for {hotelName} · {checkIn} – {checkOut}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {time.map((date: string, i: number) => {
          const info = getWeatherInfo(weathercode[i]);
          const maxTemp = Math.round(temperature_2m_max[i]);
          const minTemp = Math.round(temperature_2m_min[i]);
          const precip = Math.round(precipitation_probability_mean?.[i] ?? 0);
          const isToday = date === today;
          const dayLabel = isToday ? "Today" : format(parseISO(date), "EEE");
          const dateLabel = format(parseISO(date), "MMM d");
          return (
            <div
              key={date}
              className={`flex-shrink-0 w-[84px] rounded-xl border p-3 text-center transition-colors ${isToday ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
              data-testid={`weather-day-${date}`}
            >
              <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">{dayLabel}</p>
              <p className="text-[10px] text-muted-foreground/70 mb-2">{dateLabel}</p>
              <div className="text-2xl mb-2 leading-none">{info.emoji}</div>
              <p className="text-[10px] text-muted-foreground mb-2 leading-tight min-h-[2.4em]">{info.label}</p>
              <p className="text-sm font-bold">{maxTemp}°C</p>
              <p className="text-xs text-muted-foreground">{minTemp}°C</p>
              {precip > 10 && (
                <p className="text-[10px] text-blue-500 mt-1.5 flex items-center justify-center gap-0.5">
                  <Droplets className="w-2.5 h-2.5" />{precip}%
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-2">
        Forecast provided by Open-Meteo · Updated hourly
      </p>
    </div>
  );
}
