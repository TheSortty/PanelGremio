// prisma/seed-spells.ts (Versión con TRUNCATE)
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ... (La función processSpells se queda igual)
async function processSpells(spellList: any[]) {
    let count = 0;
    if (!Array.isArray(spellList)) {
        console.warn('Advertencia: La lista de hechizos proporcionada no es un array. Saltando sección.');
        return 0;
    }
    for (const spell of spellList) {
        const uniqueName = spell["@uniquename"];
        const uiSprite = spell["@uisprite"];
        if (!uniqueName || !uiSprite) continue;
        const iconUrl = `https://render.albiononline.com/v1/spell/${uiSprite}`;
        await prisma.spell.upsert({
            where: { id: uniqueName },
            update: { name: uniqueName, iconUrl: iconUrl },
            create: { id: uniqueName, name: uniqueName, iconUrl: iconUrl },
        });
        count++;
    }
    return count;
}


async function main() {
    console.log(`Start seeding spells from spells.json...`);
    const spellsPath = path.join(__dirname, 'spells.json');
    const fileContent = fs.readFileSync(spellsPath, "utf-8");
    const spellsData = JSON.parse(fileContent);

    let spellContainer = spellsData.spells;
    if (!spellContainer) {
        console.log("No se encontró la clave 'spells' en el nivel superior. Usando el objeto raíz directamente.");
        spellContainer = spellsData;
    } else {
        console.log("Se encontró la clave 'spells' en el nivel superior.");
    }

    if (!spellContainer) {
        throw new Error("El contenedor de hechizos no se pudo encontrar en el archivo JSON.");
    }

    // Limpiamos la tabla usando un comando SQL directo y más robusto
    console.log("Limpiando la tabla de hechizos...");
    await prisma.$executeRawUnsafe('TRUNCATE TABLE `Spell`;');
    console.log("Tabla de hechizos limpiada.");


    let totalCount = 0;
    totalCount += await processSpells(spellContainer.activespell);
    totalCount += await processSpells(spellContainer.passivespell);

    console.log(`Seeding finished. ${totalCount} spells processed.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });