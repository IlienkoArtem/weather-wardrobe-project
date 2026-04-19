// frontend/src/screens/WardrobeScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWardrobe } from '../hooks/useWardrobe';
import { BASE_URL } from '../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const LANG_KEY = '@ww_lang';

const TRANSLATIONS = {
  uk: {
    back: '← Назад', title: '👗 Мій гардероб', itemsCount: (n) => `${n} предметів`,
    addPlaceholder: 'Додати одяг (наприклад: куртка)', emptyTitle: 'Гардероб порожній',
    emptySub: 'Додайте одяг для персональних рекомендацій', error: 'Помилка',
    delTitle: 'Видалити', delConfirm: (name) => `Видалити "${name}"?`,
    cancel: 'Скасувати', delete: 'Видалити', photoPerm: 'Потрібен дозвіл',
    photoPermSub: 'Дозвольте доступ до галереї в налаштуваннях',
    photoError: 'Не вдалося завантажити фото', addError: 'Не вдалося додати. Можливо, такий предмет вже існує.',
    changePhoto: '📷 Натисни щоб змінити фото', addPhoto: '📷 Натисни щоб додати фото',
    loading: 'Завантаження...',
    categories: { head: 'Голова', torso: 'Верх', legs: 'Низ', feet: 'Взуття', other: 'Інше' }
  },
  en: {
    back: '← Back', title: '👗 My Wardrobe', itemsCount: (n) => `${n} items`,
    addPlaceholder: 'Add clothing (e.g.: jacket)', emptyTitle: 'Wardrobe is empty',
    emptySub: 'Add items to get personalized recommendations', error: 'Error',
    delTitle: 'Delete', delConfirm: (name) => `Delete "${name}"?`,
    cancel: 'Cancel', delete: 'Delete', photoPerm: 'Permission required',
    photoPermSub: 'Please allow gallery access in settings',
    photoError: 'Failed to upload photo', addError: 'Failed to add. Item might already exist.',
    changePhoto: '📷 Tap to change photo', addPhoto: '📷 Tap to add photo',
    loading: 'Loading...',
    categories: { head: 'Head', torso: 'Top', legs: 'Bottom', feet: 'Shoes', other: 'Other' }
  }
};

const EMOJI_MAP = {
  шапка:'🧢', hat:'🧢', кепка:'🧢', cap:'🧢', шарф:'🧣', scarf:'🧣', 
  панама:'👒', футболка:'👕', tshirt:'👕', сорочка:'👔', shirt:'👔',
  майка:'🎽', светр:'🧶', sweater:'🧶', кофта:'🧥', jacket:'🧥', куртка:'🧥',
  пальто:'🧥', coat:'🧥', шорти:'🩳', shorts:'🩳', штани:'👖', pants:'👖',
  джинси:'👖', jeans:'👖', кросівки:'👟', sneakers:'👟', черевики:'👢', boots:'👢'
};

function getEmoji(name) {
  const l = name.toLowerCase();
  for (const [k, v] of Object.entries(EMOJI_MAP)) {
    if (l.includes(k)) return v;
  }
  return '👔';
}

function photoUri(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const serverRoot = BASE_URL.replace('/api', '');
  return `${serverRoot}${url}`;
}

async function pickImage(t) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(t.photoPerm, t.photoPermSub);
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  return 'data:image/jpeg;base64,' + res.assets[0].base64;
}

