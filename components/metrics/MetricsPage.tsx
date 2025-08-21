import React, { useMemo, useState, useEffect } from 'react';
import * as api from '../../services/localDbService.ts'; // Renamed to apiService in spirit
import { MemberActivityLog } from '../../types.ts';
import Card from '../shared/Card.tsx';
import Modal from '../shared/Modal.tsx';

interface ChartData {
  label: string;
  value: number;
  members: string[];
}

const DailyActivityChart: React.FC<{ data: ChartData[]; onBarClick: (item: ChartData) => void }> = ({ data, onBarClick }) => {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4">Actividad por Día de la Semana</h3>
      <div className="flex justify-between items-end h-64 space-x-2 pt-4">
        {data.map((item, index) => (
          <div 
            key={index} 
            className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
            onClick={() => onBarClick(item)}
            title={`Ver actividad de ${item.label}`}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onBarClick(item)}
          >
            <span className="text-sm font-bold text-white mb-1">{item.value}</span>
            <div
              className="w-full bg-indigo-500 group-hover:bg-indigo-400 rounded-t-md transition-all duration-300"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
            <span className="text-xs text-gray-400 mt-2">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const HourlyActivityHeatmap: React.FC<{ data: ChartData[]; onHourClick: (item: ChartData) => void }> = ({ data, onHourClick }) => {
    const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
    
    const getColor = (value: number) => {
        if (value === 0) return 'bg-gray-700 hover:bg-gray-600';
        const opacity = Math.min(0.2 + (value / maxValue) * 0.8, 1) * 100;
        return `bg-teal-500/${Math.floor(opacity)} hover:bg-teal-400`;
    }

    return (
        <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Actividad por Hora del Día (UTC)</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                {data.map((item, index) => (
                    <div
                        key={index}
                        className={`w-full aspect-square rounded-md flex flex-col justify-center items-center cursor-pointer transition-colors duration-200 ${getColor(item.value)}`}
                        onClick={() => onHourClick(item)}
                        title={`${item.label}:00 - ${item.value} conexiones`}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && onHourClick(item)}
                    >
                        <span className="text-xs text-gray-300">{item.label}h</span>
                        <span className="font-bold text-white text-sm sm:text-base">{item.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};


const MetricsPage: React.FC = () => {
  const [modalContent, setModalContent] = useState<{ title: string; members: string[] } | null>(null);
  const [activityLogs, setActivityLogs] = useState<MemberActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      const fetchLogs = async () => {
          try {
              setLoading(true);
              const logs = await api.getActivityLogs();
              setActivityLogs(logs);
          } catch (err) {
              setError("No se pudieron cargar las métricas de actividad.");
              console.error(err);
          } finally {
              setLoading(false);
          }
      };
      fetchLogs();
  }, []);

  const dailyActivity = useMemo<ChartData[]>(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayData = days.map(day => ({ label: day, value: 0, members: new Set<string>() }));

    activityLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const dayIndex = date.getDay();
      dayData[dayIndex].value++;
      dayData[dayIndex].members.add(log.memberId);
    });

    return dayData.map(d => ({ ...d, members: Array.from(d.members) }));
  }, [activityLogs]);

  const hourlyActivity = useMemo<ChartData[]>(() => {
    const hourData = Array.from({ length: 24 }, (_, i) => ({
        label: i.toString().padStart(2, '0'),
        value: 0,
        members: new Set<string>()
    }));

     activityLogs.forEach(log => {
      const hourIndex = new Date(log.timestamp).getHours();
      hourData[hourIndex].value++;
      hourData[hourIndex].members.add(log.memberId);
    });
    
    return hourData.map(h => ({...h, members: Array.from(h.members)}));
  }, [activityLogs]);

  const handleDayClick = (item: ChartData) => {
    const dayNames: { [key: string]: string } = {'Dom': 'Domingo', 'Lun': 'Lunes', 'Mar': 'Martes', 'Mié': 'Miércoles', 'Jue': 'Jueves', 'Vie': 'Viernes', 'Sáb': 'Sábado'};
    setModalContent({
      title: `Miembros Activos el ${dayNames[item.label] || item.label}`,
      members: item.members.sort()
    });
  };

  const handleHourClick = (item: ChartData) => {
     setModalContent({
      title: `Miembros Activos a las ${item.label}:00 UTC`,
      members: item.members.sort()
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Métricas de Actividad del Gremio</h2>
        <p className="text-gray-400 mt-1">
          Analiza los patrones de conexión de los miembros para planificar mejor los eventos. Haz clic en un día u hora para ver detalles.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div></div>
      ) : error ? (
        <div className="text-center text-red-400 bg-gray-800 p-4 rounded-lg">{error}</div>
      ) : (
        <>
            <DailyActivityChart data={dailyActivity} onBarClick={handleDayClick} />
            <HourlyActivityHeatmap data={hourlyActivity} onHourClick={handleHourClick} />
        </>
      )}

       <Modal 
        isOpen={!!modalContent}
        onClose={() => setModalContent(null)}
        title={modalContent?.title || ''}
      >
        {modalContent && modalContent.members.length > 0 ? (
          <ul className="space-y-2">
            {modalContent.members.map(member => (
              <li key={member} className="bg-gray-700 p-2 rounded-md text-gray-200">{member}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No se registraron miembros activos en este período.</p>
        )}
      </Modal>

    </div>
  );
};

export default MetricsPage;