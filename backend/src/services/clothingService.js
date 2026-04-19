// backend/src/services/clothingService.js

const TEMP_GUIDELINES = {
  very_cold: { // < 5°C
    head: ['шапка', 'шарф'],
    torso: ['пуховик', 'шуба', 'пальто', 'куртка', 'термобілизна', 'светр', 'гольф'],
    legs: ['теплі штани', 'зимові штани', 'джинси', 'легінси'],
    feet: ['зимові черевики', 'теплі шкарпетки', 'чоботи'],
  },
  cold: { // 5–15°C
    head: ['шапка', 'шарф'],
    torso: ['куртка', 'пальто', 'светр', 'кофта', 'кардиган', 'гольф'],
    legs: ['джинси', 'довгі штани'],
    feet: ['кросівки', 'черевики', 'шкарпетки'],
  },
  cool: { // 15–22°C
    head: ['кепка', 'панама'],
    torso: ['вітровка', 'кофта', 'кардиган', 'сорочка з довгим рукавом', 'polo'],
    legs: ['джинси', 'штани', 'легінси'],
    feet: ['кросівки', 'туфлі'],
  },
  warm: { // > 22°C
    head: ['кепка', 'панама'],
    torso: ['футболка', 'майка', 'сорочка', 'polo'],
    legs: ['шорти', 'спідниця', 'легкі штани'],
    feet: ['сандалі', 'босоніжки', 'кросівки'],
  },
};

const DEFAULTS = {
  very_cold: { head: 'Шапка/Шарф', torso: 'Тепла куртка/Пуховик', legs: 'Теплі штани', feet: 'Зимові черевики' },
  cold: { head: 'Шапка/Шарф', torso: 'Куртка/Светр', legs: 'Довгі штани', feet: 'Закрите взуття' },
  cool: { head: 'Кепка/Панама', torso: 'Легка куртка/Кофта', legs: 'Джинси/Штани', feet: 'Кросівки' },
  warm: { head: 'Кепка/Панама', torso: 'Футболка/Сорочка', legs: 'Шорти/Спідниця', feet: 'Легке взуття' },
};

const EMOJI_MAP = {
  'шапка': '🧢', 'кепка': '🧢', 'хустка': '🧣', 'шарф': '🧣', 'панама': '👒',
  'футболка': '👕', 'сорочка': '👔', 'майка': '🎽',
  'светр': '🧶', 'кофта': '🧥', 'кардиган': '🧥',
  'куртка': '🧥', 'пальто': '🧥', 'вітровка': '🧥', 'пуховик': '🧥', 'шуба': '🧥',
  'гольф': '👕', 'polo': '👕', 'дощовик': '☔', 'термобілизна': '🩱',
  'шорти': '🩳', 'штани': '👖', 'джинси': '👖',
  'спідниця': '👗', 'легінси': '👖',
  'сандалі': '👡', 'босоніжки': '👡', 'кросівки': '👟',
  'туфлі': '👞', 'взуття': '👟', 'шкарпетки': '🧦',
  'черевики': '👢', 'чоботи': '👢',
};

function getTempCategory(tempCelsius) {
  if (tempCelsius < 5) return 'very_cold';
  if (tempCelsius < 15) return 'cold';
  if (tempCelsius < 22) return 'cool';
  return 'warm';
}

function toCelsius(temp, unit) {
  return unit === 'Fahrenheit' ? (temp - 32) * 5 / 9 : temp;
}

function getEmoji(name) {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return '❓';
}

function getWeatherTip(description, iconCode) {
  const desc = (description || '').toLowerCase();
  const icon = (iconCode || '').toLowerCase();

  if ('дощ' in desc.split(' ') || ['09d','09n','10d','10n'].includes(icon) || desc.includes('дощ')) {
    return { text: 'Не забудьте парасольку!', emoji: '☔' };
  }
  if (desc.includes('гроза') || ['11d','11n'].includes(icon)) {
    return { text: 'Будьте обережні, можлива гроза!', emoji: '⛈️' };
  }
  if (['01d','01n'].includes(icon) || desc.includes('ясно')) {
    return { text: 'Сьогодні сонячно! Візьміть сонцезахисні окуляри.', emoji: '😎' };
  }
  if (desc.includes('сніг') || ['13d','13n'].includes(icon)) {
    return { text: 'Обережно, на дорогах може бути слизько!', emoji: '❄️' };
  }
  if (desc.includes('туман') || ['50d','50n'].includes(icon)) {
    return { text: 'Видимість обмежена, будьте уважні!', emoji: '🌫️' };
  }
  if (['02d','02n','03d','03n','04d','04n'].includes(icon) || desc.includes('хмарно')) {
    return { text: 'Похмуро, але без опадів.', emoji: '☁️' };
  }
  return { text: 'Приємного дня!', emoji: '😊' };
}

function recommend(temperature, unit, wardrobeItems) {
  const tempCelsius = toCelsius(temperature, unit);
  const category = getTempCategory(tempCelsius);
  const guidelines = TEMP_GUIDELINES[category];
  const defaults = DEFAULTS[category];
  const names = wardrobeItems.map(i => i.name || i);

  const result = {};
  for (const [part, keywords] of Object.entries(guidelines)) {
    let found = null;
    for (const keyword of keywords) {
      const match = names.find(n => n.toLowerCase().includes(keyword.toLowerCase()));
      if (match) { found = match; break; }
    }
    const name = found || defaults[part];
    result[part] = { name, emoji: getEmoji(name), fromWardrobe: !!found };
  }

  return { recommendations: result, category, tempCelsius: Math.round(tempCelsius) };
}

module.exports = { recommend, getWeatherTip, getEmoji };