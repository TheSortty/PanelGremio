import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types.ts';
import * as api from '../../services/localDbService.ts'; // Renamed to apiService in spirit
import Card from '../shared/Card.tsx';

const AuditLogPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const allLogs = await api.getAuditLogs();
                setLogs(allLogs);
            } catch (err) {
                setError("No se pudieron cargar los registros de auditoría.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const formatAction = (action: string): string => {
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="space-y-6">
             <div>
                <h2 className="text-2xl font-bold text-white">Registro de Auditoría</h2>
                <p className="text-gray-400 mt-1">Historial de acciones importantes realizadas en el panel.</p>
            </div>
             <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Autor</th>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                                <th className="px-4 py-2 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Detalles</th>
                            </tr>
                        </thead>
                         <tbody className="bg-gray-800">
                             {loading ? (
                                <tr><td colSpan={4} className="text-center py-4 text-gray-400">Cargando registros...</td></tr>
                             ) : error ? (
                                <tr><td colSpan={4} className="text-center py-4 text-red-400">{error}</td></tr>
                             ) : (
                                 logs.map(log => (
                                     <tr key={log.id} className="hover:bg-gray-700">
                                         <td className="px-4 py-3 whitespace-nowrap border-b border-gray-700 text-sm text-gray-400" title={log.timestamp}>
                                            {new Date(log.timestamp).toLocaleString()}
                                         </td>
                                         <td className="px-4 py-3 whitespace-nowrap border-b border-gray-700 text-sm font-medium text-white">
                                            {log.actorName}
                                         </td>
                                         <td className="px-4 py-3 whitespace-nowrap border-b border-gray-700 text-sm text-gray-300">
                                            {formatAction(log.action)}
                                         </td>
                                          <td className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">
                                            {log.details && Object.entries(log.details).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                         </td>
                                     </tr>
                                 ))
                             )}
                         </tbody>
                    </table>
                </div>
             </Card>
        </div>
    );
};

export default AuditLogPage;