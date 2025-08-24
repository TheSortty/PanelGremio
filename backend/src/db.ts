// backend/src/db.ts
import { PrismaClient } from '@prisma/client';

// Esta línea crea la conexión a tu base de datos y la prepara para ser usada en toda tu aplicación.
const prisma = new PrismaClient();

export default prisma;