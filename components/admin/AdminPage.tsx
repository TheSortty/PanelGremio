import React, { useState, useEffect, useCallback } from 'react';
import { User, GuildMember } from '../../types.ts';
import * as api from '../../services/localDbService.ts'; // Renamed to apiService in spirit
import Card from '../shared/Card.tsx';
import { useAuth } from '../auth/AuthContext.tsx';

const ROLES: GuildMember['role'][] = ['Maestro del Gremio', 'Mano Derecha', 'Oficial', 'Miembro', 'Iniciado', 'Invitado'];

const UserRow: React.FC<{ user: User, onUpdate: () => void, currentUser: User }> = ({ user, onUpdate, currentUser }) => {
    
    const handleStatusChange = async (newStatus: User['status']) => {
        await api.updateUser(user.id, { status: newStatus });
        onUpdate();
    };

    const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as GuildMember['role'];
        await api.updateUser(user.id, { role: newRole });
        onUpdate();
    };

    const handleDelete = async () => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.name}? Esta acción no se puede deshacer.`)) {
            await api.deleteUser(user.id);
            onUpdate();
        }
    }

    return (
        <tr className="hover:bg-gray-700">
            <td className="px-4 py-3 whitespace-nowrap border-b border-gray-700 text-sm font-medium text-white">{user.name}</td>
            <td className="px-4 py-3 whitespace-nowrap border-b border-gray-700 text-sm text-gray-300">{user.id}</td>
            <td className="px-4 py-3 whitespace-nowrap border-b border-gray-700">
                <select 
                    value={user.role} 
                    onChange={handleRoleChange} 
                    className="bg-gray-600 text-white rounded px-2 py-1 text-sm border-transparent focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={user.id === currentUser.id}
                >
                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-b border-gray-700 text-sm">
                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-600 bg-opacity-50 text-green-200' :
                    user.status === 'pending' ? 'bg-yellow-600 bg-opacity-50 text-yellow-200' :
                    'bg-red-600 bg-opacity-50 text-red-200'
                }`}>{user.status}</span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap border-b border-gray-700 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
            <td className="px-4 py-3 whitespace-nowrap border-b border-gray-700 text-right text-sm font-medium space-x-2">
                {user.status === 'pending' && (
                    <>
                        <button onClick={() => handleStatusChange('active')} className="text-green-400 hover:text-green-300">Aprobar</button>
                        <button onClick={() => handleStatusChange('rejected')} className="text-yellow-400 hover:text-yellow-300">Rechazar</button>
                    </>
                )}
                 {user.id !== currentUser.id && (
                    <button onClick={handleDelete} className="text-red-400 hover:text-red-300">Eliminar</button>
                 )}
            </td>
        </tr>
    );
};

const AdminPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
    const { user: currentUser } = useAuth();

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const allUsers = await api.getUsers();
            setUsers(allUsers.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setError(null);
        } catch (err) {
            setError("No se pudieron cargar los usuarios.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter(user => {
        if (filter === 'all') return true;
        return user.status === filter;
    });

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Administración de Usuarios</h2>
                <p className="text-gray-400 mt-1">Gestiona los usuarios, aprueba solicitudes y ajusta roles.</p>
            </div>
            <Card>
                <div className="flex justify-end mb-4">
                    <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Todos</button>
                        <button onClick={() => setFilter('pending')} className={`px-3 py-1 text-sm rounded-md ${filter === 'pending' ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Pendientes</button>
                        <button onClick={() => setFilter('active')} className={`px-3 py-1 text-sm rounded-md ${filter === 'active' ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Activos</button>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrado</th>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                         <tbody className="bg-gray-800">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-4 text-gray-400">Cargando usuarios...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={6} className="text-center py-4 text-red-400">{error}</td></tr>
                            ) : (
                                filteredUsers.map(user => <UserRow key={user.id} user={user} onUpdate={fetchUsers} currentUser={currentUser} />)
                            )}
                         </tbody>
                    </table>
                 </div>
            </Card>
        </div>
    );
};

export default AdminPage;