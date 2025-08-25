// components/builds/SpellSelector.tsx
import React from 'react';
import { Spell } from '../../types';

interface SpellSelectorProps {
    spells: Spell[];
    selectedSpell: Spell | null;
    onSelectSpell: (spell: Spell) => void;
    slotType: string; // e.g., 'Q', 'W', 'Pasiva'
}

const SpellSelector: React.FC<SpellSelectorProps> = ({ spells, selectedSpell, onSelectSpell, slotType }) => {
    if (spells.length === 0) {
        return null;
    }

    return (
        <div className="mt-2">
            <p className="text-sm font-medium text-gray-400 mb-1">Habilidad ({slotType})</p>
            <div className="flex flex-wrap gap-2">
                {spells.map((spell) => (
                    <button
                        key={spell.id}
                        type="button"
                        onClick={() => onSelectSpell(spell)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all duration-150 ${selectedSpell?.id === spell.id ? 'border-indigo-500 scale-110' : 'border-gray-600 hover:border-indigo-400'
                            }`}
                        title={spell.name}
                    >
                        <img src={spell.iconUrl} alt={spell.name} className="w-full h-full rounded-md" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SpellSelector;