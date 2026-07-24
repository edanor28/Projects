
'use client'; // Directiva obligatoria en Next.js App Router para componentes con interactividad

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// 1. SEGURIDAD: Definición estricta del esquema de entrada (Defensa en Profundidad)
const loginSchema = z.object({
  email: z.string().email({ message: 'Formato de correo inválido' }),
  password: z.string().min(8, { message: 'Mínimo 8 caracteres requeridos' }),
});

// Inferimos el tipo TypeScript a partir del esquema Zod
type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [serverError, setServerError] = useState<string | null>(null);
  const loginStore = useAuthStore((state) => state.login);
  const logoutStore = useAuthStore((state) => state.logout);
  // 2. RENDIMIENTO: React Hook Form evita re-renders O(n) por cada tecla pulsada
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // 3. CAPA DE RED: Manejador del envío
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setServerError(null);
      
      // La cookie HttpOnly se inyectará automáticamente en el navegador gracias a nuestro config de Axios
      const response = await api.post('/auth/login', data);
      const userData = response.data.user;
      // Guardamos en Zustand solo los datos no sensibles (Nombre, Rol)
      setUser(response.data.user);
      
      loginStore(userData);
      setAuth(userData);

      // Redirigimos al usuario a su perímetro correspondiente para evitar rechazos del Middleware
      switch (userData.role) {
        case 'MANAGER':
          router.push('/manager');
          break;
        case 'WORKER':
          router.push('/worker');
          break;
        case 'CLIENT':
          router.push('/client');
          break;
        default:
          setServerError('Rol de usuario no reconocido. Contacte a soporte.');
          logoutStore(); // Destruimos la sesión por precaución
      }

    } catch (error: any) {
      if (error.response?.status === 401) {
        setServerError('Credenciales incorrectas. Verifique su correo y contraseña.');
      } else {
        setServerError('Error de conexión con el servidor. Intente más tarde.');
      }
    }
  
  }

  return (  
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Metalurgia ERP</h2>
          <p className="text-gray-500 mt-2">Acceso al portal corporativo</p>
        </div>

        {/* Alerta de Error del Servidor */}
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Campo Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="gerente@metalurgia-erp.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Botón de Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center disabled:bg-blue-400"
          >
            {isSubmitting ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

