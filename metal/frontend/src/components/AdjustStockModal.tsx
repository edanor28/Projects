import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';

const adjustSchema = z.object({
  operation: z.enum(['ADD', 'SUBTRACT']),
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
});

type AdjustInputs = z.infer<typeof adjustSchema>;

interface Product {
  id: string;
  name: string;
  stockQuantity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}

export default function AdjustStockModal({ isOpen, onClose, onSuccess, product }: Props) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdjustInputs>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      operation: 'SUBTRACT',
      quantity: 1,
    },
  });

  const operation = watch('operation');

  if (!isOpen || !product) return null;

  const onSubmit = async (data: AdjustInputs) => {
    try {
      setError(null);

      const newStock = data.operation === 'ADD'
        ? product.stockQuantity + data.quantity
        : product.stockQuantity - data.quantity;

      if (newStock < 0) {
        setError('Operación inválida: El stock no puede ser negativo.');
        return;
      }

      await api.patch(`/inventory/${product.id}`, { stockQuantity: newStock });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError('Error al actualizar el sistema. Verifica la red.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-gray-900 mb-1">Ajuste de Material</h3>
        <p className="text-sm text-gray-500 mb-4">
          {product.name} (Stock Actual: <span className="font-bold text-gray-800">{product.stockQuantity}</span>)
        </p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex space-x-4 mb-4">
            <label className={`flex-1 cursor-pointer border-2 p-3 rounded-lg text-center font-bold transition-all ${operation === 'ADD' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
              <input type="radio" value="ADD" {...register('operation')} className="hidden" />
              + Entrada
            </label>
            <label className={`flex-1 cursor-pointer border-2 p-3 rounded-lg text-center font-bold transition-all ${operation === 'SUBTRACT' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}>
              <input type="radio" value="SUBTRACT" {...register('operation')} className="hidden" />
              - Salida
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cantidad (Unidades)</label>
            <input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              className="mt-1 w-full px-3 py-3 border rounded-md font-bold text-lg text-center"
              disabled={isSubmitting}
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-bold shadow-md"
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar Ajuste'}
          </button>
        </form>
      </div>
    </div>
  );
}
