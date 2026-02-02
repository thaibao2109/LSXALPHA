import type { LSXData, ActivityLog } from '../types';

export const api = {
    // Orders
    getOrders: async (): Promise<LSXData[]> => {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
        return res.json();
    },
    saveOrder: async (order: LSXData) => {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to save order: ${err || res.statusText}`);
        }
    },
    deleteOrder: async (id: string) => {
        const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to delete order: ${err || res.statusText}`);
        }
    },

    // Logs
    getLogs: async (): Promise<ActivityLog[]> => {
        const res = await fetch('/api/logs');
        if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`);
        return res.json();
    },
    saveLog: async (log: ActivityLog) => {
        const res = await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log)
        });
        if (!res.ok) {
            console.error("Failed to save log", await res.text());
        }
    },

    // Settings
    getSettings: async <T>(key: string): Promise<T | null> => {
        const res = await fetch(`/api/settings/${key}`);
        if (!res.ok) return null; // Settings might not exist
        return res.json();
    },
    saveSettings: async <T>(key: string, value: T) => {
        const res = await fetch(`/api/settings/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to save settings: ${err || res.statusText}`);
        }
    },

    uploadFile: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Upload failed: ${err || res.statusText}`);
        }

        const data = await res.json();
        return data.url;
    }
};
