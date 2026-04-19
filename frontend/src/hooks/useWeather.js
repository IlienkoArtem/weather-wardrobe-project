// frontend/src/hooks/useWeather.js
import { useState, useCallback } from 'react';
import { getRecommendations } from '../services/api';

export function useWeather() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (city, unit, deviceId) => {
    if (!city?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendations(city.trim(), unit, deviceId);
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