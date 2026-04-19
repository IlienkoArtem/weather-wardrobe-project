// frontend/src/components/ForecastRow.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export default function ForecastRow({ forecast, unitSymbol, onDayPress, lang = 'uk' }) {
  if (!forecast?.length) return null;

  const t = {
    uk: { title: 'Прогноз на 4 дні' },
    en: { title: '4-Day Forecast' }
  }[lang];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>{t.title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {forecast.map((day) => (
          <TouchableOpacity
            key={day.date}
            style={styles.card}
            onPress={() => onDayPress?.(day)}
            activeOpacity={0.78}
          >
            <Text style={styles.date}>{day.formattedDate}</Text>
            {day.iconUrl ? (
              <Image source={{ uri: day.iconUrl }} style={styles.icon} />
            ) : (
              <Text style={styles.noIcon}>?</Text>
            )}
            <Text style={styles.range}>
              {day.minTemp}° – {day.maxTemp}{unitSymbol}
            </Text>
            <Text style={styles.desc} numberOfLines={2}>{day.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  scroll: { paddingBottom: SPACING.sm },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginRight: SPACING.sm,
    alignItems: 'center',
    width: 90,
    ...SHADOWS.soft,
  },
  date: { fontSize: 11, fontWeight: '700', color: COLORS.skyMid, textAlign: 'center' },
  icon: { width: 44, height: 44, marginVertical: 4 },
  noIcon: { fontSize: 24, marginVertical: 4 },
  range: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  desc: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
});