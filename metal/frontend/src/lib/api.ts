import axios from 'axios';

// 1. SEGURIDAD: Nunca quemamos URLs en el código.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// 2. Instancia blindada de Axios
export const api = axios.create({
  baseURL: API_URL,
  // ESTO ES CRÍTICO: Le dice al navegador que envíe las cookies (nuestro JWT) 
  // en peticiones Cross-Origin (de localhost:3000 a localhost:4000)
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Interceptor de Respuestas (Manejo global de Sesión Expirada)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend responde con 401 (Token inválido o expirado)
    if (error.response?.status === 401) {
      // Aquí despacharemos una acción para limpiar la UI y redirigir al Login.
      // Lo conectaremos con Zustand en el siguiente paso.
      console.warn('🔒 Sesión expirada o inválida. Redirigiendo a Login...');
    }
    return Promise.reject(error);
  }
);