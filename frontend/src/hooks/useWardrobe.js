import { useState, useCallback, useEffect } from 'react';
import { getWardrobeItems, addWardrobeItem, deleteWardrobeItem } from '../services/api';

export function useWardrobe(deviceId) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const data = await getWardrobeItems(deviceId);
      setItems(data);
    } catch (e) { console.warn(e.message); }
    finally { setLoading(false); }
  }, [deviceId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = useCallback(async (name, photoBase64 = null) => {
    try {
      const item = await addWardrobeItem(deviceId, name, photoBase64);
      setItems(prev => [...prev, item]);
      return true;
    } catch (e) { return false; }
  }, [deviceId]);

  const removeItem = useCallback(async (itemId) => {
    try {
      await deleteWardrobeItem(deviceId, itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      return true;
    } catch (e) { return false; }
  }, [deviceId]);

  return { items, loading, addItem, removeItem, refetch: fetchItems };
}