import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { registerUser, loginUser, updateUserSettings, getOrCreateUser } from '../services/api';
import { useWardrobe } from '../hooks/useWardrobe';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const UNIT_KEY = '@ww_unit';
const LANG_KEY = '@ww_lang';
const CITY_KEY = '@ww_city';

function SectionHeader({ label }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}
function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}
function RadioRow({ label, selected, onPress }) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.radioOuter, selected && styles.radioOuterOn]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ route, navigation }) {
  const deviceId = route.params?.deviceId;
  const { items } = useWardrobe(deviceId);

  const [user, setUser]           = useState(null);
  const [unit, setUnit]           = useState('Celsius');
  const [lang, setLang]           = useState('uk');
  const [city, setCity]           = useState('');
  const [savingCity, setSavingCity] = useState(false);

  // Auth форма
  const [authMode, setAuthMode]   = useState('login');
  const [email, setEmail]         = useState('');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Завантажити поточні налаштування
  useEffect(() => {
    (async () => {
      const [savedUnit, savedLang, savedCity] = await Promise.all([
        AsyncStorage.getItem(UNIT_KEY),
        AsyncStorage.getItem(LANG_KEY),
        AsyncStorage.getItem(CITY_KEY),
      ]);
      if (savedUnit) setUnit(savedUnit);
      if (savedLang) setLang(savedLang);
      if (savedCity) setCity(savedCity);
      if (deviceId) {
        const u = await getOrCreateUser(deviceId).catch(() => null);
        setUser(u);
      }
    })();
  }, [deviceId]);

  // Зберегти одиницю температури
  const handleUnit = async (value) => {
    setUnit(value);
    await AsyncStorage.setItem(UNIT_KEY, value);
    if (deviceId) updateUserSettings(deviceId, { tempUnit: value }).catch(() => {});
  };

  // Зберегти мову
  const handleLang = async (value) => {
    setLang(value);
    await AsyncStorage.setItem(LANG_KEY, value);
    if (deviceId) updateUserSettings(deviceId, { language: value }).catch(() => {});
  };

  // Зберегти місто
  const handleSaveCity = async () => {
    setSavingCity(true);
    await AsyncStorage.setItem(CITY_KEY, city.trim());
    if (deviceId) await updateUserSettings(deviceId, { preferredCity: city.trim() }).catch(() => {});
    setSavingCity(false);
    Alert.alert('✅', 'Місто збережено');
  };

  // Авторизація
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) return Alert.alert('Помилка', 'Заповніть усі поля');
    if (authMode === 'register' && !username.trim()) return Alert.alert('Помилка', "Введіть імʼя");
    setAuthLoading(true);
    try {
      let updated;
      if (authMode === 'register') {
        updated = await registerUser(deviceId, { email: email.trim(), username: username.trim(), password });
      } else {
        updated = await loginUser(email.trim(), password);
      }
      setUser(updated);
      setEmail(''); setPassword(''); setUsername('');
      Alert.alert('✅', authMode === 'register' ? 'Реєстрація успішна!' : 'Вхід успішний!');
    } catch (e) {
      Alert.alert('Помилка', e.response?.data?.error || 'Щось пішло не так');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.skyDeep} />
      <LinearGradient colors={[COLORS.skyDeep, COLORS.skyMid]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Налаштування</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── ПРОФІЛЬ ── */}
        <SectionHeader label="👤 Профіль" />
        <Card>
          {user?.email ? (
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.username?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View>
                <Text style={styles.profileName}>{user.username}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.hint}>
                Зареєструйтесь щоб зберігати дані між пристроями
              </Text>
              {/* Вкладки login / register */}
              <View style={styles.tabs}>
                {['login','register'].map(mode => (
                  <TouchableOpacity key={mode} style={[styles.tab, authMode === mode && styles.tabActive]}
                    onPress={() => setAuthMode(mode)}>
                    <Text style={[styles.tabText, authMode === mode && styles.tabTextActive]}>
                      {mode === 'login' ? 'Увійти' : 'Реєстрація'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {authMode === 'register' && (
                <TextInput style={styles.input} value={username} onChangeText={setUsername}
                  placeholder="Ваше імʼя" placeholderTextColor={COLORS.textMuted} />
              )}
              <TextInput style={styles.input} value={email} onChangeText={setEmail}
                placeholder="Email" placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={styles.input} value={password} onChangeText={setPassword}
                placeholder="Пароль (мін. 6 символів)" placeholderTextColor={COLORS.textMuted}
                secureTextEntry />
              <TouchableOpacity style={styles.authBtn} onPress={handleAuth}
                disabled={authLoading} activeOpacity={0.8}>
                {authLoading ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.authBtnText}>{authMode === 'login' ? 'Увійти' : 'Зареєструватись'}</Text>}
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* ── МОВА ── */}
        <SectionHeader label="🌐 Мова" />
        <Card>
          <RadioRow label="Українська 🇺🇦" selected={lang === 'uk'} onPress={() => handleLang('uk')} />
          <RadioRow label="English 🇬🇧"    selected={lang === 'en'} onPress={() => handleLang('en')} />
        </Card>

        {/* ── ТЕМПЕРАТУРА ── */}
        <SectionHeader label="🌡️ Одиниці температури" />
        <Card>
          <RadioRow label="Цельсій (°C)"    selected={unit === 'Celsius'}    onPress={() => handleUnit('Celsius')} />
          <RadioRow label="Фаренгейт (°F)"  selected={unit === 'Fahrenheit'} onPress={() => handleUnit('Fahrenheit')} />
        </Card>

        {/* ── МІСТО ── */}
        <SectionHeader label="📍 Місто за замовчуванням" />
        <Card>
          <TextInput style={styles.input} value={city} onChangeText={setCity}
            placeholder="Наприклад: Lviv" placeholderTextColor={COLORS.textMuted}
            autoCorrect={false} returnKeyType="done" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCity}
            disabled={savingCity} activeOpacity={0.8}>
            {savingCity ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.saveBtnText}>Зберегти</Text>}
          </TouchableOpacity>
        </Card>

        {/* ── ГАРДЕРОБ ── */}
        <SectionHeader label="👗 Гардероб" />
        <Card>
          <TouchableOpacity style={styles.linkBtn}
            onPress={() => navigation.navigate('Wardrobe', { deviceId })} activeOpacity={0.8}>
            <Text style={styles.linkBtnText}>
              Перейти до гардеробу ({items.length} речей) →
            </Text>
          </TouchableOpacity>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cloud },
  header: { paddingTop: 52, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.md },
  backBtn: { marginBottom: SPACING.sm },
  backText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },

  content: { padding: SPACING.md },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 1.2, textTransform: 'uppercase',
    marginTop: SPACING.md, marginBottom: SPACING.sm,
  },
  card: { backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.soft },

  hint: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.md },

  tabs: { flexDirection: 'row', borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SPACING.md },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.cloud },
  tabActive: { backgroundColor: COLORS.skyMid },
  tabText: { fontWeight: '600', fontSize: 14, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },

  input: {
    backgroundColor: COLORS.cloud, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    fontSize: 14, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  authBtn: { backgroundColor: COLORS.skyMid, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  authBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.skyMid, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, color: COLORS.white, fontWeight: '700' },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  profileEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },

  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.skyFog, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  radioOuterOn: { borderColor: COLORS.skyMid },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.skyMid },
  radioLabel: { fontSize: 15, color: COLORS.textPrimary },

  saveBtn: { backgroundColor: COLORS.skyMid, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

  linkBtn: { backgroundColor: COLORS.cloud, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  linkBtnText: { color: COLORS.skyMid, fontWeight: '700', fontSize: 15 },
});