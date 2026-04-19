const { getDb } = require('../../config/database');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256')
    .update(password + (process.env.PASSWORD_SALT || 'ww-salt-2024'))
    .digest('hex');
}

class User {
  static findByDeviceId(deviceId) {
    return getDb().prepare('SELECT * FROM users WHERE device_id = ?').get(deviceId);
  }
  static findById(id) {
    return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
  }
  static findByEmail(email) {
    return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
  }
  static findOrCreate(deviceId) {
    let user = this.findByDeviceId(deviceId);
    if (!user) {
      const result = getDb().prepare('INSERT INTO users (device_id) VALUES (?)').run(deviceId);
      user = this.findById(result.lastInsertRowid);
    }
    return user;
  }
  static register(deviceId, { email, username, password }) {
    const passwordHash = hashPassword(password);
    getDb().prepare(`
      UPDATE users SET email=?, username=?, password_hash=?, updated_at=CURRENT_TIMESTAMP
      WHERE device_id=?
    `).run(email, username, passwordHash, deviceId);
    return this.findByDeviceId(deviceId);
  }
  static login(email, password) {
    const user = this.findByEmail(email);
    if (!user || !user.password_hash) return null;
    const hash = hashPassword(password);
    return hash === user.password_hash ? user : null;
  }
  static updateSettings(deviceId, { preferredCity, tempUnit, language }) {
    const db = getDb();
    const fields = [], values = [];
    if (preferredCity !== undefined) { fields.push('preferred_city=?'); values.push(preferredCity); }
    if (tempUnit      !== undefined) { fields.push('temp_unit=?');      values.push(tempUnit); }
    if (language      !== undefined) { fields.push('language=?');       values.push(language); }
    if (!fields.length) return this.findByDeviceId(deviceId);
    fields.push('updated_at=CURRENT_TIMESTAMP');
    values.push(deviceId);
    db.prepare(`UPDATE users SET ${fields.join(',')} WHERE device_id=?`).run(...values);
    return this.findByDeviceId(deviceId);
  }
  // Повернути без пароля
  static safe(user) {
    if (!user) return null;
    const { password_hash, ...safe } = user;
    return safe;
  }
}

module.exports = User;