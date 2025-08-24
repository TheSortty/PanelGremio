import React, { useState, useCallback } from 'react';
import { Build, Item, Ability } from '../../types';
import Card from '../shared/Card';
import { generateBuildGuide } from '../../services/geminiService';

interface BuildViewerProps {
    build: Build;
    onBack: () => void;
}

const AbilityIcon: React.FC<{ ability: Ability | null }> = ({ ability }) => {
    if (!ability) return <div className="w-8 h-8 bg-gray-700 rounded-md" />;
    return <img src={ability.iconUrl} alt={ability.name} title={ability.name} className="w-8 h-8 rounded-md border-2 border-gray-600" />;
};

const EquipmentSlot: React.FC<{ item: Item | null, abilities?: (Ability | null)[] }> = ({ item, abilities }) => (
    <div className="relative w-24 h-24 bg-gray-900 rounded-lg border-2 border-gray-700 flex items-center justify-center">
        {item ? (
            <img src={item.iconUrl} alt={item.name} title={item.name} className="w-20 h-20" />
        ) : (
            <div className="w-20 h-20 bg-gray-800 rounded-md"></div>
        )}
        {abilities && (
            <div className="absolute -bottom-2 -right-2 flex space-x-1">
                {abilities.map((ability, index) => <AbilityIcon key={index} ability={ability} />)}
            </div>
        )}
    </div>
);


const BuildViewer: React.FC<BuildViewerProps> = ({ build, onBack }) => {
    const [aiGuide, setAiGuide] = useState(build.aiGuide || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateGuide = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const guide = await generateBuildGuide(build);
            setAiGuide(guide);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Un error desconocido ocurrió.';
            setError(errorMessage);
            setAiGuide(''); // Clear previous guide on error
        } finally {
            setIsLoading(false);
        }
    }, [build]);


    return (
        <div className="space-y-6">
            <button onClick={onBack} className="mb-4 bg-gray-700 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded transition-colors">
                &larr; Volver a Builds
            </button>

            <Card>
                <h2 className="text-2xl font-bold text-white mb-1">{build.title}</h2>
                <p className="text-sm text-gray-400">por {build.author?.name} en <span className="font-semibold text-indigo-400">{build.category}</span></p>
                <p className="mt-4 text-gray-300">{build.description}</p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">Equipamiento y Habilidades</h3>
                        <div className="grid grid-cols-3 gap-4 justify-items-center">
                            {/* Placeholder */} <div />
                            <EquipmentSlot item={build.equipment.helmet} abilities={[build.abilities.helmet_d, build.abilities.helmet_passive]} />
                            {/* Placeholder */} <div />

                            <EquipmentSlot item={build.equipment.offhand} />
                            <EquipmentSlot item={build.equipment.chest} abilities={[build.abilities.chest_r, build.abilities.chest_passive]} />
                            <EquipmentSlot item={build.equipment.cape} />

                            <EquipmentSlot item={build.equipment.weapon} abilities={[build.abilities.weapon_q, build.abilities.weapon_w, build.abilities.weapon_e]} />
                            <div />
                            <EquipmentSlot item={build.equipment.boots} abilities={[build.abilities.boots_f, build.abilities.boots_passive]} />
                        </div>
                    </Card>
                    <Card>
                        <h3 className="text-xl font-semibold mb-4">Consumibles</h3>
                        <div className="flex space-x-4">
                            <div className="flex items-center space-x-3">
                                <EquipmentSlot item={build.consumables.potion} />
                                <span className="font-medium">{build.consumables.potion?.name || 'Sin Poción'}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <EquipmentSlot item={build.consumables.food} />
                                <span className="font-medium">{build.consumables.food?.name || 'Sin Comida'}</span>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <h3 className="text-xl font-semibold mb-4">Guía Generada por IA</h3>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-red-400">
                                <p>Error al generar la guía:</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        ) : aiGuide ? (
                            <div className="prose prose-invert prose-sm text-gray-300" dangerouslySetInnerHTML={{ __html: aiGuide.replace(/\n/g, '<br />') }} />
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-400 mb-4">Genera una guía sobre cómo jugar esta build usando IA.</p>
                                <button onClick={handleGenerateGuide} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors w-full">
                                    Generar Guía
                                </button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BuildViewer;