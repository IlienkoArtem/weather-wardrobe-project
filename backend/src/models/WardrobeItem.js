// backend/src/models/WardrobeItem.js
const { getDb } = require('../../config/database');
const path = require('path');
const fs = require('fs');

const CATEGORY_MAP = {
  head:  ['шапка', 'кепка', 'хустка', 'шарф', 'панама'],
  torso: ['футболка', 'сорочка', 'майка', 'светр', 'кофта', 'кардиган',
          'куртка', 'пальто', 'вітровка', 'пуховик', 'шуба', 'гольф', 'polo',
          'дощовик', 'термобілизна'],
  legs:  ['шорти', 'штани', 'джинси', 'спідниця', 'легінси'],
  feet:  ['сандалі', 'босоніжки', 'кросівки', 'туфлі', 'взуття', 'шкарпетки',
          'черевики', 'чоботи'],
};

function inferCategory(name) {
  const l = name.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_MAP)) {
    if (kws.some(k => l.includes(k))) return cat;
  }
  return 'other';
}

// Save base64 image to disk, return URL path
function savePhoto(itemId, base64Data) {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Strip data URI prefix if present
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    const filename = `item_${itemId}_${Date.now()}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);

    return `/uploads/${filename}`;
  } catch (e) {
    console.error('savePhoto error:', e);
    return null;
  }
}

class WardrobeItem {
  static getAllByUserId(userId) {
    return getDb()
      .prepare('SELECT * FROM wardrobe_items WHERE user_id = ? ORDER BY created_at ASC')
      .all(userId);
  }

  static create(userId, name, photoBase64 = null) {
    const db = getDb();
    try {
      const result = db
        .prepare(
          'INSERT INTO wardrobe_items (user_id, name, category) VALUES (?, ?, ?)'
        )
        .run(userId, name, inferCategory(name));

      const item = db
        .prepare('SELECT * FROM wardrobe_items WHERE id = ?')
        .get(result.lastInsertRowid);

      // Save photo if provided
      if (photoBase64 && item) {
        const photoUrl = savePhoto(item.id, photoBase64);
        if (photoUrl) {
          db.prepare('UPDATE wardrobe_items SET photo_url = ? WHERE id = ?')
            .run(photoUrl, item.id);
          item.photo_url = photoUrl;
        }
      }

      return item;
    } catch (e) {
      if (e.message.includes('UNIQUE')) return null;
      throw e;
    }
  }

  static updatePhoto(id, userId, photoBase64) {
    const db = getDb();

    // Verify item belongs to user
    const item = db
      .prepare('SELECT * FROM wardrobe_items WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (!item) return null;

    const photoUrl = savePhoto(id, photoBase64);
    if (!photoUrl) return item; // return existing item if save failed

    db.prepare('UPDATE wardrobe_items SET photo_url = ? WHERE id = ? AND user_id = ?')
      .run(photoUrl, id, userId);

    return db.prepare('SELECT * FROM wardrobe_items WHERE id = ?').get(id);
  }

  static findById(id) {
    return getDb()
      .prepare('SELECT * FROM wardrobe_items WHERE id = ?')
      .get(id);
  }

  static deleteById(id, userId) {
    const db = getDb();

    // Clean up photo file if exists
    const item = db
      .prepare('SELECT photo_url FROM wardrobe_items WHERE id = ? AND user_id = ?')
      .get(id, userId);

    if (item?.photo_url) {
      try {
        const filepath = path.join(__dirname, '../..', item.photo_url);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      } catch (e) {
        console.warn('Could not delete photo file:', e.message);
      }
    }

    const r = db
      .prepare('DELETE FROM wardrobe_items WHERE id = ? AND user_id = ?')
      .run(id, userId);
    return r.changes > 0;
  }
}

module.exports = WardrobeItem;