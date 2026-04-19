const axios = require('axios');
const { getDb } = require('../../config/database');

const API_KEY = process.env.OPENWEATHER_API_KEY || 'fb73c960451f4232da579140019bb2d3';
const CACHE_TTL_MINUTES = 10;

function mostCommon(arr) {
  const counts = {};
  let max = 0, result = arr[0];
  for (const v of arr) {
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > max) { max = counts[v]; result = v; }
  }
  return result;
}

// Оновлено: додано lang у ключ кешу
function getCached(city, unit, lang) {
  const db = getDb();
  const cutoff = new Date(Date.now() - CACHE_TTL_MINUTES * 60 * 1000).toISOString();
  const row = db.prepare(
    `SELECT data FROM weather_cache WHERE city = ? AND unit = ? AND lang = ? AND cached_at > ? ORDER BY cached_at DESC LIMIT 1`
  ).get(city.toLowerCase(), unit, lang, cutoff);
  return row ? JSON.parse(row.data) : null;
}

function setCache(city, unit, lang, data) {
  const db = getDb();
  // Переконайся, що в таблиці weather_cache є колонка lang, або просто ігноруй її тут, 
  // якщо не хочеш міняти схему БД (але краще додати)
  try {
    db.prepare(
      `INSERT INTO weather_cache (city, unit, lang, data) VALUES (?, ?, ?, ?)`
    ).run(city.toLowerCase(), unit, lang, JSON.stringify(data));
  } catch (e) {
    // Якщо колонки lang немає, пишемо без неї
    db.prepare(
      `INSERT INTO weather_cache (city, unit, data) VALUES (?, ?, ?)`
    ).run(city.toLowerCase(), unit, JSON.stringify(data));
  }
  db.prepare(`DELETE FROM weather_cache WHERE cached_at < datetime('now', '-1 hour')`).run();
}

async function getWeatherAndForecast(city, unit = 'Celsius', lang = 'uk') {
  const cached = getCached(city, unit, lang);
  if (cached) return { ...cached, fromCache: true };

  const unitParam = unit === 'Celsius' ? 'metric' : 'imperial';
  const unitSymbol = unit === 'Celsius' ? '°C' : '°F';
  // OpenWeather використовує 'ua' для української, але 'en' для англійської
  const apiLang = lang === 'uk' ? 'ua' : 'en';

  const [currentRes, forecastRes] = await Promise.all([
    axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: { q: city, appid: API_KEY, units: unitParam, lang: apiLang },
      timeout: 7000,
    }),
    axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: { q: city, appid: API_KEY, units: unitParam, lang: apiLang },
      timeout: 7000,
    }),
  ]);

  const cur = currentRes.data;
  const current = {
    city: cur.name,
    country: cur.sys.country,
    temp: Math.round(cur.main.temp),
    feelsLike: Math.round(cur.main.feels_like),
    humidity: cur.main.humidity,
    windSpeed: cur.wind.speed,
    description: cur.weather[0].description.charAt(0).toUpperCase() + cur.weather[0].description.slice(1),
    icon: cur.weather[0].icon,
    iconUrl: `https://openweathermap.org/img/wn/${cur.weather[0].icon}@2x.png`,
    unit,
    unitSymbol,
  };

  const dailyMap = {};
  for (const item of forecastRes.data.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { minTemp: Infinity, maxTemp: -Infinity, temps: [], descriptions: [], icons: [] };
    }
    dailyMap[date].minTemp = Math.min(dailyMap[date].minTemp, item.main.temp);
    dailyMap[date].maxTemp = Math.max(dailyMap[date].maxTemp, item.main.temp);
    dailyMap[date].temps.push(item.main.temp);
    dailyMap[date].descriptions.push(item.weather[0].description);
    dailyMap[date].icons.push(item.weather[0].icon);
  }

  const forecast = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(1, 5)
    .map(([date, d]) => {
      const dateObj = new Date(date + 'T12:00:00');
      
      // АВТОМАТИЧНИЙ ПЕРЕКЛАД ДАТИ
      const locale = lang === 'uk' ? 'uk-UA' : 'en-US';
      const formattedDate = dateObj.toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });

      const avgTemp = Math.round(d.temps.reduce((a, b) => a + b, 0) / d.temps.length);
      const icon = mostCommon(d.icons);
      const description = mostCommon(d.descriptions);

      return {
        date,
        formattedDate: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
        minTemp: Math.round(d.minTemp),
        maxTemp: Math.round(d.maxTemp),
        avgTemp,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        icon,
        iconUrl: `https://openweathermap.org/img/wn/${icon}@2x.png`,
      };
    });

  const result = { current, forecast, unit, unitSymbol };
  setCache(city, unit, lang, result);
  return { ...result, fromCache: false };
}

module.exports = { getWeatherAndForecast };