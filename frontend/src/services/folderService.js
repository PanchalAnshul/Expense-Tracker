const BASE_URL = 'http://localhost:8000/api';

export const folderService = {
    getAll: async () => {
        const res = await fetch(`${BASE_URL}/folders/`);
        if (!res.ok) throw new Error("Failed to fetch folders");
        return res.json();
    },

    create: async (name) => {
        const res = await fetch(`${BASE_URL}/folders/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error("Failed to create folder");
        return res.json();
    },

    update: async (id, name) => {
        const res = await fetch(`${BASE_URL}/folders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error("Failed to rename folder");
        return res.json();
    },

    delete: async (id) => {
        const res = await fetch(`${BASE_URL}/folders/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete folder");
        return true;
    }
};
