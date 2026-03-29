import { API_BASE_URL } from '../config';

const BASE_URL = API_BASE_URL;

export const folderService = {
    getAll: async () => {
        const res = await fetch(`${BASE_URL}/folders/`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Failed to fetch folders");
        return data;
    },

    create: async (name) => {
        const res = await fetch(`${BASE_URL}/folders/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Failed to create folder");
        return data;
    },

    update: async (id, name) => {
        const res = await fetch(`${BASE_URL}/folders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Failed to rename folder");
        return data;
    },

    delete: async (id) => {
        const res = await fetch(`${BASE_URL}/folders/${id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Failed to delete folder");
        return true;
    }
};
