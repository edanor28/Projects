import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';

// 1. Zod Schema idéntico al de creación para garantizar consistencia perimetral
const editMetalSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es muy corto' }),
  description: z.string().optional(),
  priceUI: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Debe ser un precio válido y positivo',
  }),
  stockQuantity: z.number().min(0, 'No puede ser negativo'),
});

type EditMetalInputs = z.infer<typeof editMetalSchema>;

interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stockQuantity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null; // Recibimos el producto a editar
}

export default function EditMetalModal({ isOpen, onClose, onSuccess, product }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditMetalInputs>({
    resolver: zodResolver(editMetalSchema),
  });

  // 2. CICLO DE VIDA: Cuando el modal se abre y recibe un producto, inyectamos los datos en la memoria del formulario
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        priceUI: (product.priceCents / 100).toString(), // Transformamos de centavos a decimal para la UI
        stockQuantity: product.stockQuantity,
      });
    }
  }, [product, reset]);

  if (!isOpen || !product) return null;

  const onSubmit = async (data: EditMetalInputs) => {
    try {
      setServerError(null);
      const priceCents = Math.round(parseFloat(data.priceUI) * 100);

      // 3. CAPA DE RED: Usamos PATCH (Solo enviamos los datos modificados o la estructura completa segura)
      await api.patch(`/inventory/${product.id}`, {
        name: data.name,
        description: data.description,
        priceCents,
        stockQuantity: data.stockQuantity,
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      setServerError('Error al actualizar el registro. Verifica tus permisos.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">✕</button>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Editar Metal</h3>
        
        {serverError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input {...register('name')} type="text" className="mt-1 w-full px-3 py-2 border rounded-md" disabled={isSubmitting} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea {...register('description')} rows={2} className="mt-1 w-full px-3 py-2 border rounded-md" disabled={isSubmitting} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio (EUR)</label>
              <input {...register('priceUI')} type="number" step="0.01" className="mt-1 w-full px-3 py-2 border rounded-md" disabled={isSubmitting} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input {...register('stockQuantity', { valueAsNumber: true })} type="number" className="mt-1 w-full px-3 py-2 border rounded-md" disabled={isSubmitting} />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}