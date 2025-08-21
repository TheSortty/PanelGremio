import React, { useState, useEffect } from 'react';
import { Build, Item } from '../../types.ts';
import { BUILD_CATEGORIES } from '../../constants.ts';
import * as api from '../../services/localDbService.ts'; // Renamed to apiService in spirit
import Card from '../shared/Card.tsx';

interface BuildCreatorProps {
  onSave: (build: Build) => Promise<void>;
  onCancel: () => void;
}

const initialBuildState: Build = {
  id: '', // Will be assigned by the backend
  title: '',
  category: BUILD_CATEGORIES[0],
  description: '',
  author: '',
  equipment: {
    weapon: null,
    offhand: null,
    helmet: null,
    chest: null,
    boots: null,
    cape: null,
  },
  consumables: {
    potion: null,
    food: null,
  },
  abilities: {},
};


const ItemSelector: React.FC<{
    itemType: Item['type'];
    selectedItem: Item | null;
    onSelect: (item: Item | null) => void;
    placeholder: string;
}> = ({ itemType, selectedItem, onSelect, placeholder }) => {
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
        // Basic debounce
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
                        <img src={selectedItem.iconUrl} alt="" className="h-6 w-6 flex-shrink-0 rounded-sm" />
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
                                    <img src={item.iconUrl} alt="" className="h-6 w-6 flex-shrink-0 rounded-sm" />
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

const slotTranslations: { [key: string]: string } = {
    weapon: 'arma',
    offhand: 'mano secundaria',
    helmet: 'casco',
    chest: 'pecho',
    boots: 'botas',
    cape: 'capa',
};
const translateSlot = (slot: keyof typeof slotTranslations) => slotTranslations[slot] || slot;


const BuildCreator: React.FC<BuildCreatorProps> = ({ onSave, onCancel }) => {
  const [build, setBuild] = useState<Build>(initialBuildState);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setBuild({ ...build, [e.target.name]: e.target.value });
  };
  
  const handleItemSelect = (slot: keyof Build['equipment'] | keyof Build['consumables'], item: Item | null) => {
    if ('weapon' in build.equipment && slot in build.equipment) {
        setBuild(prev => ({ ...prev, equipment: { ...prev.equipment, [slot]: item }}));
    } else {
        setBuild(prev => ({ ...prev, consumables: { ...prev.consumables, [slot]: item }}));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      await onSave(build);
      setIsSaving(false);
  }


  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
            <h3 className="text-lg font-medium leading-6 text-white">Información Básica</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">Título de la Build</label>
                    <input type="text" name="title" id="title" required value={build.title} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                     <label htmlFor="category" className="block text-sm font-medium text-gray-300">Categoría</label>
                     <select id="category" name="category" value={build.category} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        {BUILD_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                     </select>
                </div>
                <div>
                     <label htmlFor="author" className="block text-sm font-medium text-gray-300">Autor</label>
                     <input type="text" name="author" id="author" required value={build.author} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descripción</label>
                    <textarea id="description" name="description" rows={3} value={build.description} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
            </div>
        </Card>

        <Card>
            <h3 className="text-lg font-medium leading-6 text-white">Equipamiento</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                {(Object.keys(build.equipment) as Array<keyof Build['equipment']>).map(slot => (
                     <div key={slot}>
                         <label className="block text-sm font-medium text-gray-300 capitalize">{translateSlot(slot)}</label>
                         <ItemSelector 
                            itemType={slot === 'offhand' ? 'offhand' : slot}
                            selectedItem={build.equipment[slot]} 
                            onSelect={(item) => handleItemSelect(slot, item)} 
                            placeholder={`Seleccionar ${translateSlot(slot)}`}
                         />
                     </div>
                ))}
            </div>
        </Card>
        
         <Card>
            <h3 className="text-lg font-medium leading-6 text-white">Consumibles</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
               <div>
                   <label className="block text-sm font-medium text-gray-300">Poción</label>
                   <ItemSelector itemType="potion" selectedItem={build.consumables.potion} onSelect={(item) => handleItemSelect('potion', item)} placeholder="Seleccionar poción" />
               </div>
               <div>
                   <label className="block text-sm font-medium text-gray-300">Comida</label>
                   <ItemSelector itemType="food" selectedItem={build.consumables.food} onSelect={(item) => handleItemSelect('food', item)} placeholder="Seleccionar comida" />
               </div>
            </div>
        </Card>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-wait">
            {isSaving ? 'Guardando...' : 'Guardar Build'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BuildCreator;