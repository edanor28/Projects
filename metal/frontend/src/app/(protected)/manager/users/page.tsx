'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import CreateUserModal from '@/components/CreateUserModal';
import EditUserModal from '@/components/EditUserModal';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'MANAGER' | 'WORKER' | 'CLIENT';
  createdAt: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const logoutStore = useAuthStore((state) => state.logout);
  const authUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      setError('Error al cargar el listado de personal.');
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    logoutStore();
    router.push('/login');
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = window.confirm(`¿Está seguro que desea eliminar al usuario: ${name}? Esta acción desactiva su acceso.`);
    if (!isConfirmed) return;

    const previousUsers = [...users];
    setUsers(users.filter((user) => user.id !== id));

    try {
      await api.delete(`/users/${id}`);
    } catch (error: any) {
      setUsers(previousUsers);
      if (error.response?.status === 403) {
        alert('Violación de seguridad: No tienes privilegios para borrar usuarios.');
      } else {
        alert('Error de red al intentar eliminar el usuario.');
      }
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Gerencia</span>;
      case 'WORKER':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Operario</span>;
      case 'CLIENT':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Cliente</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold tracking-wider">Metalurgia ERP</h1>
              <div className="hidden md:flex space-x-4">
                <Link href="/manager" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Inventario
                </Link>
                <Link href="/manager/users" className="bg-slate-800 text-white px-3 py-2 rounded-md text-sm font-medium border border-slate-700">
                  Personal (RRHH)
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm hidden sm:block">
                <p className="font-medium">{authUser?.firstName} {authUser?.lastName}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Identidades (Usuarios)</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            + Aprovisionar Cuenta
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleado / Cliente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel de Acceso</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Alta</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-gray-500">{u.id.split('-')[0].toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-blue-600 hover:text-blue-900 mx-2 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
