
import React, { useState } from 'react';
import Modal from '../shared/Modal.tsx';
import { useAuth } from './AuthContext.tsx';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithUsername } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('El nombre de usuario no puede estar vacío.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await loginWithUsername(username);
      if (loggedInUser) {
        onClose();
      } else {
        setError('Usuario no encontrado, no está activo o la contraseña es incorrecta.');
      }
    } catch (err) {
      setError('Hubo un error al iniciar sesión.');
      console.error(err);
    } finally {
        setLoading(false);
    }
  };
  
  const handleClose = () => {
      setError('');
      setUsername('');
      onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Iniciar Sesión">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Ingresa tu nombre de usuario para acceder al panel.
          </p>
          <div>
            <label htmlFor="login-username" className="block text-sm font-medium text-gray-300">
              Nombre de Usuario
            </label>
            <input
              type="text"
              name="username"
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default LoginModal;