// backend/config/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/wardrobe.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
    runMigrations();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      username TEXT,
      password_hash TEXT,
      preferred_city TEXT DEFAULT '',
      temp_unit TEXT DEFAULT 'Celsius' CHECK(temp_unit IN ('Celsius', 'Fahrenheit')),
      language TEXT DEFAULT 'uk' CHECK(language IN ('uk', 'en')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wardrobe_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      photo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS weather_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL,
      data TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Celsius',
      lang TEXT NOT NULL DEFAULT 'uk', -- ДОДАНО КОЛОНКУ lang
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_wardrobe_user ON wardrobe_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_weather_cache_city ON weather_cache(city, unit, lang);
  `);
}

function runMigrations() {
  const migrations = [
    {
      name: 'add_email_to_users',
      sql: `ALTER TABLE users ADD COLUMN email TEXT UNIQUE`,
    },
    {
      name: 'add_username_to_users',
      sql: `ALTER TABLE users ADD COLUMN username TEXT`,
    },
    {
      name: 'add_password_hash_to_users',
      sql: `ALTER TABLE users ADD COLUMN password_hash TEXT`,
    },
    {
      name: 'add_language_to_users',
      sql: `ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'uk'`,
    },
    {
      name: 'add_photo_url_to_wardrobe',
      sql: `ALTER TABLE wardrobe_items ADD COLUMN photo_url TEXT`,
    },
    // НОВА МІГРАЦІЯ ДЛЯ КЕШУ ПОГОДИ
    {
      name: 'add_lang_to_weather_cache',
      sql: `ALTER TABLE weather_cache ADD COLUMN lang TEXT DEFAULT 'uk'`,
    },
  ];

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const migration of migrations) {
    const alreadyApplied = db
      .prepare('SELECT name FROM _migrations WHERE name = ?')
      .get(migration.name);

    if (!alreadyApplied) {
      try {
        db.exec(migration.sql);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
        console.log(`✅ Migration applied: ${migration.name}`);
      } catch (e) {
        if (e.message.includes('duplicate column') || e.message.includes('already exists')) {
          db.prepare('INSERT OR IGNORE INTO _migrations (name) VALUES (?)').run(migration.name);
        } else {
          console.warn(`⚠️  Migration warning (${migration.name}):`, e.message);
        }
      }
    }
  }
}

module.exports = { getDb };