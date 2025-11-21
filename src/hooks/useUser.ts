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

// Usuário demo fixo para apresentação
const DEMO_USER: User = {
    id: "demo-user",
    name: "Demonstração",
    email: "demo@demo.com"
};

export const useUser = create<UserState>()(
    persist(
        (set) => ({
            user: DEMO_USER, // Sempre retorna o usuário demo
            setUser: (user) => set({ user }),
            clearUser: () => set({ user: DEMO_USER }), // Mesmo ao limpar, retorna demo
            fetchUser: async () => {
                // Não faz fetch, apenas define o usuário demo
                set({ user: DEMO_USER });
            },
        }),
        {
            name: 'user-storage',
        }
    )
);
