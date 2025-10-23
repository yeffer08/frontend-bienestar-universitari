// src/types/auth.d.ts
export interface User {
  email: string;
  // Agrega más propiedades según tu modelo de usuario
}

export interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
  error: string | null;
}