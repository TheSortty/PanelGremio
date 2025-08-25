import React, { useState, useCallback } from 'react';
import { Build, Item, Spell, GroupedSpells } from '../../types';
import { BUILD_CATEGORIES } from '../../constants';
import * as api from '../../services/localDbService';
import Card from '../shared/Card';
import ItemSelector from './ItemSelector';
import SpellSelector from './SpellSelector';
import { useAuth } from '../auth/AuthContext';

interface BuildCreatorProps {
    onSave: (build: Build) => Promise<void>;
    onCancel: () => void;
}

const initialBuildState: Build = {
    id: '',
    title: '',
    category: BUILD_CATEGORIES[0],
    description: '',
    author: null,
    equipment: { weapon: null, offhand: null, helmet: null, chest: null, boots: null, cape: null },
    consumables: { potion: null, food: null },
    abilities: {},
};

const slotTranslations: { [key: string]: string } = {
    weapon: 'arma', offhand: 'mano secundaria', helmet: 'casco',
    chest: 'pecho', boots: 'botas', cape: 'capa',
};

const translateSlot = (slot: keyof typeof slotTranslations) => slotTranslations[slot] || slot;

const BuildCreator: React.FC<BuildCreatorProps> = ({ onSave, onCancel }) => {
    const { user } = useAuth();
    const [build, setBuild] = useState<Build>(initialBuildState);
    const [isSaving, setIsSaving] = useState(false);
    const [availableSpells, setAvailableSpells] = useState<{ [key: string]: GroupedSpells }>({});

    const fetchSpells = useCallback(async (itemSlot: keyof Build['equipment'], item: Item) => {
        if (!item) {
            setAvailableSpells(prev => ({ ...prev, [itemSlot]: {} }));
            return;
        }
        try {
            const spells = await api.getSpellsForItem(item.id);
            setAvailableSpells(prev => ({ ...prev, [itemSlot]: spells }));
        } catch (error) {
            console.error(`Failed to fetch spells for ${item.name}:`, error);
            setAvailableSpells(prev => ({ ...prev, [itemSlot]: {} }));
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setBuild({ ...build, [e.target.name]: e.target.value });
    };

    const handleItemSelect = (slot: keyof Build['equipment'] | keyof Build['consumables'], item: Item | null) => {
        // Lista explícita de los slots de equipamiento para una comprobación más segura
        const equipmentSlots = ['weapon', 'offhand', 'helmet', 'chest', 'boots', 'cape'];
        const isEquipment = equipmentSlots.includes(slot as string);

        setBuild(prev => {
            // --- LÍNEA DE PROTECCIÓN ---
            // Si por alguna razón el estado previo es nulo, no hacemos nada para evitar el crash.
            if (!prev) return prev;

            if (isEquipment) {
                // Limpia las habilidades del slot específico al cambiar el ítem
                const newAbilities = { ...prev.abilities };
                delete newAbilities[`${slot}_Q`];
                delete newAbilities[`${slot}_W`];
                delete newAbilities[`${slot}_E`];
                delete newAbilities[`${slot}_Passive`];

                if (item) {
                    fetchSpells(slot as keyof Build['equipment'], item);
                } else {
                    setAvailableSpells(prevSpells => ({ ...prevSpells, [slot]: {} }));
                }

                return {
                    ...prev,
                    equipment: { ...prev.equipment, [slot]: item },
                    abilities: newAbilities
                };

            } else { // Es un consumible
                return {
                    ...prev,
                    consumables: { ...prev.consumables, [slot]: item }
                };
            }
        });
    };

    const handleSpellSelect = (abilitySlot: string, spell: Spell) => {
        setBuild(prev => ({ ...prev, abilities: { ...prev.abilities, [abilitySlot]: spell } }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(build);
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-6">
                <Card>
                    <h3 className="text-lg font-medium leading-6 text-white">Información Básica</h3>
                    <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <div className="sm:col-span-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Título de la Build</label>
                            <input type="text" name="title" id="title" required value={build.title} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-300">Categoría</label>
                            <select id="category" name="category" value={build.category} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border-gray-600 rounded-md">
                                {BUILD_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Autor</label>
                            <p className="mt-1 block w-full bg-gray-800 rounded-md p-2 sm:text-sm text-gray-400">
                                {user?.name || 'Desconocido'}
                            </p>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descripción</label>
                            <textarea id="description" name="description" rows={3} value={build.description} onChange={handleInputChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md"></textarea>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-medium leading-6 text-white">Equipamiento y Habilidades</h3>
                    <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        {(Object.keys(build.equipment) as Array<keyof Build['equipment']>).map(slot => (
                            <div key={slot}>
                                <label className="block text-sm font-medium text-gray-300 capitalize">{translateSlot(slot)}</label>
                                <ItemSelector
                                    itemType={slot}
                                    selectedItem={build.equipment[slot]}
                                    onSelect={(item) => handleItemSelect(slot, item)}
                                    placeholder={`Seleccionar ${translateSlot(slot)}`}
                                />
                                {availableSpells[slot] && Object.entries(availableSpells[slot]).map(([slotType, spells]) =>
                                    spells.length > 0 && (
                                        <SpellSelector
                                            key={slotType}
                                            spells={spells}
                                            selectedSpell={build.abilities[`${slot}_${slotType}`] || null}
                                            onSelectSpell={(spell) => handleSpellSelect(`${slot}_${slotType}`, spell)}
                                            slotType={slotType}
                                        />
                                    )
                                )}
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
                    <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">
                        {isSaving ? 'Guardando...' : 'Guardar Build'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default BuildCreator;