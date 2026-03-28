import { API_BASE_URL } from '../config';

const BASE_URL = API_BASE_URL;

export const expenseService = {
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        const res = await fetch(`${BASE_URL}/expenses/?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch expenses");
        return res.json();
    },

    create: async (payload) => {
        const res = await fetch(`${BASE_URL}/expenses/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to create record");
        return res.json();
    },

    update: async (id, payload) => {
        const res = await fetch(`${BASE_URL}/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to update record");
        return res.json();
    },

    delete: async (id) => {
        const res = await fetch(`${BASE_URL}/expenses/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete record");
        return true;
    }
};
