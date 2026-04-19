// frontend/src/components/ClothingRecommendations.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { BASE_URL } from '../services/api';

const CATEGORIES = ['head', 'torso', 'legs', 'feet'];

const CLOTHING_DICTIONARY = {
  'шапка': 'Winter Hat',
  'куртка': 'Jacket',
  'штани': 'Pants',
  'джинси': 'Jeans',
  'черевики': 'Boots',
  'кросівки': 'Sneakers',
  'футболка': 'T-Shirt',
  'светр': 'Sweater',
  'пальто': 'Coat',
  'кепка': 'Cap',
  'панама': 'Panama Hat',
  'шорти': 'Shorts'
};

// Функція для формування повної адреси зображення
function photoUri(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const serverRoot = BASE_URL.replace('/api', '');
  return `${serverRoot}${url}`;
}

export default function ClothingRecommendations({ recommendations, title, lang = 'uk' }) {
  if (!recommendations) return null;
  
  const recs = recommendations.recommendations || recommendations;

  const translations = {
    uk: { 
      head: 'Голова', torso: 'Верх', legs: 'Низ', feet: 'Взуття', 
      wardrobe: 'Мій гардероб' 
    },
    en: { 
      head: 'Head', torso: 'Top', legs: 'Bottom', feet: 'Shoes', 
      wardrobe: 'Wardrobe' 
    }
  };

  const t = translations[lang] || translations.uk;

  const getTranslatedName = (originalName) => {
    if (lang === 'uk') return originalName;
    const lower = originalName.toLowerCase().trim();
    if (CLOTHING_DICTIONARY[lower]) {
      return CLOTHING_DICTIONARY[lower];
    }
    return originalName;
  };

  return (
    <View style={styles.wrapper}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => {
          const item = recs[cat];
          if (!item) return null;

          const uri = photoUri(item.photoUrl);

          return (
            <View 
              key={cat} 
              style={[
                styles.card, 
                item.fromWardrobe && styles.cardHighlight
              ]}
            >
              <View style={styles.imageContainer}>
                {uri ? (
                  <Image 
                    source={{ uri }} 
                    style={styles.itemImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.emoji}>{item.emoji}</Text>
                )}
              </View>
              
              <Text style={styles.catLabel}>{t[cat]}</Text>
              
              <Text style={styles.itemName} numberOfLines={2}>
                {getTranslatedName(item.name)}
              </Text>
              
              {item.fromWardrobe && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t.wardrobe}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    marginHorizontal: SPACING.md, 
    marginBottom: SPACING.sm,
  },
  title: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: COLORS.textMuted, 
    letterSpacing: 1, 
    textTransform: 'uppercase', 
    marginBottom: SPACING.sm 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  card: { 
    backgroundColor: COLORS.surfaceCard, 
    borderRadius: RADIUS.md, 
    padding: SPACING.sm, 
    alignItems: 'center', 
    width: '23%', 
    minHeight: 110,
    marginBottom: SPACING.sm, 
    ...SHADOWS.soft 
  },
  cardHighlight: { 
    backgroundColor: '#EBF5FF', 
    borderWidth: 1.5, 
    borderColor: COLORS.skyLight 
  },
  imageContainer: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.xs,
  },
  emoji: { fontSize: 30 },
  catLabel: { 
    fontSize: 9, 
    fontWeight: '700', 
    color: COLORS.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  itemName: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: COLORS.textPrimary, 
    textAlign: 'center', 
    marginTop: 2 
  },
  badge: { 
    marginTop: 4, 
    backgroundColor: COLORS.skyLight, 
    borderRadius: RADIUS.full, 
    paddingHorizontal: 4, 
    paddingVertical: 1 
  },
  badgeText: { fontSize: 8, color: COLORS.white, fontWeight: '700' },
});