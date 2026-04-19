// frontend/src/screens/SettingsScreen.js
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
const USER_KEY = '@ww_user';
const LOGOUT_FLAG = '@ww_is_logged_out';

const TRANSLATIONS = {
  uk: {
    settings: '⚙️ Налаштування', profile: '👤 Профіль',
    language: '🌐 Мова', temperature: '🌡️ Одиниці температури',
    wardrobe: '👗 Гардероб', back: '← Назад', login: 'Увійти',
    register: 'Реєстрація', registerBtn: 'Зареєструватись',
    logout: 'Вийти з акаунту', logoutConfirm: 'Ви впевнені, що хочете вийти?',
    email: 'Email', password: 'Пароль (мін. 6 символів)', name: "Ваше імʼя",
    hint: 'Зареєструйтесь щоб зберігати дані між пристроями',
    celsius: 'Цельсій (°C)', fahrenheit: 'Фаренгейт (°F)',
    ukrainian: 'Українська 🇺🇦', english: 'English 🇬🇧',
    wardrobeLink: (n) => `Перейти до гардеробу (${n} речей) →`,
    fillFields: 'Заповніть усі поля', fillName: "Введіть імʼя",
    registerSuccess: 'Реєстрація успішна!', loginSuccess: 'Вхід успішний!',
  },
  en: {
    settings: '⚙️ Settings', profile: '👤 Profile',
    language: '🌐 Language', temperature: '🌡️ Temperature units',
    wardrobe: '👗 My wardrobe', back: '← Back', login: 'Login',
    register: 'Register', registerBtn: 'Create account',
    logout: 'Logout', logoutConfirm: 'Are you sure you want to logout?',
    email: 'Email', password: 'Password (min 6 chars)', name: 'Your name',
    hint: 'Register to sync data across devices',
    celsius: 'Celsius (°C)', fahrenheit: 'Fahrenheit (°F)',
    ukrainian: 'Українська 🇺🇦', english: 'English 🇬🇧',
    wardrobeLink: (n) => `Go to wardrobe (${n} items) →`,
    fillFields: 'Please fill all fields', fillName: 'Enter your name',
    registerSuccess: 'Registration successful!', loginSuccess: 'Welcome!',
  },
};

