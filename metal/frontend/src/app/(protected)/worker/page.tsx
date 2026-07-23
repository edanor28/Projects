'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import AdjustStockModal from '@/components/AdjustStockModal';

interface Product {
  id: string;
  name: string;
  description: string | null;
  stockQuantity: number;
}

export default function WorkerDashboard() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);

  const [inventory, setInventory] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/inventory');
      setInventory(response.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    logoutStore();
    router.push('/login');
  };

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-800 text-white shadow-md border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold tracking-wider">Metalurgia ERP</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-900 text-blue-200 text-xs font-semibold uppercase tracking-wide">
              Planta de Producción
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <p className="font-medium hidden sm:block">Operario: {authUser?.firstName}</p>
            <button
              onClick={handleLogout}
              className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md font-medium transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Control de Materiales</h2>
          <p className="text-gray-500 text-sm mt-1">
            Gestione las entradas y salidas físicas de material en planta.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Físico Actual</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción Operativa</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{item.description || 'Sin descripción'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-sm font-bold rounded-full ${item.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {item.stockQuantity} Unidades
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openAdjustModal(item)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Ajustar Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <AdjustStockModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={fetchInventory}
        product={selectedProduct}
      />
    </div>
  );
}