function ItemCard({ item, onDelete, onPhotoChange, t }) {
  const [uploading, setUploading] = useState(false);
  const uri = photoUri(item.photo_url);

  const handlePhoto = async () => {
    const b64 = await pickImage(t);
    if (!b64) return;
    setUploading(true);
    try {
      await onPhotoChange(item.id, b64);
    } catch (e) {
      Alert.alert(t.error, t.photoError);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.item}>
      <TouchableOpacity style={styles.photoWrap} onPress={handlePhoto} activeOpacity={0.8}>
        {uploading ? (
          <View style={styles.photoEmpty}><ActivityIndicator color={COLORS.skyMid} /></View>
        ) : uri ? (
          <Image source={{ uri }} style={styles.photo} />
        ) : (
          <View style={styles.photoEmpty}><Text style={styles.emoji}>{getEmoji(item.name)}</Text></View>
        )}
        <View style={styles.photoTag}><Text style={{ fontSize: 10 }}>📷</Text></View>
      </TouchableOpacity>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCat}>{t.categories[item.category] || item.category}</Text>
        <Text style={styles.photoHint}>{uri ? t.changePhoto : t.addPhoto}</Text>
      </View>

      <TouchableOpacity
        style={styles.delBtn}
        onPress={() =>
          Alert.alert(t.delTitle, t.delConfirm(item.name), [
            { text: t.cancel, style: 'cancel' },
            { text: t.delete, style: 'destructive', onPress: () => onDelete(item.id) },
          ])
        }
      >
        <Text style={styles.delBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function WardrobeScreen({ route, navigation }) {
  const deviceId = route.params?.deviceId;
  const { items, loading, addItem, removeItem, changeItemPhoto } = useWardrobe(deviceId);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [lang, setLang] = useState('uk');

  useEffect(() => {
    (async () => {
      const savedLang = await AsyncStorage.getItem(LANG_KEY);
      if (savedLang) setLang(savedLang);
    })();
  }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.uk;

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const ok = await addItem(name);
    if (ok) {
      setNewName('');
    } else {
      Alert.alert(t.error, t.addError);
    }
    setAdding(false);
  };

  const handlePhotoChange = async (itemId, b64) => {
    const ok = await changeItemPhoto(itemId, b64);
    if (!ok) Alert.alert(t.error, t.photoError);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.skyDeep} />
      <LinearGradient colors={[COLORS.skyDeep, COLORS.skyMid]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <Text style={styles.headerSub}>{t.itemsCount(items.length)}</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder={t.addPlaceholder}
            placeholderTextColor={COLORS.textMuted}
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={[styles.addBtn, adding && styles.addBtnOff]} onPress={handleAdd} disabled={adding}>
            {adding ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.addBtnText}>+</Text>}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.skyMid} /></View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 64 }}>🧺</Text>
            <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
            <Text style={styles.emptySub}>{t.emptySub}</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: 80 }}
            renderItem={({ item }) => (
              <ItemCard item={item} onDelete={removeItem} onPhotoChange={handlePhotoChange} t={t} />
            )}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.cloud },
  header: { paddingTop: 52, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.md },
  backBtn: { marginBottom: SPACING.sm },
  backText: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addRow: { flexDirection: 'row', margin: SPACING.md, backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.full, ...SHADOWS.card, overflow: 'hidden' },
  input: { flex: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, fontSize: 15, color: COLORS.textPrimary },
  addBtn: { backgroundColor: COLORS.skyMid, paddingHorizontal: SPACING.md, justifyContent: 'center', alignItems: 'center', minWidth: 52 },
  addBtnOff: { backgroundColor: COLORS.skyFog },
  addBtnText: { color: COLORS.white, fontSize: 24, fontWeight: '300' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceCard, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm, ...SHADOWS.soft },
  photoWrap: { position: 'relative', marginRight: SPACING.sm },
  photo: { width: 60, height: 60, borderRadius: RADIUS.sm },
  photoEmpty: { width: 60, height: 60, borderRadius: RADIUS.sm, backgroundColor: COLORS.cloud, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 30 },
  photoTag: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10, padding: 2 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  itemCat: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  photoHint: { fontSize: 11, color: COLORS.skyMid, marginTop: 2 },
  delBtn: { backgroundColor: '#FFEBEE', borderRadius: RADIUS.full, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  delBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.skyDeep, marginBottom: SPACING.sm, marginTop: SPACING.md },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});