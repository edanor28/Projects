'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface OrderItem {
  id: string;
  quantity: number;
  priceCents: number;
  product: { name: string };
}

interface Order {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  totalCents: number;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  items: OrderItem[];
}

export default function ManagerOrdersPage() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logoutStore();
    router.push('/login');
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setProcessingId(orderId);
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders(); // Refrescamos para obtener la fuente de verdad (Truth Source)
    } catch (error) {
      alert('Error de red al actualizar el estado del pedido.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      FULFILLED: 'bg-green-100 text-green-800 border-green-200',
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold tracking-wider">Metalurgia ERP</h1>
            <div className="hidden md:flex space-x-4">
              <Link href="/manager" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Inventario</Link>
              <Link href="/manager/orders" className="bg-slate-800 text-white px-3 py-2 rounded-md text-sm font-medium border border-slate-700">Pedidos (B2B)</Link>
              <Link href="/manager/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Personal</Link>
              <Link href="/manager/audit" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Auditoría</Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <p className="text-sm font-medium hidden sm:block">{authUser?.firstName} {authUser?.lastName}</p>
            <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium border border-slate-700">Salir</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Centro de Operaciones: Pedidos</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de facturación y autorización logística.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div></div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500">
                No hay pedidos registrados en el sistema.
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                  {/* Detalles del Cliente y Estado */}
                  <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200 md:w-1/3 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-gray-400 font-mono" title={order.id}>#{order.id.slice(0,8)}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">{order.user.firstName} {order.user.lastName}</h3>
                    <p className="text-sm text-gray-500 mb-4">{order.user.email}</p>
                    <div className="mt-auto">
                      <p className="text-xs text-gray-500 uppercase font-bold">Total Facturado</p>
                      <p className="text-2xl font-black text-gray-900">{formatCurrency(order.totalCents)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Materiales */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b pb-2">Materiales Solicitados</h4>
                      <ul className="space-y-3 mb-6">
                        {order.items.map(item => (
                          <li key={item.id} className="flex justify-between items-center text-sm">
                            <div className="flex items-center space-x-3">
                              <span className="bg-gray-800 text-white font-bold px-2 py-0.5 rounded text-xs">{item.quantity}x</span>
                              <span className="font-medium text-gray-800">{item.product.name}</span>
                            </div>
                            <span className="text-gray-600">{formatCurrency(item.priceCents * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Acciones de Negocio (RBAC) */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                      {order.status === 'PENDING' && (
                        <>
                          <button 
                            disabled={processingId === order.id}
                            onClick={() => handleStatusChange(order.id, 'REJECTED')}
                            className="px-4 py-2 text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                          >
                            Rechazar
                          </button>
                          <button 
                            disabled={processingId === order.id}
                            onClick={() => handleStatusChange(order.id, 'APPROVED')}
                            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                          >
                            Aprobar Despacho
                          </button>
                        </>
                      )}
                      {order.status === 'APPROVED' && (
                        <p className="text-sm font-semibold text-blue-600">Pendiente de acción en almacén (Trabajadores)</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}