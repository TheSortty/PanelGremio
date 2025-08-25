// backend/src/api/game.ts (Versión Final con Aserción de Tipos)
import { Router } from 'express';
import prisma from '../db';
import { Spell } from '@prisma/client';

const router = Router();

// --- Definimos la estructura exacta que esperamos de los datos ---
interface SpellReference {
    "@uniquename": string;
}

interface SpellSlot {
    spell?: SpellReference;
    "@uniquename"?: string;
}

interface SpellSlotsData {
    slot?: SpellSlot | SpellSlot[];
}
// -----------------------------------------------------------------


// GET /api/game/items/:uniqueName/spells
router.get('/items/:uniqueName/spells', async (req, res) => {
    const { uniqueName } = req.params;

    try {
        const item = await prisma.item.findUnique({ where: { id: uniqueName } });

        if (!item || !item.spellSlots) {
            return res.json({});
        }

        // --- LA LÍNEA CLAVE: Aserción de Tipos ---
        // Le decimos a TypeScript: "Trata a item.spellSlots como si fuera del tipo SpellSlotsData"
        const spellSlotsData = item.spellSlots as SpellSlotsData;
        const allSpellIds = new Set<string>();

        if (spellSlotsData && spellSlotsData.slot) {
            const slots = Array.isArray(spellSlotsData.slot) ? spellSlotsData.slot : [spellSlotsData.slot];
            
            for (const slot of slots) {
                const spellId = slot.spell?.["@uniquename"] || slot["@uniquename"];
                if (spellId) {
                    allSpellIds.add(spellId);
                }
            }
        }
        
        if (allSpellIds.size === 0) {
            return res.json({});
        }

        const allSpells = await prisma.spell.findMany({
            where: { id: { in: Array.from(allSpellIds) } }
        });

        // Agrupación de hechizos (aproximación funcional)
        const result: { [key: string]: Spell[] } = { Q: [], W: [], E: [], Passive: [] };
        const spellMap = new Map(allSpells.map(s => [s.id, s]));
        const uniqueSpellsInOrder = Array.from(allSpellIds).map(id => spellMap.get(id)).filter(Boolean) as Spell[];

        uniqueSpellsInOrder.forEach((spell, index) => {
            if (index < 3) result.Q.push(spell);
            else if (index < 6) result.W.push(spell);
            else if (index === 6) result.E.push(spell);
            else result.Passive.push(spell);
        });

        res.json(result);

    } catch (error) {
        console.error(`Failed to fetch spells for item ${uniqueName}:`, error);
        res.status(500).json({ message: 'Error fetching spells for item.' });
    }
});

export default router;