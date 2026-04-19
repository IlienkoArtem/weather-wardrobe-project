import axios from 'axios';

export const BASE_URL = 'http://192.168.0.106:3000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Users / Auth
export const getOrCreateUser    = (deviceId) => api.get(`/users/${deviceId}`).then(r => r.data.user);
export const registerUser       = (deviceId, data) => api.post(`/users/${deviceId}/register`, data).then(r => r.data.user);
export const loginUser          = (email, password) => api.post('/users/login', { email, password }).then(r => r.data.user);
export const updateUserSettings = (deviceId, data) => api.patch(`/users/${deviceId}`, data).then(r => r.data.user);

// Wardrobe
export const getWardrobeItems   = (deviceId) => api.get(`/users/${deviceId}/wardrobe`).then(r => r.data.items);
export const addWardrobeItem    = (deviceId, name, photoBase64 = null) => api.post(`/users/${deviceId}/wardrobe`, { name, photoBase64 }).then(r => r.data.item);
export const updateItemPhoto    = (deviceId, itemId, photoBase64) => api.patch(`/users/${deviceId}/wardrobe/${itemId}/photo`, { photoBase64 }).then(r => r.data.item);
export const deleteWardrobeItem = (deviceId, itemId) => api.delete(`/users/${deviceId}/wardrobe/${itemId}`).then(() => true);

// Weather
export const getRecommendations = (city, unit = 'Celsius', deviceId) =>
  api.get(`/recommendations/${encodeURIComponent(city)}`, { params: { unit, deviceId } }).then(r => r.data);