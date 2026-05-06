import { useState, useRef } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const latestValue = useRef(storedValue);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(latestValue.current) : value;
      latestValue.current = valueToStore;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn('localStorage error:', error);
    }
  };

  return [storedValue, setValue];
}
