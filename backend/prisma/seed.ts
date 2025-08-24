// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const allItems = [
    // Weapons
    { id: 'T4_MAIN_AXE', name: 'Hacha de Batalla de Adepto', type: 'weapon', iconUrl: 'https://render.albiononline.com/v1/sprite/T4_MAIN_AXE?quality=4&size=128' },
    { id: 'T6_MAIN_CURSEDSTAFF', name: 'Bastón Maldito de Gran Maestro', type: 'weapon', iconUrl: 'https://render.albiononline.com/v1/sprite/T6_MAIN_CURSEDSTAFF?quality=4&size=128' },
    // Helmets
    { id: 'T4_HEAD_PLATE_SET1', name: 'Casco de Soldado de Adepto', type: 'helmet', iconUrl: 'https://render.albiononline.com/v1/sprite/T4_HEAD_PLATE_SET1?quality=4&size=128' },
    { id: 'T7_HEAD_LEATHER_SET2', name: 'Capucha de Acechador de Anciano', type: 'helmet', iconUrl: 'https://render.albiononline.com/v1/sprite/T7_HEAD_LEATHER_SET2?quality=4&size=128' },
    // Chests
    { id: 'T5_ARMOR_CLOTH_SET1', name: 'Túnica de Mago de Experto', type: 'chest', iconUrl: 'https://render.albiononline.com/v1/sprite/T5_ARMOR_CLOTH_SET1?quality=4&size=128' },
    { id: 'T8_ARMOR_PLATE_SET3', name: 'Armadura de Demonio de Anciano', type: 'chest', iconUrl: 'https://render.albiononline.com/v1/sprite/T8_ARMOR_PLATE_SET3?quality=4&size=128' },
    // Boots
    { id: 'T4_SHOES_LEATHER_SET1', name: 'Zapatos de Mercenario de Adepto', type: 'boots', iconUrl: 'https://render.albiononline.com/v1/sprite/T4_SHOES_LEATHER_SET1?quality=4&size=128' },
    // Offhands
    { id: 'T4_OFF_SHIELD', name: 'Escudo de Adepto', type: 'offhand', iconUrl: 'https://render.albiononline.com/v1/sprite/T4_OFF_SHIELD?quality=4&size=128' },
    // Capes
    { id: 'T4_CAPE_THETFORD', name: 'Capa de Thetford de Adepto', type: 'cape', iconUrl: 'https://render.albiononline.com/v1/sprite/T4_CAPE_THETFORD?quality=4&size=128' },
    // Potions
    { id: 'T6_POTION_HEAL', name: 'Poción de Curación de Gran Maestro', type: 'potion', iconUrl: 'https://render.albiononline.com/v1/sprite/T6_POTION_HEAL?quality=4&size=128' },
    // Food
    { id: 'T7_MEAL_STEW', name: 'Estofado de Ternera de Anciano', type: 'food', iconUrl: 'https://render.albiononline.com/v1/sprite/T7_MEAL_STEW?quality=4&size=128' },
];

async function main() {
    console.log(`Start seeding ...`);
    for (const item of allItems) {
        const createdItem = await prisma.item.upsert({
            where: { id: item.id },
            update: {},
            create: item,
        });
        console.log(`Created/updated item with id: ${createdItem.id}`);
    }
    console.log(`Seeding finished.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });