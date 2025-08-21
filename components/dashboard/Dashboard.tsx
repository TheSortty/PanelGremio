import React, { useState, useEffect } from 'react';
import * as api from '../../services/localDbService.ts'; // Renamed to apiService in spirit
import { GuildMember } from '../../types.ts';
import ActivityTable from './ActivityTable.tsx';
import StatCard from './StatCard.tsx';
import Card from '../shared/Card.tsx';

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const WifiIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.555a5.5 5.5 0 017.778 0M12 20.25a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008zm-3.339-3.34a2.75 2.75 0 013.89 0" />
    </svg>
);


const Dashboard: React.FC = () => {
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
      const fetchMembers = async () => {
          try {
              setLoading(true);
              const fetchedMembers = await api.getGuildMembers();
              setMembers(fetchedMembers);
          } catch (err) {
              setError("No se pudieron cargar los miembros del gremio.");
              console.error(err);
          } finally {
              setLoading(false);
          }
      };
      fetchMembers();
  }, []);

  const totalMembers = members.length;
  const membersOnline = members.filter(m => m.online).length;

  if (error) {
    return <div className="text-center text-red-400 bg-gray-800 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Miembros Totales" value={loading ? '...' : totalMembers} icon={<UsersIcon />} />
        <StatCard title="Miembros en Línea" value={loading ? '...' : membersOnline} icon={<WifiIcon />} />
        <Card>
            <div className="h-full flex flex-col justify-center">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">PRÓXIMO EVENTO IMPORTANTE</p>
                <p className="text-2xl font-bold text-white mt-1">ZvZ - Mañana a las 18:00 UTC</p>
            </div>
        </Card>
      </div>
      <ActivityTable members={members} loading={loading} />
    </div>
  );
};

export default Dashboard;