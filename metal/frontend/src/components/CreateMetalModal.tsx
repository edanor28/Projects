import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';

// 1. SEGURIDAD FINANCIERA Y VALIDACIÓN EN CLIENTE (Defensa en Profundidad)
// Espejo estricto de nuestro CreateInventoryDto del backend.
const createMetalSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es muy corto' }),
  description: z.string().optional(),
  // Pedimos un string en el input para permitir decimales (ej. "15.50"),
  // pero lo transformaremos a enteros (centavos) antes de enviarlo.
  priceUI: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Debe ser un precio válido y positivo',
  }),
  stockQuantity: z.number().min(0, 'No puede ser negativo'),
});

type CreateMetalInputs = z.infer<typeof createMetalSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback para recargar la tabla principal
}

export default function CreateMetalModal({ isOpen, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMetalInputs>({
    resolver: zodResolver(createMetalSchema),
    defaultValues: {
      stockQuantity: 0,
    }
  });

  // Si el modal está cerrado, no renderizamos nada en el DOM (Ahorro de memoria)
  if (!isOpen) return null;

  const onSubmit = async (data: CreateMetalInputs) => {
    try {
      setServerError(null);
      
      // 2. SANEAMIENTO DE DATOS FINANCIEROS (Float a Integer)
      // Multiplicamos por 100 y redondeamos para evitar basuras de coma flotante (ej. 15.50 * 100 = 1550)
      const priceCents = Math.round(parseFloat(data.priceUI) * 100);

      const payload = {
        name: data.name,
        description: data.description,
        priceCents,
        stockQuantity: data.stockQuantity,
      };

      // 3. Petición a la API blindada (adjunta la cookie automáticamente)
      await api.post('/inventory', payload);
      
      reset(); // Limpiamos el formulario en memoria
      onSuccess(); // Avisamos al componente padre para que actualice la tabla
      onClose(); // Cerramos el modal
      
    } catch (error: any) {
      if (error.response?.status === 403) {
        setServerError('No tienes permisos de Gerente para realizar esta acción.');
      } else {
        setServerError('Error al crear el registro. Verifica los datos.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>
        
        <h3 className="text-xl font-bold text-gray-900 mb-4">Añadir Nuevo Metal</h3>
        
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Metal / Aleación</label>
            <input
              {...register('name')}
              type="text"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ej: Acero Inoxidable 304"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
            <textarea
              {...register('description')}
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Detalles técnicos..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio (EUR)</label>
              <input
                {...register('priceUI')}
                type="number"
                step="0.01"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="0.00"
                disabled={isSubmitting}
              />
              {errors.priceUI && <p className="text-red-500 text-xs mt-1">{errors.priceUI.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stock Inicial</label>
              <input
                {...register('stockQuantity', { valueAsNumber: true })}
                type="number"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="0"
                disabled={isSubmitting}
              />
              {errors.stockQuantity && <p className="text-red-500 text-xs mt-1">{errors.stockQuantity.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-blue-400"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Metal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}