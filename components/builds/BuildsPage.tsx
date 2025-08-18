import React, { useState, useEffect, useCallback } from 'react';
import { Build } from '../../types';
import * as api from '../../services/localDbService'; // Renamed to apiService in spirit
import BuildCreator from './BuildCreator';
import BuildViewer from './BuildViewer';
import Card from '../shared/Card';

type ViewState = 'list' | 'create' | 'view';

const BuildsPage: React.FC = () => {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBuilds = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedBuilds = await api.getBuilds();
      setBuilds(fetchedBuilds);
      setError(null);
    } catch (err) {
      setError("No se pudieron cargar las builds. Inténtalo de nuevo más tarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewState === 'list') {
      fetchBuilds();
    }
  }, [viewState, fetchBuilds]);

  const handleSelectBuild = (build: Build) => {
    setSelectedBuild(build);
    setViewState('view');
  };

  const handleCreateNew = () => {
    setSelectedBuild(null);
    setViewState('create');
  };
  
  const handleSaveBuild = async (newBuild: Build) => {
    try {
        await api.createBuild(newBuild);
        setViewState('list');
    } catch (err) {
        console.error("Failed to save build:", err);
        // Here you could show an error toast to the user
        alert("Error al guardar la build.");
    }
  };
  
  const handleBackToList = () => {
      setSelectedBuild(null);
      setViewState('list');
  }

  const renderContent = () => {
    switch (viewState) {
      case 'create':
        return <BuildCreator onSave={handleSaveBuild} onCancel={handleBackToList} />;
      case 'view':
        return selectedBuild ? <BuildViewer build={selectedBuild} onBack={handleBackToList} /> : null;
      case 'list':
      default:
        if (loading) {
          return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div></div>;
        }
        if (error) {
          return <div className="text-center text-red-400 bg-gray-800 p-4 rounded-lg">{error}</div>;
        }
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Builds</h2>
              <button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors">
                + Crear Nueva Build
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {builds.map((build) => (
                <Card key={build.id} className="cursor-pointer hover:border-indigo-500 border-2 border-transparent transition-all duration-200" onClick={() => handleSelectBuild(build)}>
                    <h3 className="text-lg font-semibold text-white truncate">{build.title}</h3>
                    <p className="text-sm text-gray-400">{build.category}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {Object.values(build.equipment).map((item, index) => item && (
                             <img key={index} src={item.iconUrl} alt={item.name} className="w-10 h-10 rounded-md bg-gray-700"/>
                        ))}
                    </div>
                    <p className="text-xs text-right mt-3 text-gray-500">por {build.author}</p>
                </Card>
              ))}
            </div>
          </div>
        );
    }
  };

  return <>{renderContent()}</>;
};

export default BuildsPage;
