// backend/src/controllers/wardrobeController.js
const WardrobeItem = require('../models/WardrobeItem');
const User = require('../models/User');

exports.getItems = (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = User.findByDeviceId(deviceId);
    if (!user) return res.status(404).json({ error: 'User not found' });

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
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Item name too long (max 100 chars)' });
    }

    const user = User.findByDeviceId(deviceId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const item = WardrobeItem.create(user.id, name.trim());
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
    if (!user) return res.status(404).json({ error: 'User not found' });

    const deleted = WardrobeItem.deleteById(parseInt(itemId), user.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });

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

    const user = User.findByDeviceId(deviceId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Припускаємо, що у моделі WardrobeItem є метод updatePhoto
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