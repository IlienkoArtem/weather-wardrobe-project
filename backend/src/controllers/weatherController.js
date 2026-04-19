// backend/src/controllers/weatherController.js
const { getWeatherAndForecast } = require('../services/weatherService');
const { recommend, getWeatherTip } = require('../services/clothingService');
const User = require('../models/User');
const WardrobeItem = require('../models/WardrobeItem');

exports.getWeather = async (req, res) => {
  try {
    const { city } = req.params;
    const { unit = 'Celsius', deviceId } = req.query;

    if (!city || city.trim().length === 0) {
      return res.status(400).json({ error: 'City name is required' });
    }
    if (!['Celsius', 'Fahrenheit'].includes(unit)) {
      return res.status(400).json({ error: 'Invalid unit. Must be Celsius or Fahrenheit.' });
    }

    const weatherData = await getWeatherAndForecast(city.trim(), unit);
    res.json(weatherData);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: `City "${req.params.city}" not found` });
    }
    console.error('getWeather error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data. Check city name or try again later.' });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { city } = req.params;
    const { unit = 'Celsius', deviceId } = req.query;

    if (!city || !deviceId) {
      return res.status(400).json({ error: 'City and deviceId are required' });
    }

    const user = User.findByDeviceId(deviceId);
    const wardrobeItems = user ? WardrobeItem.getAllByUserId(user.id) : [];

    const weatherData = await getWeatherAndForecast(city.trim(), unit);
    const { current, forecast } = weatherData;

    // Get recommendations for today
    const todayRec = recommend(current.temp, unit, wardrobeItems);
    const tip = getWeatherTip(current.description, current.icon);

    // Get recommendations for forecast days
    const forecastRecs = forecast.map(day => ({
      date: day.date,
      formattedDate: day.formattedDate,
      ...recommend(day.avgTemp, unit, wardrobeItems),
    }));

    res.json({
      current: { ...current, recommendations: todayRec, tip },
      forecast: forecast.map((day, i) => ({ ...day, recommendations: forecastRecs[i] })),
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: `City "${req.params.city}" not found` });
    }
    console.error('getRecommendations error:', err.message);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};