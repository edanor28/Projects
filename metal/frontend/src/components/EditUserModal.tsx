import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';

const editUserSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Formato de correo inválido'),
  password: z.string().optional(),
  role: z.enum(['MANAGER', 'WORKER', 'CLIENT']),
});

type EditUserInputs = z.infer<typeof editUserSchema>;

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'MANAGER' | 'WORKER' | 'CLIENT';
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, user }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserInputs>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        role: user.role,
      });
    }
  }, [user, reset]);

  if (!isOpen || !user) return null;

  const onSubmit = async (data: EditUserInputs) => {
    try {
      setServerError(null);

      const payload: Partial<EditUserInputs> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
      };

      if (data.password && data.password.trim().length >= 8) {
        payload.password = data.password;
      }

      await api.patch(`/users/${user.id}`, payload);
      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setServerError('Este correo ya está registrado en el sistema.');
      } else if (error.response?.status === 403) {
        setServerError('Violación de seguridad: Privilegios insuficientes.');
      } else {
        setServerError('Error al actualizar la cuenta. Intente nuevamente.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Cuenta</h3>

        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {serverError}
          </div>
        )}

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
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input {...register('email')} type="email" className="mt-1 w-full px-3 py-2 border rounded-md" disabled={isSubmitting} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nueva Contraseña (Opcional)</label>
            <input {...register('password')} type="text" className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-50" disabled={isSubmitting} placeholder="Dejar vacío para conservar la actual" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rol del Sistema</label>
            <select {...register('role')} className="mt-1 w-full px-3 py-2 border rounded-md bg-white" disabled={isSubmitting}>
              <option value="WORKER">Operario / Trabajador (WORKER)</option>
              <option value="CLIENT">Cliente (CLIENT)</option>
              <option value="MANAGER">Gerente (MANAGER)</option>
            </select>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-400">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
