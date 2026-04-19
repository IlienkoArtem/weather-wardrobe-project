// frontend/src/components/CitySearchBar.js
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function CitySearchBar({ initialCity = '', onSearch, loading }) {
  const [city, setCity] = useState(initialCity);

  const handleSubmit = () => {
    const trimmed = city.trim();
    if (trimmed) onSearch(trimmed);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="Введіть місто..."
        placeholderTextColor={COLORS.textMuted}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        autoCorrect={false}
        autoCapitalize="words"
      />
      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.btnText}>{loading ? '...' : '🔍'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    shadowColor: COLORS.skyDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  btn: {
    backgroundColor: COLORS.skyMid,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 52,
  },
  btnDisabled: { backgroundColor: COLORS.skyFog },
  btnText: { fontSize: 18 },
});