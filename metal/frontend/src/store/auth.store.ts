import { create } from 'zustand';

// Replicamos el Enum de roles del Backend para mantener tipado estricto
export type Role = 'MANAGER' | 'WORKER' | 'CLIENT';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Para manejar estados de carga en la UI (Spinners)
  
  // Acciones
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (status: boolean) => void;
}

// Implementación de Zustand (Ligero, rápido y sin Context API wrappers innecesarios)
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Asumimos carga inicial hasta verificar la sesión

  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  
  // Saneamiento de memoria en el cliente al cerrar sesión
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
  
  setLoading: (status) => set({ isLoading: status }),
}));