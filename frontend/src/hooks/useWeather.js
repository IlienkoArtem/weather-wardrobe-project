// frontend/src/hooks/useWeather.js
import { useState, useCallback } from 'react';
import { getRecommendations } from '../services/api';

export function useWeather() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Додаємо параметр lang сюди
  const fetchWeather = useCallback(async (city, unit, deviceId, lang = 'uk') => {
    if (!city?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Передаємо lang у сервіс API (якщо твій API підтримує мову як параметр)
      const data = await getRecommendations(city.trim(), unit, deviceId, lang);
      setWeatherData(data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Не вдалося отримати погоду';
      setError(msg);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { weatherData, loading, error, fetchWeather, clearError };
}