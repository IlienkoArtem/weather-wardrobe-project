import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet,
  StatusBar, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useDeviceId } from '../hooks/useDeviceId';
import { useWeather } from '../hooks/useWeather';
import { getOrCreateUser } from '../services/api';
import CitySearchBar from '../components/CitySearchBar';
import WeatherCard from '../components/WeatherCard';
import ForecastRow from '../components/ForecastRow';
import ClothingRecommendations from '../components/ClothingRecommendations';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const CITY_KEY = '@ww_city';
const UNIT_KEY = '@ww_unit';

export default function HomeScreen({ navigation }) {
  const { deviceId, loading: deviceLoading } = useDeviceId();
  const { weatherData, loading, error, fetchWeather, clearError } = useWeather();

  const [city, setCity]         = useState('');
  const [unit, setUnit]         = useState('Celsius');
  const [ready, setReady]       = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  // Завантажити збережені налаштування
  useEffect(() => {
    if (!deviceId) return;
    (async () => {
      try {
        const [savedCity, savedUnit] = await Promise.all([
          AsyncStorage.getItem(CITY_KEY),
          AsyncStorage.getItem(UNIT_KEY),
        ]);
        const resolvedUnit = savedUnit || 'Celsius';
        setUnit(resolvedUnit);
        await getOrCreateUser(deviceId).catch(() => {});
        if (savedCity) {
          setCity(savedCity);
          await fetchWeather(savedCity, resolvedUnit, deviceId);
        }
      } finally {
        setReady(true);
      }
    })();
  }, [deviceId]);

  // Слухаємо зміни налаштувань з SettingsScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const [savedCity, savedUnit] = await Promise.all([
        AsyncStorage.getItem(CITY_KEY),
        AsyncStorage.getItem(UNIT_KEY),
      ]);
      const newUnit = savedUnit || 'Celsius';
      const newCity = savedCity || city;
      if (newUnit !== unit || newCity !== city) {
        setUnit(newUnit);
        setCity(newCity);
        if (newCity) fetchWeather(newCity, newUnit, deviceId);
      }
    });
    return unsubscribe;
  }, [navigation, unit, city, deviceId]);

  const handleSearch = useCallback(async (newCity) => {
    clearError();
    setSelectedDay(null);
    setCity(newCity);
    await AsyncStorage.setItem(CITY_KEY, newCity);
    fetchWeather(newCity, unit, deviceId);
  }, [unit, deviceId]);

  const unitSymbol = unit === 'Celsius' ? '°C' : '°F';
  const current = weatherData?.current;
  const forecast = weatherData?.forecast;

  if (!ready || deviceLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.skyMid} />
        <Text style={styles.loadingText}>Завантаження...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.skyDeep} />

      <LinearGradient colors={[COLORS.skyDeep, COLORS.skyMid, COLORS.skyLight]} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appTitle}>🌤️ Погода & Гардероб</Text>
          {/* Єдина кнопка налаштувань */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings', { deviceId })}
            activeOpacity={0.8}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <CitySearchBar initialCity={city} onSearch={handleSearch} loading={loading} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} tintColor={COLORS.skyMid}
            onRefresh={() => city && fetchWeather(city, unit, deviceId)} />
        }
      >
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorDismiss}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {!city && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌍</Text>
            <Text style={styles.emptyTitle}>Введіть місто</Text>
            <Text style={styles.emptySub}>Щоб дізнатись погоду та отримати поради по одягу</Text>
          </View>
        )}

        {loading && !weatherData && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.skyMid} />
          </View>
        )}

        {current && (
          <>
            <WeatherCard current={current} unitSymbol={unitSymbol} />
            <ClothingRecommendations recommendations={current.recommendations} title="Рекомендації на сьогодні" />
            <ForecastRow forecast={forecast} unitSymbol={unitSymbol}
              onDayPress={day => setSelectedDay(p => p?.date === day.date ? null : day)} />
            {selectedDay && (
              <View style={styles.selectedDay}>
                <Text style={styles.selectedDayTitle}>{selectedDay.formattedDate}</Text>
                <ClothingRecommendations recommendations={selectedDay.recommendations} title="Рекомендації на день" />
              </View>
            )}
          </>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cloud },
  header: { paddingTop: 52, paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  appTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  settingsBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.full,
    padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  settingsIcon: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: SPACING.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: SPACING.sm, color: COLORS.textMuted },
  errorBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFEBEE', borderRadius: RADIUS.md,
    padding: SPACING.md, marginHorizontal: SPACING.md, marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.danger, fontSize: 13, flex: 1 },
  errorDismiss: { color: COLORS.skyMid, fontWeight: '700', fontSize: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: SPACING.xl },
  emptyEmoji: { fontSize: 64, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.skyDeep, marginBottom: SPACING.sm },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  selectedDay: {
    marginHorizontal: SPACING.md, marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  selectedDayTitle: { fontSize: 14, fontWeight: '800', color: COLORS.skyDeep, marginBottom: SPACING.sm },
});