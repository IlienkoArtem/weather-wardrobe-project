// frontend/src/components/ClothingRecommendations.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, CATEGORY_LABELS } from '../constants/theme';

const CATEGORIES = ['head', 'torso', 'legs', 'feet'];

export default function ClothingRecommendations({ recommendations, title }) {
  if (!recommendations) return null;
  const recs = recommendations.recommendations || recommendations;

  return (
    <View style={styles.wrapper}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => {
          const item = recs[cat];
          if (!item) return null;
          return (
            <View key={cat} style={[styles.card, item.fromWardrobe && styles.cardHighlight]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.catLabel}>{CATEGORY_LABELS[cat]}</Text>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              {item.fromWardrobe && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Мій гардероб</Text>
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
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    width: '23%',
    marginBottom: SPACING.sm,
    ...SHADOWS.soft,
  },
  cardHighlight: {
    backgroundColor: '#EBF5FF',
    borderWidth: 1.5,
    borderColor: COLORS.skyLight,
  },
  emoji: { fontSize: 30, marginBottom: 4 },
  catLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 2,
  },
  badge: {
    marginTop: 4,
    backgroundColor: COLORS.skyLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 8, color: COLORS.white, fontWeight: '700' },
});