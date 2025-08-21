
import React, { useState, MouseEvent } from 'react';
import Card from '../shared/Card.tsx';

interface Marker {
  id: number;
  x: number;
  y: number;
  type: 'transport' | 'gank' | 'objective';
}

const markerColors = {
  transport: 'bg-blue-500',
  gank: 'bg-red-500',
  objective: 'bg-yellow-500',
}

const markerTypeTranslations: { [key: string]: string } = {
    transport: 'transporte',
    gank: 'gank',
    objective: 'objetivo',
};

const MapPage: React.FC = () => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedType, setSelectedType] = useState<'transport' | 'gank' | 'objective'>('objective');

  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // in percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100; // in percentage

    const newMarker: Marker = {
      id: Date.now(),
      x,
      y,
      type: selectedType
    };

    setMarkers([...markers, newMarker]);
  };
  
  const removeMarker = (id: number) => {
      setMarkers(markers.filter(marker => marker.id !== id));
  }

  return (
    <Card>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
            <h2 className="text-2xl font-bold">Mapa Estratégico</h2>
            <p className="text-gray-400">Haz clic en el mapa para añadir un marcador para planificar.</p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-700 p-2 rounded-lg">
            <span className="text-sm font-medium mr-2">Tipo de Marcador:</span>
            <button onClick={() => setSelectedType('objective')} className={`px-3 py-1 text-sm rounded-md ${selectedType === 'objective' ? 'bg-yellow-500 text-black' : 'bg-gray-600'}`}>Objetivo</button>
            <button onClick={() => setSelectedType('transport')} className={`px-3 py-1 text-sm rounded-md ${selectedType === 'transport' ? 'bg-blue-500 text-white' : 'bg-gray-600'}`}>Transporte</button>
            <button onClick={() => setSelectedType('gank')} className={`px-3 py-1 text-sm rounded-md ${selectedType === 'gank' ? 'bg-red-500 text-white' : 'bg-gray-600'}`}>Punto de Gank</button>
        </div>
      </div>
      <div 
        className="relative w-full aspect-video bg-gray-700 rounded-lg overflow-hidden cursor-crosshair"
        style={{ backgroundImage: `url('https://albiononline.com/assets/images/uploads/media/data/26/map_royal_continent.jpg')`, backgroundSize: 'cover' }}
        onClick={handleMapClick}
      >
        {markers.map(marker => (
          <div 
            key={marker.id}
            className={`absolute w-4 h-4 rounded-full ${markerColors[marker.type]} transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg cursor-pointer`}
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            onClick={(e) => { e.stopPropagation(); removeMarker(marker.id); }}
            title={`Eliminar marcador de ${markerTypeTranslations[marker.type]}`}
          />
        ))}
      </div>
    </Card>
  );
};

export default MapPage;