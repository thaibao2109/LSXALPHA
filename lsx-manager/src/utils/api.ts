import type { LSXData, ActivityLog } from '../types';

import { db, storage } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const api = {
    // Orders
    getOrders: async (): Promise<LSXData[]> => {
        const querySnapshot = await getDocs(collection(db, "orders"));
        return querySnapshot.docs.map(doc => doc.data() as LSXData);
    },
    saveOrder: async (order: LSXData) => {
        if (!order.id) throw new Error("Order ID is required");
        await setDoc(doc(db, "orders", order.id), order);
    },
    deleteOrder: async (id: string) => {
        await deleteDoc(doc(db, "orders", id));
    },

    // Logs
    getLogs: async (): Promise<ActivityLog[]> => {
        const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as ActivityLog);
    },
    saveLog: async (log: ActivityLog) => {
        if (!log.id) console.error("Log ID is required");
        else await setDoc(doc(db, "activity_logs", log.id), log);
    },

    // Settings
    getSettings: async <T>(key: string): Promise<T | null> => {
        const docRef = doc(db, "settings", key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return (docSnap.data() as { value: T }).value;
        } else {
            return null;
        }
    },
    saveSettings: async <T extends object>(key: string, value: T) => {
        // Firestore requires usage of objects, so value must be an object.
        // If T is primitive, we might need a wrapper, but looking at usage (arrays, objects), it should be fine mostly.
        // However, looking at the code, we are casting doc.data() as T.
        // If we save an array as the root document data, Firestore might complain or wrap it?
        // Firestore documents are objects. If 'value' is an array, we should probably wrap it in { value: ... }
        // BUT to keep it simple and consistent with previous implementation: 
        // The previous implementation stored valid JSON.
        // Let's store it as { data: value } to always have an object root, and unwrap it.
        // Wait, if I change the storage format, I need to be careful.
        // Let's stick to storing the object directly if T is an object.
        // If T is an array, Firestore does not support array as root.
        // USAGE CHECK: 'product_types' is ProductType[] (Array). 'task_templates' is string[] (Array).
        // So we MUST wrap arrays.
        // Let's wrap EVERYTHING in a 'value' field for settings to be safe and consistent.

        await setDoc(doc(db, "settings", key), { value });
    },
    // We need to fix getSettings to unwrap the 'value'

    uploadFile: async (file: File): Promise<string> => {
        const storageRef = ref(storage, 'uploads/' + Date.now() + '-' + file.name);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    },

    // User Management
    login: async (username: string, password: string): Promise<import('../types').User | null> => {
        const q = query(collection(db, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Simple password check (in a real app, use hashing or Firebase Auth)
        if (userData.password === password) {
            // Return user without password
            const { password, ...user } = userData;
            return user as import('../types').User;
        }
        return null;
    },
    getUsers: async (): Promise<import('../types').User[]> => {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            // detailed user info but maybe exclude password or keep it if needed for edit (though usually we don't send it back)
            // For this simple management app, we might check password matching on client or keep it simple.
            // Let's return everything for now so admin can see/manage.
            return data as import('../types').User & { password?: string };
        });
    },
    saveUser: async (user: import('../types').User & { password?: string }) => {
        // Use username as doc ID for uniqueness assurance by Firestore if we wanted, 
        // but let's strictly use the 'id' field if we want or just generate one?
        // Plan said "Document ID: username".
        // Let's enforce Document ID = username.
        if (!user.username) throw new Error("Username is required");
        await setDoc(doc(db, "users", user.username), user);
    },
    deleteUser: async (username: string) => {
        await deleteDoc(doc(db, "users", username));
    }
};
