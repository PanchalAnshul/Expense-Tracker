import { API_BASE_URL } from '../config';

const BASE_URL = API_BASE_URL;

export const settingsService = {
    get: async () => {
        const res = await fetch(`${BASE_URL}/settings/`);
        if (!res.ok) throw new Error('Failed to load settings');
        return res.json();
    },

    update: async (payload) => {
        const res = await fetch(`${BASE_URL}/settings/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save settings');
        return res.json();
    },
};
