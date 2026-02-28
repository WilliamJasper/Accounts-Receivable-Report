import { useState, useEffect } from 'react';

/**
 * useState synced with localStorage.
 * @param {string} key - localStorage key
 * @param {*} defaultValue - initial value if nothing saved
 */
export function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}

/**
 * useState with migration from old key to new key, synced with localStorage.
 * Used for period-based maps (officerEditsMap, manualSummaryMap, etc.)
 */
export function useLocalStorageWithMigration(newKey, oldKey, defaultValue) {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(newKey);
            if (saved) return JSON.parse(saved);
            // Migration from old key
            const old = localStorage.getItem(oldKey);
            if (old) return { 'all_all': JSON.parse(old) };
            return defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        localStorage.setItem(newKey, JSON.stringify(value));
    }, [newKey, value]);

    return [value, setValue];
}
