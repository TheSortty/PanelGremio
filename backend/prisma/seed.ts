// prisma/seed.ts (Versión final que guarda los spellSlots)
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ... (La interfaz RawItem y la función getItemType se quedan igual que en la versión anterior)
interface RawItem {
    UniqueName: string;
    LocalizedNames?: { 'ES-ES': string; };
    spellslots?: { slot: any[] | any }; // <-- Añadimos los spellslots
}

function getItemType(uniqueName: string): string {
    // ... (la función que ya tenías)
    const uname = uniqueName.toUpperCase();
    if (uname.startsWith('T') && (uname.includes('MAIN_') || uname.includes('2H_'))) return 'weapon';
    if (uname.startsWith('T') && uname.includes('OFF_')) return 'offhand';
    if (uname.startsWith('T') && uname.includes('HEAD_')) return 'helmet';
    if (uname.startsWith('T') && uname.includes('ARMOR_')) return 'chest';
    if (uname.startsWith('T') && uname.includes('SHOES_')) return 'boots';
    if (uname.startsWith('T') && uname.includes('_CAPE')) return 'cape';
    if (uname.startsWith('T') && uname.includes('TOOL_')) return 'tool';
    if (uname.startsWith('T') && uname.includes('_BAG')) return 'accessory';
    if (uname.includes('_POTION_')) return 'potion';
    if (uname.includes('_MEAL_') || uname.includes('_FOOD_')) return 'food';
    if (uname.includes('_MOUNT_')) return 'mount';
    if (uname.includes('FURNITURE')) return 'furniture';
    if (uname.includes('JOURNAL')) return 'journal';
    if (uname.includes('QUESTITEM')) return 'quest';
    return 'unknown';
}


async function main() {
    console.log(`Start seeding items from JSON file...`);
    const itemsPath = path.join(__dirname, 'items.json');
    const fileContent = fs.readFileSync(itemsPath, "utf-8");
    const rawItems: RawItem[] = JSON.parse(fileContent);

    let count = 0;
    for (const item of rawItems) {
        const itemName = item.LocalizedNames?.['ES-ES'] || item.UniqueName;
        if (!itemName) continue;

        const itemType = getItemType(item.UniqueName);
        const iconUrl = `https://render.albiononline.com/v1/item/${item.UniqueName}.png`;

        // Extraemos los hechizos del ítem
        const spellSlots = item.spellslots || null;

        await prisma.item.upsert({
            where: { id: item.UniqueName },
            update: { name: itemName, iconUrl: iconUrl, type: itemType, spellSlots: spellSlots as any },
            create: {
                id: item.UniqueName,
                name: itemName,
                type: itemType,
                iconUrl: iconUrl,
                spellSlots: spellSlots as any,
            },
        });
        count++;
    }
    console.log(`Seeding finished. ${count} items processed and categorized.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });