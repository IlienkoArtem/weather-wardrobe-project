// backend/src/services/clothingService.js

const TEMP_GUIDELINES = {
  very_cold: { // < 5°C
    head: { uk: ['шапка', 'шарф'], en: ['hat', 'scarf'] },
    torso: { uk: ['пуховик', 'шуба', 'пальто', 'куртка', 'светр'], en: ['down jacket', 'coat', 'jacket', 'sweater'] },
    legs: { uk: ['теплі штани', 'джинси'], en: ['warm pants', 'jeans', 'winter pants'] },
    feet: { uk: ['зимові черевики', 'чоботи'], en: ['winter boots', 'boots'] },
  },
  cold: { // 5–15°C
    head: { uk: ['шапка', 'шарф'], en: ['hat', 'scarf'] },
    torso: { uk: ['куртка', 'пальто', 'светр', 'кофта'], en: ['jacket', 'coat', 'sweater', 'hoodie'] },
    legs: { uk: ['джинси', 'штани'], en: ['jeans', 'pants'] },
    feet: { uk: ['кросівки', 'черевики'], en: ['sneakers', 'boots'] },
  },
  cool: { // 15–22°C
    head: { uk: ['кепка', 'панама'], en: ['cap', 'panama'] },
    torso: { uk: ['вітровка', 'кофта', 'кардиган', 'сорочка', 'polo'], en: ['windbreaker', 'cardigan', 'shirt', 'polo'] },
    legs: { uk: ['джинси', 'штани', 'легінси'], en: ['jeans', 'pants', 'leggings'] },
    feet: { uk: ['кросівки', 'туфлі'], en: ['sneakers', 'shoes'] },
  },
  warm: { // > 22°C
    head: { uk: ['кепка', 'панама'], en: ['cap', 'panama'] },
    torso: { uk: ['футболка', 'майка', 'сорочка'], en: ['t-shirt', 'tank top', 'shirt'] },
    legs: { uk: ['шорти', 'спідниця', 'легкі штани'], en: ['shorts', 'skirt', 'light pants'] },
    feet: { uk: ['сандалі', 'босоніжки', 'кросівки'], en: ['sandals', 'sneakers'] },
  },
};

const DEFAULTS = {
  very_cold: {
    head: { uk: 'Шапка/Шарф', en: 'Hat/Scarf' },
    torso: { uk: 'Тепла куртка', en: 'Warm Jacket' },
    legs: { uk: 'Теплі штани', en: 'Warm Pants' },
    feet: { uk: 'Зимове взуття', en: 'Winter Boots' }
  },
  cold: {
    head: { uk: 'Шапка', en: 'Hat' },
    torso: { uk: 'Куртка/Светр', en: 'Jacket/Sweater' },
    legs: { uk: 'Штани', en: 'Pants' },
    feet: { uk: 'Черевики', en: 'Boots' }
  },
  cool: {
    head: { uk: 'Кепка', en: 'Cap' },
    torso: { uk: 'Легка куртка', en: 'Light Jacket' },
    legs: { uk: 'Джинси', en: 'Jeans' },
    feet: { uk: 'Кросівки', en: 'Sneakers' }
  },
  warm: {
    head: { uk: 'Кепка/Панама', en: 'Cap/Panama' },
    torso: { uk: 'Футболка', en: 'T-Shirt' },
    legs: { uk: 'Шорти', en: 'Shorts' },
    feet: { uk: 'Легке взуття', en: 'Light Shoes' }
  }
};

const EMOJI_MAP = {
  'шапка': '🧢', 'hat': '🧢', 'кепка': '🧢', 'cap': '🧢', 'панама': '👒',
  'футболка': '👕', 't-shirt': '👕', 'сорочка': '👔', 'shirt': '👔',
  'светр': '🧶', 'sweater': '🧶', 'куртка': '🧥', 'jacket': '🧥',
  'пуховик': '🧥', 'coat': '🧥', 'шорти': '🩳', 'shorts': '🩳',
  'штани': '👖', 'pants': '👖', 'джинси': '👖', 'jeans': '👖',
  'кросівки': '👟', 'sneakers': '👟', 'сандалі': '👡', 'sandals': '👡'
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
  return '👕';
}

function getWeatherTip(description, iconCode, lang = 'uk') {
  const desc = (description || '').toLowerCase();
  const isEn = lang === 'en';

  if (desc.includes('дощ') || desc.includes('rain')) {
    return { 
      text: isEn ? 'Don\'t forget your umbrella!' : 'Не забудьте парасольку!', 
      emoji: '☔' 
    };
  }
  if (desc.includes('гроза') || desc.includes('thunderstorm')) {
    return { 
      text: isEn ? 'Be careful, thunderstorm possible!' : 'Будьте обережні, гроза!', 
      emoji: '⛈️' 
    };
  }
  if (desc.includes('ясно') || desc.includes('clear') || desc.includes('sunny')) {
    return { 
      text: isEn ? 'It\'s sunny! Take sunglasses.' : 'Сонячно! Візьміть окуляри.', 
      emoji: '😎' 
    };
  }
  if (desc.includes('хмарно') || desc.includes('cloud')) {
    return { 
      text: isEn ? 'Cloudy, but no rain.' : 'Похмуро, але без опадів.', 
      emoji: '☁️' 
    };
  }
  return { 
    text: isEn ? 'Have a great day!' : 'Приємного дня!', 
    emoji: '😊' 
  };
}

function recommend(temperature, unit, wardrobeItems, lang = 'uk') {
  const tempCelsius = toCelsius(temperature, unit);
  const category = getTempCategory(tempCelsius);
  const guidelines = TEMP_GUIDELINES[category];
  const defaults = DEFAULTS[category];
  
  const result = {};
  for (const [part, langKeywords] of Object.entries(guidelines)) {
    let found = null;
    const keywords = langKeywords[lang] || langKeywords['uk'];
    
    for (const keyword of keywords) {
      // Шукаємо в гардеробі об'єкт цілком, щоб мати доступ до photo_url
      const match = wardrobeItems.find(item => {
        const itemName = (item.name || item).toLowerCase();
        return itemName.includes(keyword.toLowerCase());
      });
      
      if (match) { 
        found = match; 
        break; 
      }
    }

    // Визначаємо ім'я: або з гардеробу, або дефолтне
    const name = found ? (found.name || found) : (defaults[part][lang] || defaults[part]['uk']);
    
    result[part] = { 
      name, 
      emoji: getEmoji(name), 
      fromWardrobe: !!found,
      // Додаємо посилання на фото, якщо воно є у знайденого предмета
      photoUrl: found && found.photo_url ? found.photo_url : null
    };
  }

  return { recommendations: result, category, tempCelsius: Math.round(tempCelsius) };
}

module.exports = { recommend, getWeatherTip, getEmoji };