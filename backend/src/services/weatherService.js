// backend/src/services/weatherService.js
const axios = require('axios');
const { getDb } = require('../../config/database');

const API_KEY = process.env.OPENWEATHER_API_KEY || 'fb73c960451f4232da579140019bb2d3';
const CACHE_TTL_MINUTES = 10;

const UKR_WEEKDAYS = { 0: 'Пн', 1: 'Вт', 2: 'Ср', 3: 'Чт', 4: 'Пт', 5: 'Сб', 6: 'Нд' };
const UKR_MONTHS = {
  1: 'Січ', 2: 'Лют', 3: 'Бер', 4: 'Кві', 5: 'Тра', 6: 'Чер',
  7: 'Лип', 8: 'Сер', 9: 'Вер', 10: 'Жов', 11: 'Лис', 12: 'Гру',
};

function mostCommon(arr) {
  const counts = {};
  let max = 0, result = arr[0];
  for (const v of arr) {
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > max) { max = counts[v]; result = v; }
  }
  return result;
}

function getCached(city, unit) {
  const db = getDb();
  const cutoff = new Date(Date.now() - CACHE_TTL_MINUTES * 60 * 1000).toISOString();
  const row = db.prepare(
    `SELECT data FROM weather_cache WHERE city = ? AND unit = ? AND cached_at > ? ORDER BY cached_at DESC LIMIT 1`
  ).get(city.toLowerCase(), unit, cutoff);
  return row ? JSON.parse(row.data) : null;
}

function setCache(city, unit, data) {
  const db = getDb();
  db.prepare(
    `INSERT INTO weather_cache (city, unit, data) VALUES (?, ?, ?)`
  ).run(city.toLowerCase(), unit, JSON.stringify(data));
  // Cleanup old cache entries
  db.prepare(`DELETE FROM weather_cache WHERE cached_at < datetime('now', '-1 hour')`).run();
}

async function getWeatherAndForecast(city, unit = 'Celsius') {
  const cached = getCached(city, unit);
  if (cached) return { ...cached, fromCache: true };

  const unitParam = unit === 'Celsius' ? 'metric' : 'imperial';
  const unitSymbol = unit === 'Celsius' ? '°C' : '°F';

  const [currentRes, forecastRes] = await Promise.all([
    axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: { q: city, appid: API_KEY, units: unitParam, lang: 'ua' },
      timeout: 7000,
    }),
    axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: { q: city, appid: API_KEY, units: unitParam, lang: 'ua' },
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

  // Process 5-day forecast into daily aggregates
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
      const avgTemp = Math.round(d.temps.reduce((a, b) => a + b, 0) / d.temps.length);
      const icon = mostCommon(d.icons);
      const description = mostCommon(d.descriptions);
      const weekday = UKR_WEEKDAYS[dateObj.getDay()];
      const month = UKR_MONTHS[dateObj.getMonth() + 1];
      return {
        date,
        formattedDate: `${weekday}, ${dateObj.getDate()} ${month}`,
        minTemp: Math.round(d.minTemp),
        maxTemp: Math.round(d.maxTemp),
        avgTemp,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        icon,
        iconUrl: `https://openweathermap.org/img/wn/${icon}@2x.png`,
      };
    });

  const result = { current, forecast, unit, unitSymbol };
  setCache(city, unit, result);
  return { ...result, fromCache: false };
}

module.exports = { getWeatherAndForecast };