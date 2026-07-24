'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import AdjustStockModal from '@/components/AdjustStockModal';

// --- INTERFACES ---
interface Product {
  id: string;
  name: string;
  description: string | null;
  stockQuantity: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  product: { name: string };
}

interface Order {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  createdAt: string;
  user: { firstName: string; lastName: string };
  items: OrderItem[];
}

type TabView = 'ORDERS' | 'INVENTORY';

export default function WorkerDashboard() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);

  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState<TabView>('ORDERS');
  
  // Estados de Inventario
  const [inventory, setInventory] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Estados de Pedidos
  const [orders, setOrders] = useState<Order[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // --- CARGA DE DATOS (O(1) Network requests based on tab) ---
  const fetchData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'INVENTORY') {
        const response = await api.get('/inventory');
        setInventory(response.data);
      } else {
        const response = await api.get('/orders?status=APPROVED');
        setOrders(response.data);
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logoutStore();
    router.push('/login');
  };

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleFulfillOrder = async (orderId: string) => {
    try {
      setProcessingId(orderId);
      await api.patch(`/orders/${orderId}/status`, { status: 'FULFILLED' });
      await fetchData(); 
    } catch (error) {
      alert('Error al actualizar el despacho. Intente nuevamente.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR UNIFICADO */}
      <nav className="bg-slate-800 text-white shadow-md border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold tracking-wider">Metalurgia ERP</h1>
            
            {/* PESTAÑAS (TABS) DE NAVEGACIÓN LOCAL */}
            <div className="hidden md:flex space-x-2">
              <button 
                onClick={() => setActiveTab('ORDERS')}
                className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'ORDERS' ? 'bg-amber-600 text-white shadow-inner' : 'text-gray-300 hover:text-white hover:bg-slate-700'}`}
              >
                📦 Despachos (B2B)
              </button>
              <button 
                onClick={() => setActiveTab('INVENTORY')}
                className={`px-3 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'INVENTORY' ? 'bg-amber-600 text-white shadow-inner' : 'text-gray-300 hover:text-white hover:bg-slate-700'}`}
              >
                ⚙️ Control de Stock
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <p className="font-medium hidden sm:block">Operario: {authUser?.firstName}</p>
            <button
              onClick={handleLogout}
              className="bg-slate-900 hover:bg-slate-700 px-3 py-2 rounded-md font-bold transition-colors shadow-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VISTA 1: GESTIÓN DE PEDIDOS */}
        {activeTab === 'ORDERS' && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Órdenes Pendientes de Preparación</h2>
                <p className="text-gray-500 text-sm mt-1">Pedidos aprobados por gerencia listos para despacho físico.</p>
              </div>
              {!isLoading && (
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold shadow-inner border border-amber-200">
                  {orders.length} pedidos en cola
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                    <span className="text-4xl block mb-2">📦</span>
                    <p className="text-gray-500 font-medium">No hay órdenes pendientes de despacho.</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border-l-8 border-amber-500 overflow-hidden flex flex-col">
                      <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Cliente</p>
                          <h3 className="font-black text-gray-900 text-lg">{order.user.firstName} {order.user.lastName}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-mono">#{order.id.slice(0,8)}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">{new Date(order.createdAt).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                      <div className="p-5 flex-1">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Lista de Recolección</p>
                        <ul className="space-y-3">
                          {order.items.map(item => (
                            <li key={item.id} className="flex justify-start items-center text-sm p-2 bg-slate-50 rounded border border-slate-100">
                              <span className="bg-slate-800 text-white font-black px-3 py-1 rounded text-sm mr-4 shadow-inner">
                                {item.quantity} kg
                              </span>
                              <span className="font-bold text-gray-800 text-base">{item.product.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <button 
                          disabled={processingId === order.id}
                          onClick={() => handleFulfillOrder(order.id)}
                          className="w-full py-3 text-sm font-black text-white uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 rounded-lg transition-colors shadow-md"
                        >
                          {processingId === order.id ? 'Registrando...' : '✓ Marcar como Despachado'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* VISTA 2: CONTROL DE INVENTARIO FÍSICO */}
        {activeTab === 'INVENTORY' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Control Físico de Materiales</h2>
              <p className="text-gray-500 text-sm mt-1">Gestione las entradas de material y auditoría de planta.</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div></div>
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
                          <span className={`px-3 py-1 inline-flex text-sm font-bold rounded-full ${item.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.stockQuantity} Unidades
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => openAdjustModal(item)}
                            className="bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
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
          </>
        )}
      </main>

      {/* MODAL DE AJUSTE DE STOCK */}
      <AdjustStockModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={fetchData}
        product={selectedProduct}
      />
    </div>
  );
}