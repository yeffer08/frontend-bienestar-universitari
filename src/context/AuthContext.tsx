// src/context/AuthContext.tsx

import { createContext, useContext, useState, useEffect } from 'react'; // Importa useEffect
import type { ReactNode } from 'react';
import type { User as GlobalUserType } from '../types'; // Importa el tipo User globalmente definido
 // Importa el tipo User globalmente definido

// Usa el tipo User globalmente definido, o define uno más completo aquí
// Si el tipo GlobalUserType incluye todo lo que necesitas, puedes usarlo directamente
// y quitar la interfaz User de este archivo.
interface User extends GlobalUserType {
  // Aquí podrías añadir propiedades específicas del contexto si las hubiera,
  // pero por ahora, solo necesitamos las que ya están en GlobalUserType.
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isLoadingAuth: boolean; // Nuevo estado para indicar si el usuario está cargando
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true); // Inicialmente cargando

  // Función para decodificar y establecer el usuario desde un token
  const decodeAndSetUser = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Asegúrate de que tu JWT payload incluya id y nombre_completo
      setUser({
        id: payload.id, // Asegúrate de que el backend envíe 'id'
        email: payload.email,
        nombre_completo: payload.nombre, // Asegúrate de que el backend envíe 'nombre_completo'
        rol_id: payload.rol_id, // Si también lo necesitas
        // ... otras propiedades que vengan en el payload y sean parte de GlobalUserType
      } as unknown as User); // Castea a User para que TypeScript sepa que es el tipo correcto
    } catch (error) {
      console.error("Error decoding token or setting user:", error);
      setUser(null); // Asegúrate de que el usuario sea null si hay un error
    }
  };

  // Efecto para cargar el token y el usuario al inicio
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      decodeAndSetUser(token);
    }
    setIsLoadingAuth(false); // La carga inicial ha terminado
  }, []);

  const login = (token: string) => {
    localStorage.setItem('accessToken', token);
    decodeAndSetUser(token);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};