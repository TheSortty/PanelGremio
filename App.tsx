
import React, { useState } from 'react';
import Dashboard from './components/dashboard/Dashboard';
import BuildsPage from './components/builds/BuildsPage';
import MapPage from './components/map/MapPage';
import MetricsPage from './components/metrics/MetricsPage';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import LoginPage from './components/auth/LoginPage';
import UserMenu from './components/auth/UserMenu';
import { GuildMember } from './types';
import AdminPage from './components/admin/AdminPage';
import AuditLogPage from './components/admin/AuditLogPage';

type Page = 'dashboard' | 'builds' | 'map' | 'metrics' | 'admin' | 'logs';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { user } = useAuth();

  const adminRoles: GuildMember['role'][] = ['Maestro del Gremio', 'Mano Derecha', 'Oficial'];
  const canViewAdminSections = user && adminRoles.includes(user.role);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'builds':
        return <BuildsPage />;
      case 'map':
        return <MapPage />;
      case 'metrics':
        return canViewAdminSections ? <MetricsPage /> : <Dashboard />;
      case 'admin':
        return canViewAdminSections ? <AdminPage /> : <Dashboard />;
      case 'logs':
        return canViewAdminSections ? <AuditLogPage /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  const NavLink: React.FC<{ page: Page; label: string }> = ({ page, label }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        currentPage === page
          ? 'bg-indigo-500 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="bg-gray-800 shadow-lg">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white mr-6">PANEL DEL GREMIO</h1>
            <div className="flex items-center space-x-2">
                <NavLink page="dashboard" label="Panel" />
                <NavLink page="builds" label="Builds" />
                <NavLink page="map" label="Rutas" />
                {canViewAdminSections && (
                  <>
                    <NavLink page="metrics" label="Métricas" />
                    <NavLink page="admin" label="Administración" />
                    <NavLink page="logs" label="Registro" />
                  </>
                )}
            </div>
          </div>
          <UserMenu />
        </nav>
      </header>
      <main className="container mx-auto p-6">
        {renderPage()}
      </main>
    </div>
  );
}


const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  );
};

const AppWrapper: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
     return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return user ? <AppContent /> : <LoginPage />;
};


export default App;
