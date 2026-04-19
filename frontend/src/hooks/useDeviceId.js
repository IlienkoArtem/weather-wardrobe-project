import { useState, useEffect } from 'react';
import { Platform } from 'react-native'; // Додаємо Platform
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

const DEVICE_ID_KEY = '@weather_wardrobe_device_id';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let id = await AsyncStorage.getItem(DEVICE_ID_KEY);

        if (!id) {
          if (Platform.OS === 'android') {
            id = Application.androidId;
          } else if (Platform.OS === 'ios') {
            id = await Application.getIosIdForVendorAsync();
          }

          // Якщо ми у вебі або нативні методи повернули порожнечу
          if (!id) {
            id = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          }

          // Гарантуємо, що ID — це рядок
          id = String(id);
          
          await AsyncStorage.setItem(DEVICE_ID_KEY, id);
        }
        setDeviceId(id);
      } catch (error) {
        console.error("Error generating Device ID:", error);
        setDeviceId(`device_fallback_${Date.now()}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { deviceId, loading };
}