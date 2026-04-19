const { getDb } = require('../../config/database');

const CATEGORY_MAP = {
  head:  ['шапка','кепка','хустка','шарф','панама'],
  torso: ['футболка','сорочка','майка','светр','кофта','кардиган','куртка','пальто','вітровка','пуховик','шуба','гольф','polo','дощовик','термобілизна'],
  legs:  ['шорти','штани','джинси','спідниця','легінси'],
  feet:  ['сандалі','босоніжки','кросівки','туфлі','взуття','шкарпетки','черевики','чоботи'],
};
function inferCategory(name) {
  const l = name.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_MAP))
    if (kws.some(k => l.includes(k))) return cat;
  return 'other';
}

class WardrobeItem {
  static getAllByUserId(userId) {
    return getDb().prepare('SELECT * FROM wardrobe_items WHERE user_id=? ORDER BY created_at ASC').all(userId);
  }
  static create(userId, name, photoUrl = null) {
    const db = getDb();
    try {
      const result = db.prepare(
        'INSERT INTO wardrobe_items (user_id,name,category,photo_url) VALUES (?,?,?,?)'
      ).run(userId, name, inferCategory(name), photoUrl);
      return db.prepare('SELECT * FROM wardrobe_items WHERE id=?').get(result.lastInsertRowid);
    } catch (e) {
      if (e.message.includes('UNIQUE')) return null;
      throw e;
    }
  }
  static updatePhoto(id, userId, photoUrl) {
    const db = getDb();
    db.prepare('UPDATE wardrobe_items SET photo_url=? WHERE id=? AND user_id=?').run(photoUrl, id, userId);
    return db.prepare('SELECT * FROM wardrobe_items WHERE id=?').get(id);
  }
  static findById(id) {
    return getDb().prepare('SELECT * FROM wardrobe_items WHERE id=?').get(id);
  }
  static deleteById(id, userId) {
    const r = getDb().prepare('DELETE FROM wardrobe_items WHERE id=? AND user_id=?').run(id, userId);
    return r.changes > 0;
  }
}

module.exports = WardrobeItem;