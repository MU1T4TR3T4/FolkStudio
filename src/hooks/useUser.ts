import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    email: string;
}

interface UserState {
    user: User | null;
    setUser: (user: User | null) => void;
    clearUser: () => void;
    fetchUser: () => Promise<void>;
}

export const useUser = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            clearUser: () => set({ user: null }),
            fetchUser: async () => {
                try {
                    const res = await fetch('/api/auth/me');
                    const data = await res.json();
                    if (data.status === 'success') {
                        set({ user: data.data.user });
                    } else {
                        set({ user: null });
                    }
                } catch (error) {
                    set({ user: null });
                }
            },
        }),
        {
            name: 'user-storage',
        }
    )
);
