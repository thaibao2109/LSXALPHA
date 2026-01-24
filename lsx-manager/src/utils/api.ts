import type { LSXData, ActivityLog } from '../types';

export const api = {
    // Orders
    getOrders: async (): Promise<LSXData[]> => {
        const res = await fetch('/api/orders');
        return res.json();
    },
    saveOrder: async (order: LSXData) => {
        await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
    },
    deleteOrder: async (id: string) => {
        await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    },

    // Logs
    getLogs: async (): Promise<ActivityLog[]> => {
        const res = await fetch('/api/logs');
        return res.json();
    },
    saveLog: async (log: ActivityLog) => {
        await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log)
        });
    },

    // Settings
    getSettings: async <T>(key: string): Promise<T | null> => {
        const res = await fetch(`/api/settings/${key}`);
        return res.json();
    },
    saveSettings: async <T>(key: string, value: T) => {
        await fetch(`/api/settings/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value)
        });
    }
};
