// backend/src/controllers/wardrobeController.js
const WardrobeItem = require('../models/WardrobeItem');
const User = require('../models/User');

exports.getItems = (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Шукаємо користувача за deviceId
    const user = User.findByDeviceId(deviceId);

    // ПЕРЕВІРКА: Якщо користувача немає або він не зареєстрував email — повертаємо порожній список
    if (!user || !user.email) {
      return res.json({ items: [] });
    }

    const items = WardrobeItem.getAllByUserId(user.id);
    res.json({ items });
  } catch (err) {
    console.error('getItems error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addItem = (req, res) => {
  try {
    const { deviceId } = req.params;
    const { name, photoBase64 } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    // Шукаємо користувача
    const user = User.findByDeviceId(deviceId);

    // ПЕРЕВІРКА: Не даємо додавати речі анонімам
    if (!user || !user.email) {
      return res.status(403).json({ error: 'Registration required to add items' });
    }

    const item = WardrobeItem.create(user.id, name.trim(), photoBase64 || null);

    if (!item) {
      return res.status(409).json({ error: 'Item already exists in wardrobe' });
    }
    res.status(201).json({ item });
  } catch (err) {
    console.error('addItem error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteItem = (req, res) => {
  try {
    const { deviceId, itemId } = req.params;
    
    const user = User.findByDeviceId(deviceId);
    
    // ПЕРЕВІРКА ПРАВ
    if (!user || !user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = WardrobeItem.deleteById(parseInt(itemId), user.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ success: true, message: 'Item removed from wardrobe' });
  } catch (err) {
    console.error('deleteItem error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updatePhoto = (req, res) => {
  try {
    const { deviceId, itemId } = req.params;
    const { photoBase64 } = req.body;

    if (!photoBase64) {
      return res.status(400).json({ error: 'photoBase64 is required' });
    }

    const user = User.findByDeviceId(deviceId);

    // ПЕРЕВІРКА ПРАВ
    if (!user || !user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedItem = WardrobeItem.updatePhoto(parseInt(itemId), user.id, photoBase64);

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }
    res.json({ item: updatedItem });
  } catch (err) {
    console.error('updatePhoto error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};