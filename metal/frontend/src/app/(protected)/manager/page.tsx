
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import CreateMetalModal from '@/components/CreateMetalModal';
import EditMetalModal from '@/components/EditMetalModal';

// 1. Tipado Estricto: Reflejamos la estructura de la base de datos (Backend)
interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number; // Recordamos: el dinero viaja en centavos por seguridad financiera
  stockQuantity: number;
  updatedAt: string;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 3. NUEVA FUNCIÓN: Lógica de Eliminación Segura
  const handleDelete = async (id: string, name: string) => {
    // UX: Confirmación nativa (Previene clicks accidentales)
    const isConfirmed = window.confirm(`¿Está seguro que desea eliminar el metal: ${name}? Esta acción es irreversible.`);
    if (!isConfirmed) return;

    // Backup del estado actual para rollback en caso de error
    const previousInventory = [...inventory];
    
    // OPTIMISTIC UPDATE: Filtramos de la RAM el producto (Complejidad O(N)). 
    // La UI responde instantáneamente.
    setInventory(inventory.filter((item) => item.id !== id));

    try {
      // Lanzamos la petición DELETE al backend protegido por el Guard
      await api.delete(`/inventory/${id}`);
    } catch (error: any) {
      // ROLLBACK: Si el backend falla (ej. permisos insuficientes), restauramos la tabla
      setInventory(previousInventory);
      if (error.response?.status === 403) {
        alert('Violación de seguridad: No tienes privilegios para borrar registros.');
      } else {
        alert('Error de red al intentar eliminar el registro.');
      }
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  // 2. Estado Atómico (Complejidad O(1) en lectura)
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);

  // 3. Estado local para la UI
  const [inventory, setInventory] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/inventory');
      setInventory(response.data);
    } catch (err: any) {
      setError('Error al cargar el inventario.');
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

  // 5. Destrucción segura de la sesión (Actualizado)
  const handleLogout = async () => {
    try {
      // 1. Llamada a la API para destruir la cookie HttpOnly en el navegador
      await api.post('/auth/logout');
    } catch (error) {
      // Aunque falle la red, priorizamos la seguridad expulsando al usuario de la UI
      console.warn('La red falló al invalidar la cookie, procediendo con borrado local.');
    } finally {
      // 2. Limpiamos la memoria RAM del navegador (Zustand)
      logoutStore();
      // 3. Redirigimos al área pública
      router.push('/login');
    }
  };

  // Función de utilidad para formatear moneda de forma segura
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  return (
    
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Superior */}
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold tracking-wider">Metalurgia ERP</h1>
              <div className="hidden md:flex space-x-4">
                <Link href="/manager" className="bg-slate-800 text-white px-3 py-2 rounded-md text-sm font-medium border border-slate-700">
                  Inventario
                </Link>
                <Link href="/manager/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Personal (RRHH)
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-slate-400 text-xs">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Control de Inventario General</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            + Añadir Metal
          </button>
        </div>

        {/* Manejo de Estados de UI */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código / Producto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Físico</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Actualización</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 text-sm">
                      El inventario está vacío. Comience añadiendo nuevos productos.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                          <span className="text-xs text-gray-500">{item.id.split('-')[0].toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.stockQuantity > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.stockQuantity} Unidades
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(item.priceCents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.updatedAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-blue-600 hover:text-blue-900 mx-2 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <CreateMetalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchInventory}
      />

      <EditMetalModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={fetchInventory}
        product={selectedProduct}
      />
    </div>
  );
}