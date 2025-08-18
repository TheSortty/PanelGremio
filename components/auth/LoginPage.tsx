
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import RegisterModal from './RegisterModal';
import LoginModal from './LoginModal';

const SteamIcon = () => (
    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25zm0 3.165c-3.132 0-5.733 2.28-6.42 5.31l3.12-1.29c.27-.12.585.045.69.33.105.285-.045.585-.33.69l-4.14 1.71c-.135.06-.285.09-.435.09-.255 0-.51-.12-.66-.345-.21-.315-.12-.75.195-1.005C4.698 7.395 8.133 5.055 12 5.055c3.675 0 6.75 2.79 7.155 6.39l-2.07-1.14c-.255-.135-.57-.045-.72.21-.135.255-.045.57.21.72l3.075 1.695c.345.195.765.06 1.005-.285.24-.345.135-.81-.21-1.065C19.293 8.355 15.933 5.415 12 5.415zm-2.19 7.455l-1.035 2.28c-.12.27.015.585.285.69.27.12.585-.015.69-.285l1.035-2.28c.12-.27-.015-.585-.285-.69-.27-.105-.585.015-.69.285zm4.335-1.995c-.495 0-.9.405-.9.9s.405.9.9.9.9-.405.9-.9-.405-.9-.9-.9zm-1.08 2.07c-.36 0-.66.285-.66.645s.285.66.66.66.645-.285.645-.66-.285-.645-.645-.645z"/>
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.649-3.657-11.303-8H6.306C9.656 39.663 16.318 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.434 36.316 48 30.659 48 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
)

const CreateAccountIcon = () => (
    <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const LoginIcon = () => (
    <svg className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h5a3 3 0 013 3v1" />
    </svg>
);


const LoginPage: React.FC = () => {
    const { loginWithSteam, loginAsAdminForTesting } = useAuth();
    const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);

    return (
        <>
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center text-gray-200 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <h1 className="text-4xl font-bold text-white mb-2">Panel del Gremio</h1>
                     <p className="text-lg text-gray-400">Se requiere autorización para continuar.</p>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-8">
                    <div className="space-y-4">
                        <button 
                            onClick={loginWithSteam}
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-md transition-colors duration-200"
                        >
                            <SteamIcon />
                            Vincular con Steam
                        </button>
                         <button 
                            disabled
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-700 text-white font-bold rounded-lg shadow-md transition-colors duration-200 opacity-50 cursor-not-allowed"
                        >
                            <GoogleIcon />
                            Continuar con Google
                        </button>
                    </div>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-800 text-gray-400">o</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={() => setLoginModalOpen(true)}
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-md transition-colors duration-200"
                        >
                            <LoginIcon />
                            Iniciar Sesión
                        </button>
                        <button 
                            onClick={() => setRegisterModalOpen(true)}
                            className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-colors duration-200"
                        >
                            <CreateAccountIcon />
                            Registrarse
                        </button>
                    </div>
                </div>
                 <div className="mt-6 text-center">
                    <button
                        onClick={loginAsAdminForTesting}
                        className="px-4 py-2 text-xs text-gray-500 hover:text-indigo-400 hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Acceso de Administrador (Pruebas)
                    </button>
                </div>
            </div>
        </div>
        <RegisterModal isOpen={isRegisterModalOpen} onClose={() => setRegisterModalOpen(false)} />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
        </>
    );
};

export default LoginPage;