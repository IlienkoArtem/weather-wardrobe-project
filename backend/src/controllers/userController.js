const User = require('../models/User');

exports.getOrCreateUser = (req, res) => {
  try {
    const user = User.findOrCreate(req.params.deviceId);
    res.json({ user: User.safe(user) });
  } catch (e) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

exports.register = (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ error: 'email, username та password обовʼязкові' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Пароль мінімум 6 символів' });

    const existing = User.findByEmail(email);
    if (existing && existing.device_id !== req.params.deviceId)
      return res.status(409).json({ error: 'Цей email вже використовується' });

    const user = User.register(req.params.deviceId, { email: email.trim(), username: username.trim(), password });
    res.json({ user: User.safe(user) });
  } catch (e) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'email та password обовʼязкові' });

    const user = User.login(email.trim(), password);
    if (!user) return res.status(401).json({ error: 'Невірний email або пароль' });

    res.json({ user: User.safe(user) });
  } catch (e) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
};

exports.updateSettings = (req, res) => {
  try {
    const { preferredCity, tempUnit, language } = req.body;
    if (tempUnit && !['Celsius','Fahrenheit'].includes(tempUnit))
      return res.status(400).json({ error: 'tempUnit має бути Celsius або Fahrenheit' });
    if (language && !['uk','en'].includes(language))
      return res.status(400).json({ error: 'language має бути uk або en' });

    const user = User.findByDeviceId(req.params.deviceId);
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

    const updated = User.updateSettings(req.params.deviceId, { preferredCity, tempUnit, language });
    res.json({ user: User.safe(updated) });
  } catch (e) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
};