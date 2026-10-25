import { WEATHERAPI_KEY } from "../config/env";

export type LiveWeather = {
  cityLabel: string;
  tempC: number;
  conditionText: string;
  humidity: number;
  tip: string;
  playLabel: string;
};

type WeatherApiResponse = {
  location: { name: string };
  current: {
    temp_c: number;
    humidity: number;
    condition: { text: string };
  };
};

function buildTip(condition: string, tempC: number, humidity: number, city: string): { tip: string; playLabel: string } {
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle") || c.includes("thunder")) {
    return {
      tip: `Rain in ${city} today. Stay in and try a short breathing session instead of walking out.`,
      playLabel: "Play a calm breath",
    };
  }
  if (c.includes("mist") || c.includes("fog") || c.includes("haze") || c.includes("smoke") || humidity >= 75) {
    return {
      tip: `Air looks heavy in ${city} today. Skip the outdoor walk — try Anulom-Vilom breathing indoors instead.`,
      playLabel: "Play Anulom-Vilom",
    };
  }
  if (tempC >= 36) {
    return {
      tip: `It's hot in ${city} (${Math.round(tempC)}°). Rest in the shade and cool your body with a short breath practice.`,
      playLabel: "Play cooling breath",
    };
  }
  if (tempC <= 12) {
    return {
      tip: `Chilly in ${city}. A warm indoor stretch or sleep audio may feel kinder than heading out.`,
      playLabel: "Play a sleep session",
    };
  }
  if (c.includes("cloud")) {
    return {
      tip: `Cloudy in ${city}. A short walk still helps — or a 4-minute breath if the sky feels heavy.`,
      playLabel: "Play 4-7-8 breath",
    };
  }
  return {
    tip: `Nice enough in ${city} for a short walk — or stay in with a calm audio if your mind is busy.`,
    playLabel: "Play a calm walk breath",
  };
}

export async function fetchLiveWeather(city: string): Promise<LiveWeather> {
  const q = city.trim() || "Delhi";
  if (!WEATHERAPI_KEY) {
    throw new Error("Weather API key missing");
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(WEATHERAPI_KEY)}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Weather request failed");
  }
  const data = (await res.json()) as WeatherApiResponse;
  const { tip, playLabel } = buildTip(data.current.condition.text, data.current.temp_c, data.current.humidity, data.location.name);

  return {
    cityLabel: data.location.name,
    tempC: data.current.temp_c,
    conditionText: data.current.condition.text,
    humidity: data.current.humidity,
    tip,
    playLabel,
  };
}
