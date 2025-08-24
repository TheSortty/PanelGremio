
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserAvatar: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const UserMenu: React.FC = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-700 transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <UserAvatar />
                <span className="hidden md:inline text-sm font-medium text-white">{user.name}</span>
                 <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                >
                    <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm text-white font-semibold truncate" role="none">{user.name}</p>
                        <p className="text-xs text-indigo-400" role="none">{user.role}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-indigo-500 hover:text-white"
                        role="menuitem"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;