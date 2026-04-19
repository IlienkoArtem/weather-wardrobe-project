// backend/src/controllers/userController.js
const User = require('../models/User');

exports.getOrCreateUser = (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    console.log(`[GET] Fetching or creating user for device: ${deviceId}`);
    
    const user = User.findOrCreate(deviceId);
    res.json({ user: User.safe(user) });
  } catch (e) {
    console.error('getOrCreateUser error:', e.message);
    res.status(500).json({ error: 'Помилка сервера при отриманні користувача' });
  }
};

exports.register = (req, res) => {
  try {
    const { email, username, password } = req.body;
    const deviceId = req.params.deviceId;

    console.log(`[POST] Registering user for device: ${deviceId}`, { email, username });

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, імʼя та пароль обовʼязкові' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль має бути мінімум 6 символів' });
    }
    
    // Перевірка формату email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Невірний формат email' });
    }

    let user;
    try {
      user = User.register(deviceId, {
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password,
      });
    } catch (e) {
      console.error('User.register internal error:', e.message);
      if (e.message === 'EMAIL_TAKEN' || e.message.includes('UNIQUE constraint failed: users.email')) {
        return res.status(409).json({ error: 'Цей email вже використовується іншим пристроєм' });
      }
      throw e; // Прокидаємо далі до зовнішнього catch
    }

    res.json({ user: User.safe(user) });
  } catch (e) {
    console.error('!!! REGISTER CONTROLLER ERROR:', e);
    // Повертаємо текст помилки на фронтенд для дебагу курсової
    res.status(500).json({ error: 'Помилка сервера: ' + e.message });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email та пароль обовʼязкові' });
    }

    const user = User.login(email.trim().toLowerCase(), password);
    if (!user) {
      return res.status(401).json({ error: 'Невірний email або пароль' });
    }

    res.json({ user: User.safe(user) });
  } catch (e) {
    console.error('login error:', e.message);
    res.status(500).json({ error: 'Помилка сервера при вході' });
  }
};

exports.updateSettings = (req, res) => {
  try {
    const { preferredCity, tempUnit, language } = req.body;
    const deviceId = req.params.deviceId;

    console.log(`[PATCH] Updating settings for ${deviceId}:`, req.body);

    if (tempUnit && !['Celsius', 'Fahrenheit'].includes(tempUnit)) {
      return res.status(400).json({ error: 'tempUnit має бути Celsius або Fahrenheit' });
    }
    if (language && !['uk', 'en'].includes(language)) {
      return res.status(400).json({ error: 'language має бути uk або en' });
    }

    // Переконуємося, що користувач існує
    User.findOrCreate(deviceId);

    const updated = User.updateSettings(deviceId, { preferredCity, tempUnit, language });
    res.json({ user: User.safe(updated) });
  } catch (e) {
    console.error('updateSettings error:', e.message);
    res.status(500).json({ error: 'Помилка сервера при оновленні налаштувань' });
  }
};