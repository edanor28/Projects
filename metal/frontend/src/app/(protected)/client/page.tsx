
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';

// Interfaz adaptada al cliente (Data Minimization visual)
interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stockQuantity: number;
}

export default function ClientDashboard() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);

  // Selectores optimizados de Zustand
  const { items: cartItems, addItem, clearCart, getTotalCents } = useCartStore();

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Estados locales para los inputs de cantidad de cada producto
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        // El cliente solo tiene permisos GET /inventory en el backend
        const response = await api.get('/inventory');
        setCatalog(response.data);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logoutStore();
    clearCart();
    router.push('/login');
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  };

  const handleQuantityChange = (id: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddToCart = (product: CatalogItem) => {
    const qty = quantities[product.id] || 1;
    addItem(product, qty);
    setQuantities((prev) => ({ ...prev, [product.id]: 1 })); // Reset local input
    setCheckoutMessage(null); // Limpiar errores anteriores
  };

  //  Ejecución transaccional (Zero Trust Payload)
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    try {
      setIsCheckingOut(true);
      setCheckoutMessage(null);

      // Formateamos el payload estrictamente a lo que exige CreateOrderDto.
      // NUNCA enviamos el precio al backend.
      const payload = {
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };
      
      await api.post('/orders', payload);
      
      // Éxito: Limpiamos carrito y recargamos catálogo para ver los nuevos stocks
      clearCart();
      setCheckoutMessage({ type: 'success', text: '¡Pedido procesado con éxito!' });
      
      const response = await api.get('/inventory');
      setCatalog(response.data);
    } catch (error: any) {
      // Manejo de Race Conditions: Alguien compró el último material antes que tú
      if (error.response?.status === 409) {
        setCheckoutMessage({ type: 'error', text: error.response.data.message || 'Error de stock insuficiente.' });
      } else {
        setCheckoutMessage({ type: 'error', text: 'Error procesando el pedido. Verifique su conexión.' });
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar Minimalista para Clientes */}
      <nav className="bg-slate-900 text-white shadow-md border-b-4 border-emerald-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold tracking-wider">Metalurgia ERP</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-900 text-emerald-200 text-xs font-semibold uppercase tracking-wide">
              Portal B2B
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <p className="font-medium hidden sm:block">Bienvenido, {authUser?.firstName}</p>
            <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md font-medium transition-colors border border-slate-700">
              Salir
            </button>
          </div>
        </div>
      </nav>
    
      {/* PANEL DE CHECKOUT FLOTANTE */}
      {cartItems.length > 0 && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm p-4 animate-fade-in-down">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Resumen de Orden</h3>
              <p className="text-sm text-gray-500">{cartItems.length} materiales seleccionados</p>
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Estimado</p>
                <p className="text-2xl font-black text-emerald-600">{formatCurrency(getTotalCents())}</p>
              </div>
              <button 
                onClick={handleCheckout} 
                disabled={isCheckingOut}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all"
              >
                {isCheckingOut ? 'Procesando...' : 'Confirmar Orden'}
              </button>
              <button onClick={clearCart} className="text-gray-400 hover:text-red-500 text-sm font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* MENSAJES DE ALERTA (Éxito / Error de stock) */}
        {checkoutMessage && (
          <div className={`mb-6 p-4 rounded-lg font-medium text-sm ${checkoutMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {checkoutMessage.text}
          </div>
        )}

        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900">Catálogo de Materiales</h2>
          <p className="text-gray-500 mt-2 text-lg">Consulte nuestra disponibilidad y precios en tiempo real.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalog.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
                Actualmente no hay materiales disponibles en el catálogo.
              </div>
            ) : (
              catalog.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                      {item.stockQuantity > 0 ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-semibold">En Stock</span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-semibold">Agotado</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-6 h-10 line-clamp-2">
                      {item.description || 'Sin descripción técnica disponible.'}
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4 flex flex-col space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Precio / kg</p>
                        <p className="text-xl font-black text-gray-900">{formatCurrency(item.priceCents)}</p>
                      </div>
                      
                      {/* INPUT DE CANTIDAD: Solo se muestra si hay stock */}
                      {item.stockQuantity > 0 && (
                        <div className="w-24">
                          <label className="text-xs text-gray-500 block mb-1">Cantidad</label>
                          <input 
                            type="number" 
                            min="1" 
                            max={item.stockQuantity}
                            value={quantities[item.id] || 1}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                            className="w-full border border-gray-300 rounded-md shadow-sm px-2 py-1 text-center font-semibold"
                          />
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stockQuantity === 0}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-bold transition-colors"
                    >
                      Añadir al Pedido
                    </button>
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