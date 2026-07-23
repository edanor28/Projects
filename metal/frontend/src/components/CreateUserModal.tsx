import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';

// 1. SEGURIDAD PERIMETRAL FRONTEND: Espejo estricto de CreateUserDto
const createUserSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de correo inválido'),
  // Política de contraseñas reflejada visualmente en el cliente
  password: z.string().min(8, 'La contraseña temporal debe tener mínimo 8 caracteres'),
  role: z.enum(['MANAGER', 'WORKER', 'CLIENT']),
});

type CreateUserInputs = z.infer<typeof createUserSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateUserInputs>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'WORKER' } // Default seguro para evitar escalada de privilegios accidental
  });

  if (!isOpen) return null;

  const onSubmit = async (data: CreateUserInputs) => {
    try {
      setServerError(null);
      // Petición a la API blindada (adjunta la cookie HttpOnly del Gerente automáticamente)
      await api.post('/users', data);
      
      reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setServerError('Este correo ya está registrado en el sistema.');
      } else if (error.response?.status === 403) {
        setServerError('Violación de seguridad: Privilegios insuficientes.');
      } else {
        setServerError('Error al aprovisionar la cuenta. Intente nuevamente.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Aprovisionar Nueva Cuenta</h3>
        
        {serverError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input {...register('firstName')} type="text" className="mt-1 w-full px-3 py-2 border rounded-md" disabled={isSubmitting} />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido</label>
              <input {...register('lastName')} type="text" className="mt-1 w-full px-3 py-2 border rounded-md" disabled={isSubmitting} />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico Corporativo</label>
            <input {...register('email')} type="email" className="mt-1 w-full px-3 py-2 border rounded-md" disabled={isSubmitting} placeholder="usuario@empresa.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña Temporal</label>
            <input {...register('password')} type="text" className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50" disabled={isSubmitting} placeholder="Min. 8 caracteres" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rol del Sistema (RBAC)</label>
            <select {...register('role')} className="mt-1 w-full px-3 py-2 border rounded-md bg-white" disabled={isSubmitting}>
              <option value="WORKER">Operario / Trabajador (WORKER)</option>
              <option value="CLIENT">Cliente (CLIENT)</option>
              <option value="MANAGER">Gerente (MANAGER)</option>
            </select>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400">
              {isSubmitting ? 'Creando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}