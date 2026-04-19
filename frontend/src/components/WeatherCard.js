// frontend/src/components/WeatherCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function WeatherCard({ current, unitSymbol, lang = 'uk' }) {
  if (!current) return null;

  const t = {
    uk: { feels: 'Відчувається як', humidity: 'Вологість', wind: 'Вітер', speed: 'м/с' },
    en: { feels: 'Feels like', humidity: 'Humidity', wind: 'Wind', speed: 'm/s' }
  }[lang];

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {current.iconUrl ? (
          <Image source={{ uri: current.iconUrl }} style={styles.icon} />
        ) : null}
        <View style={styles.info}>
          <Text style={styles.city}>{current.city}, {current.country}</Text>
          <Text style={styles.temp}>{current.temp}{unitSymbol}</Text>
          <Text style={styles.desc}>{current.description}</Text>
          <Text style={styles.feels}>{t.feels} {current.feelsLike}{unitSymbol}</Text>
        </View>
      </View>
      <View style={styles.extras}>
        <View style={styles.extraItem}>
          <Text style={styles.extraLabel}>💧 {t.humidity}</Text>
          <Text style={styles.extraValue}>{current.humidity}%</Text>
        </View>
        <View style={styles.extraItem}>
          <Text style={styles.extraLabel}>💨 {t.wind}</Text>
          <Text style={styles.extraValue}>{current.windSpeed} {t.speed}</Text>
        </View>
      </View>
      {current.tip && (
        <View style={styles.tipRow}>
          <Text style={styles.tipEmoji}>{current.tip.emoji}</Text>
          <Text style={styles.tipText}>{current.tip.text}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginHorizontal: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.card },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 80, height: 80, marginRight: SPACING.md },
  info: { flex: 1 },
  city: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 2 },
  temp: { fontSize: 52, fontWeight: '800', color: COLORS.skyDeep, lineHeight: 58 },
  desc: { fontSize: 16, color: COLORS.textSecondary, textTransform: 'capitalize' },
  feels: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  extras: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  extraItem: { alignItems: 'center' },
  extraLabel: { fontSize: 12, color: COLORS.textMuted },
  extraValue: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, backgroundColor: COLORS.cloud, borderRadius: RADIUS.md, padding: SPACING.sm },
  tipEmoji: { fontSize: 20, marginRight: SPACING.sm },
  tipText: { fontSize: 13, color: COLORS.skyDeep, flex: 1, fontWeight: '600' },
});