import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Додай цей імпорт

export const BASE_URL = 'http://192.168.0.106:3000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Допоміжні функції для роботи з пам'яттю телефону
export const saveUserLocally = async (user) => {
  await AsyncStorage.setItem('user_data', JSON.stringify(user));
};

export const getLocalUser = async () => {
  const data = await AsyncStorage.getItem('user_data');
  return data ? JSON.parse(data) : null;
};

// --- ФУНКЦІЯ ВИХОДУ ---
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('user_data');
    return true;
  } catch (e) {
    console.error('Logout error:', e);
    return false;
  }
};

// Users / Auth (Оновлені функції, щоб вони зберігали дані при успіху)
export const getOrCreateUser = (deviceId) => 
  api.get(`/users/${deviceId}`).then(r => r.data.user);

export const registerUser = async (deviceId, data) => {
  const user = await api.post(`/users/${deviceId}/register`, data).then(r => r.data.user);
  await saveUserLocally(user); // Зберігаємо після реєстрації
  return user;
};

export const loginUser = async (email, password) => {
  const user = await api.post('/users/login', { email, password }).then(r => r.data.user);
  await saveUserLocally(user); // Зберігаємо після входу
  return user;
};

export const updateUserSettings = (deviceId, data) => 
  api.patch(`/users/${deviceId}`, data).then(r => r.data.user);

// Wardrobe
export const getWardrobeItems   = (deviceId) => api.get(`/users/${deviceId}/wardrobe`).then(r => r.data.items);
export const addWardrobeItem    = (deviceId, name, photoBase64 = null) => api.post(`/users/${deviceId}/wardrobe`, { name, photoBase64 }).then(r => r.data.item);
export const updateItemPhoto    = (deviceId, itemId, photoBase64) => api.patch(`/users/${deviceId}/wardrobe/${itemId}/photo`, { photoBase64 }).then(r => r.data.item);
export const deleteWardrobeItem = (deviceId, itemId) => api.delete(`/users/${deviceId}/wardrobe/${itemId}`).then(() => true);

// Weather
export const getRecommendations = (city, unit = 'Celsius', deviceId, lang = 'uk') =>
  api.get(`/recommendations/${encodeURIComponent(city)}`, { 
    params: { unit, deviceId, lang } // Додаємо lang у запит
  }).then(r => r.data);