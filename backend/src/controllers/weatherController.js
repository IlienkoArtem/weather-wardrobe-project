// backend/src/controllers/weatherController.js
const { getWeatherAndForecast } = require('../services/weatherService');
const { recommend, getWeatherTip } = require('../services/clothingService');
const User = require('../models/User');
const WardrobeItem = require('../models/WardrobeItem');

exports.getWeather = async (req, res) => {
  try {
    const { city } = req.params;
    // Додаємо lang до деструктуризації
    const { unit = 'Celsius', deviceId, lang = 'uk' } = req.query;

    if (!city || city.trim().length === 0) {
      return res.status(400).json({ error: 'City name is required' });
    }
    if (!['Celsius', 'Fahrenheit'].includes(unit)) {
      return res.status(400).json({ error: 'Invalid unit. Must be Celsius or Fahrenheit.' });
    }

    // Передаємо lang у сервіс погоди
    const weatherData = await getWeatherAndForecast(city.trim(), unit, lang);
    res.json(weatherData);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: `City "${req.params.city}" not found` });
    }
    console.error('getWeather error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather data.' });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const { city } = req.params;
    // Отримуємо lang з запиту (за замовчуванням 'uk')
    const { unit = 'Celsius', deviceId, lang = 'uk' } = req.query;

    if (!city || !deviceId) {
      return res.status(400).json({ error: 'City and deviceId are required' });
    }

    const user = User.findByDeviceId(deviceId);
    const wardrobeItems = user ? WardrobeItem.getAllByUserId(user.id) : [];

    // 1. Отримуємо погоду з урахуванням мови
    const weatherData = await getWeatherAndForecast(city.trim(), unit, lang);
    const { current, forecast } = weatherData;

    // 2. Рекомендації на сьогодні з урахуванням мови
    const todayRec = recommend(current.temp, unit, wardrobeItems, lang);
    const tip = getWeatherTip(current.description, current.icon, lang);

    // 3. Рекомендації для прогнозу з урахуванням мови
    const forecastWithRecs = forecast.map(day => {
      const dayRec = recommend(day.avgTemp, unit, wardrobeItems, lang);
      return { 
        ...day, 
        recommendations: dayRec 
      };
    });

    res.json({
      current: { ...current, recommendations: todayRec, tip },
      forecast: forecastWithRecs,
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: `City "${req.params.city}" not found` });
    }
    console.error('getRecommendations error:', err.message);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};