export default function SettingsScreen({ route, navigation }) {
  const deviceId = route.params?.deviceId;
  const { items } = useWardrobe(deviceId);

  const [user, setUser] = useState(null);
  const [unit, setUnit] = useState('Celsius');
  const [lang, setLang] = useState('uk');

  const t = TRANSLATIONS[lang] || TRANSLATIONS.uk;

  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [savedUnit, savedLang, savedUser, isLoggedOut] = await Promise.all([
          AsyncStorage.getItem(UNIT_KEY),
          AsyncStorage.getItem(LANG_KEY),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(LOGOUT_FLAG),
        ]);
        
        if (savedUnit) setUnit(savedUnit);
        if (savedLang) setLang(savedLang);
        
        if (isLoggedOut === 'true') {
          setUser(null);
          return;
        }

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else if (deviceId) {
          const u = await getOrCreateUser(deviceId).catch(() => null);
          setUser(u);
        }
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    })();
  }, [deviceId]);

  const handleUnit = async (value) => {
    setUnit(value);
    await AsyncStorage.setItem(UNIT_KEY, value);
    if (deviceId) updateUserSettings(deviceId, { tempUnit: value }).catch(() => {});
  };

  const handleLang = async (value) => {
    setLang(value);
    await AsyncStorage.setItem(LANG_KEY, value);
    if (deviceId) updateUserSettings(deviceId, { language: value }).catch(() => {});
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) return Alert.alert('Помилка', t.fillFields);
    if (authMode === 'register' && !username.trim()) return Alert.alert('Помилка', t.fillName);

    setAuthLoading(true);
    try {
      let updatedUser;
      if (authMode === 'register') {
        updatedUser = await registerUser(deviceId, {
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password,
        });
      } else {
        updatedUser = await loginUser(email.trim().toLowerCase(), password);
      }
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      await AsyncStorage.setItem(LOGOUT_FLAG, 'false');
      
      setUser(updatedUser);
      setEmail(''); setPassword(''); setUsername('');
      Alert.alert('✅', authMode === 'register' ? t.registerSuccess : t.loginSuccess);
    } catch (e) {
      Alert.alert('Помилка', e.response?.data?.error || e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t.logout, t.logoutConfirm, [
      { text: t.back, style: 'cancel' },
      { 
        text: t.logout, 
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(USER_KEY);
          await AsyncStorage.setItem(LOGOUT_FLAG, 'true');
          setUser(null);
          setEmail(''); setPassword(''); setUsername('');
        }
      }
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.skyDeep} />
      <LinearGradient colors={[COLORS.skyDeep, COLORS.skyMid]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.settings}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* PROFILE SECTION */}
        <Text style={styles.sectionLabel}>{t.profile}</Text>
        <View style={styles.card}>
          {user && user.email ? (
            <View>
              {/* ВИПРАВЛЕНО: Було <div style={styles.profileRow}> */}
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.profileName}>{user.username}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>{t.logout}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.hint}>{t.hint}</Text>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, authMode === 'login' && styles.tabActive]}
                  onPress={() => setAuthMode('login')}
                >
                  <Text style={[styles.tabText, authMode === 'login' && styles.tabTextActive]}>{t.login}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, authMode === 'register' && styles.tabActive]}
                  onPress={() => setAuthMode('register')}
                >
                  <Text style={[styles.tabText, authMode === 'register' && styles.tabTextActive]}>{t.register}</Text>
                </TouchableOpacity>
              </View>

              {authMode === 'register' && (
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t.name}
                  placeholderTextColor={COLORS.textMuted}
                />
              )}
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t.email}
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t.password}
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.authBtn, authLoading && { opacity: 0.7 }]}
                onPress={handleAuth}
                disabled={authLoading}
              >
                {authLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.authBtnText}>{authMode === 'login' ? t.login : t.registerBtn}</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* LANGUAGE SECTION */}
        <Text style={styles.sectionLabel}>{t.language}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.radioRow} onPress={() => handleLang('uk')}>
            <View style={[styles.radioOuter, lang === 'uk' && styles.radioOuterOn]}>
              {lang === 'uk' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>{t.ukrainian}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioRow} onPress={() => handleLang('en')}>
            <View style={[styles.radioOuter, lang === 'en' && styles.radioOuterOn]}>
              {lang === 'en' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>{t.english}</Text>
          </TouchableOpacity>
        </View>

        {/* TEMPERATURE SECTION */}
        <Text style={styles.sectionLabel}>{t.temperature}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.radioRow} onPress={() => handleUnit('Celsius')}>
            <View style={[styles.radioOuter, unit === 'Celsius' && styles.radioOuterOn]}>
              {unit === 'Celsius' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>{t.celsius}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.radioRow} onPress={() => handleUnit('Fahrenheit')}>
            <View style={[styles.radioOuter, unit === 'Fahrenheit' && styles.radioOuterOn]}>
              {unit === 'Fahrenheit' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioLabel}>{t.fahrenheit}</Text>
          </TouchableOpacity>
        </View>

        {/* WARDROBE SECTION */}
        <Text style={styles.sectionLabel}>{t.wardrobe}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Wardrobe', { deviceId })}>
            <Text style={styles.linkBtnText}>{t.wardrobeLink(items.length)}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cloud },
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  content: { padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, ...SHADOWS.soft },
  hint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  tabs: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f5f5f5' },
  tabActive: { backgroundColor: COLORS.skyMid },
  tabText: { fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#eee', marginBottom: 8 },
  authBtn: { backgroundColor: COLORS.skyMid, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  authBtnText: { color: '#fff', fontWeight: '700' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.skyMid, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  profileName: { fontSize: 16, fontWeight: 'bold' },
  profileEmail: { fontSize: 13, color: COLORS.textMuted },
  logoutBtn: { borderWidth: 1, borderColor: '#ff4444', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  logoutBtnText: { color: '#ff4444', fontWeight: '700' },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioOuterOn: { borderColor: COLORS.skyMid },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.skyMid },
  radioLabel: { fontSize: 15 },
  linkBtn: { backgroundColor: '#f9f9f9', borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  linkBtnText: { color: COLORS.skyMid, fontWeight: '700' },
});