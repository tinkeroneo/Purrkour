export function createSafeStorage(storage) {
  return {
    getItem(key) {
      try {
        return storage?.getItem?.(key) ?? null;
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        storage?.setItem?.(key, String(value));
        return Boolean(storage);
      } catch {
        return false;
      }
    },
    removeItem(key) {
      try {
        storage?.removeItem?.(key);
        return Boolean(storage);
      } catch {
        return false;
      }
    },
  };
}
