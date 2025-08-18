import React from 'react';
import { GuildMember } from '../../types';
import Card from '../shared/Card';

interface ActivityTableProps {
  members: GuildMember[];
  loading: boolean;
}

const ActivityTable: React.FC<ActivityTableProps> = ({ members, loading }) => {
  return (
    <Card>
        <h3 className="text-lg font-semibold text-white mb-4">MIEMBROS ACTIVOS RECIENTEMENTE</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr>
                        <th className="px-6 py-3 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                        <th className="px-6 py-3 border-b-2 border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Última vez visto</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800">
                    {loading ? (
                        <tr><td colSpan={3} className="text-center py-4 text-gray-400">Cargando miembros...</td></tr>
                    ) : (
                        members.map((member) => (
                            <tr key={member.name} className="hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap border-b border-gray-700">
                                    <div className="text-sm font-medium text-white">{member.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap border-b border-gray-700">
                                    <div className="text-sm text-gray-300">{member.role}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap border-b border-gray-700">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        member.online ? 'bg-green-600 bg-opacity-50 text-green-200' : 'bg-gray-600 bg-opacity-50 text-gray-300'
                                    }`}>
                                        {member.lastSeen}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </Card>
  );
};

export default ActivityTable;
