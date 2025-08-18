
import React, { useState } from 'react';
import Modal from '../shared/Modal';
import { useAuth } from './AuthContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const { registerUser } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('El nombre de usuario no puede estar vacío.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await registerUser(username);
      setSuccess('¡Solicitud de registro enviada! Un administrador la revisará pronto.');
      setUsername('');
      setTimeout(() => {
          onClose();
          setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Hubo un error al registrar. Inténtalo de nuevo.');
      console.error(err);
    } finally {
        setLoading(false);
    }
  };
  
  const handleClose = () => {
      setError('');
      setSuccess('');
      setUsername('');
      onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Solicitar Acceso al Panel">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Ingresa tu nombre de personaje principal. Tu cuenta requerirá la aprobación de un administrador
            antes de que puedas iniciar sesión.
          </p>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Nombre de Usuario
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}
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
              {loading ? 'Enviando...' : 'Solicitar Registro'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RegisterModal;