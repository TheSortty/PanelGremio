// components/builds/ItemSelector.tsx
import React, { useState, useEffect } from 'react';
import { Item } from '../../types';
import * as api from '../../services/localDbService';

interface ItemSelectorProps {
    itemType: Item['type'] | 'weapon' | 'offhand' | 'helmet' | 'chest' | 'boots' | 'cape';
    selectedItem: Item | null;
    onSelect: (item: Item | null) => void;
    placeholder: string;
}

const ItemSelector: React.FC<ItemSelectorProps> = ({ itemType, selectedItem, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            if (!isOpen) return;
            setLoading(true);
            try {
                const fetchedItems = await api.getItems({ type: itemType, search: searchTerm });
                setItems(fetchedItems);
            } catch (error) {
                console.error(`Failed to fetch items of type ${itemType}:`, error);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };
        const handler = setTimeout(() => fetchItems(), 300);
        return () => clearTimeout(handler);
    }, [isOpen, itemType, searchTerm]);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                {selectedItem ? (
                    <span className="flex items-center">
                        <img src={selectedItem.iconUrl} alt={selectedItem.name} className="h-6 w-6 flex-shrink-0 rounded-sm" />
                        <span className="ml-3 block truncate">{selectedItem.name}</span>
                    </span>
                ) : (
                    <span className="text-gray-400">{placeholder}</span>
                )}
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </span>
            </button>
            {isOpen && (
                <div className="absolute mt-1 w-full rounded-md bg-gray-700 shadow-lg z-10">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border-b border-gray-600 px-3 py-2 focus:outline-none"
                    />
                    <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {loading ? (
                            <li className="text-gray-400 text-center py-2">Cargando...</li>
                        ) : items.map(item => (
                            <li key={item.id} onClick={() => { onSelect(item); setIsOpen(false); }}
                                className="text-gray-200 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600">
                                <span className="flex items-center">
                                    <img src={item.iconUrl} alt={item.name} className="h-6 w-6 flex-shrink-0 rounded-sm" />
                                    <span className="ml-3 block truncate font-normal">{item.name}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ItemSelector;