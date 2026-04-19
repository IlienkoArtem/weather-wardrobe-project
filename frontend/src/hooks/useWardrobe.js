// frontend/src/hooks/useWardrobe.js
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWardrobeItems, addWardrobeItem, deleteWardrobeItem, updateItemPhoto } from '../services/api';

const USER_KEY = '@ww_user';

export function useWardrobe(deviceId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!deviceId) return;

    setLoading(true);
    try {
      // 1. Перевіряємо, чи залогінений користувач
      const savedUser = await AsyncStorage.getItem(USER_KEY);
      
      // 2. Якщо користувача немає — очищаємо список і виходимо
      if (!savedUser) {
        setItems([]);
        setLoading(false);
        return;
      }

      // 3. Якщо користувач є — робимо запит
      const data = await getWardrobeItems(deviceId);
      setItems(data);
    } catch (e) {
      console.warn('fetchItems error:', e.message);
      // Якщо бекенд повернув 403 (доступ заборонено), теж очищаємо список
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(async (name, photoBase64 = null) => {
    try {
      // Додаткова перевірка перед додаванням
      const savedUser = await AsyncStorage.getItem(USER_KEY);
      if (!savedUser) throw new Error('Auth required');

      const item = await addWardrobeItem(deviceId, name, photoBase64);
      setItems(prev => [...prev, item]);
      return true;
    } catch (e) {
      console.warn('addItem error:', e.message);
      return false;
    }
  }, [deviceId]);

  const removeItem = useCallback(async (itemId) => {
    try {
      await deleteWardrobeItem(deviceId, itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      return true;
    } catch (e) {
      console.warn('removeItem error:', e.message);
      return false;
    }
  }, [deviceId]);

  const changeItemPhoto = useCallback(async (itemId, photoBase64) => {
    try {
      const updatedItem = await updateItemPhoto(deviceId, itemId, photoBase64);
      setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      return true;
    } catch (e) {
      console.warn('changeItemPhoto error:', e.message);
      return false;
    }
  }, [deviceId]);

  return { items, loading, addItem, removeItem, changeItemPhoto, refetch: fetchItems };
}