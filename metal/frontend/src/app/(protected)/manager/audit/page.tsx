'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// 1. Tipado Estricto de la Caja Negra
interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  details: any;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

export default function AuditPage() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        // Consumimos el endpoint protegido. El backend limitará a 100 registros por seguridad.
        const response = await api.get('/audit');
        setLogs(response.data);
      } catch (err: any) {
        setError('Error al cargar la bitácora forense.');
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logoutStore();
    router.push('/login');
  };

  // 2. Utilidad visual para identificar rápidamente el tipo de mutación
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-md">CREACIÓN</span>;
      case 'UPDATE': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">MODIFICACIÓN</span>;
      case 'DELETE': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-md">ELIMINACIÓN</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-md">{action}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Modular */}
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold tracking-wider">Metalurgia ERP</h1>
              <div className="hidden md:flex space-x-4">
                <Link href="/manager" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Inventario
                </Link>
                <Link href="/manager/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Personal (RRHH)
                </Link>
                <Link href="/manager/audit" className="bg-slate-800 text-white px-3 py-2 rounded-md text-sm font-medium border border-slate-700">
                  Auditoría Forense
                </Link>
                <Link href="/manager/orders" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                 Pedidos (B2B)
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm hidden sm:block">
                <p className="font-medium">{authUser?.firstName} {authUser?.lastName}</p>
              </div>
              <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700">
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Bitácora de Auditoría del Sistema</h2>
          <p className="text-gray-500 text-sm mt-1">Registro inmutable de transacciones operativas. Acceso nivel Gerencia.</p>
        </div>

        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-sm">{error}</div>}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Fecha / Hora</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Identidad (Actor)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción / Entidad</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carga Útil (Payload)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-sm">
                      No hay registros de auditoría en el sistema.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {new Date(log.createdAt).toLocaleString('es-ES', { 
                          day: '2-digit', month: '2-digit', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit', second: '2-digit' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{log.user.firstName} {log.user.lastName}</div>
                        <div className="text-xs text-gray-500">{log.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getActionBadge(log.action)}
                          <span className="text-xs font-medium text-gray-600 border border-gray-200 px-2 py-1 rounded bg-white">
                            {log.entity} : {log.entityId.split('-')[0]}...
                          </span>
                        </div>
                      </td>
                      {/* 3. SEGURIDAD FRONTEND: React escapa automáticamente cualquier script dentro del JSON */}
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono max-w-lg shadow-inner">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}