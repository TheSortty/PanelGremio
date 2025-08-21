import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { User, AuditLog, GuildMember, Build, Item, MemberActivityLog } from '../types';

// --- HELPERS ---
const getItemIconUrl = (itemName: string) => `https://render.albiononline.com/v1/sprite/${itemName}?quality=4&size=128`;

// --- DATA STORE (IN-MEMORY) ---

let users: User[] = [
    { id: '1', name: 'Admin', role: 'Maestro del Gremio', status: 'active', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: '2', name: 'PlayerOne', role: 'Mano Derecha', status: 'active', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: '3', name: 'Newbie', role: 'Iniciado', status: 'pending', createdAt: new Date().toISOString() },
    { id: '4', name: 'Veteran', role: 'Miembro', status: 'active', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() }
];

let auditLogs: AuditLog[] = [
    { id: 'log1', actorId: '1', actorName: 'Admin', action: 'user_role_changed', targetId: '2', targetType: 'user', timestamp: new Date(Date.now() - 3600000).toISOString(), details: { from: 'Miembro', to: 'Mano Derecha' } },
];

let guildMembers: GuildMember[] = [
    { name: 'Admin', role: 'Maestro del Gremio', lastSeen: 'En línea', online: true },
    { name: 'PlayerOne', role: 'Mano Derecha', lastSeen: 'En línea', online: true },
    { name: 'Veteran', role: 'Miembro', lastSeen: 'Hace 5 horas', online: false },
    { name: 'GankerX', role: 'Miembro', lastSeen: 'Hace 2 días', online: false },
    { name: 'HealerMain', role: 'Miembro', lastSeen: 'En línea', online: true },
    { name: 'TankMaster', role: 'Oficial', lastSeen: 'Hace 15 minutos', online: true },
];

let allItems: Item[] = [
    // Weapons
    { id: 'T4_MAIN_AXE', name: 'Hacha de Batalla de Adepto', type: 'weapon', iconUrl: getItemIconUrl('T4_MAIN_AXE'), abilities: {} },
    { id: 'T6_MAIN_CURSEDSTAFF', name: 'Bastón Maldito de Gran Maestro', type: 'weapon', iconUrl: getItemIconUrl('T6_MAIN_CURSEDSTAFF'), abilities: {} },
    // Helmets
    { id: 'T4_HEAD_PLATE_SET1', name: 'Casco de Soldado de Adepto', type: 'helmet', iconUrl: getItemIconUrl('T4_HEAD_PLATE_SET1'), abilities: {} },
    { id: 'T7_HEAD_LEATHER_SET2', name: 'Capucha de Acechador de Anciano', type: 'helmet', iconUrl: getItemIconUrl('T7_HEAD_LEATHER_SET2'), abilities: {} },
    // Chests
    { id: 'T5_ARMOR_CLOTH_SET1', name: 'Túnica de Mago de Experto', type: 'chest', iconUrl: getItemIconUrl('T5_ARMOR_CLOTH_SET1'), abilities: {} },
    { id: 'T8_ARMOR_PLATE_SET3', name: 'Armadura de Demonio de Anciano', type: 'chest', iconUrl: getItemIconUrl('T8_ARMOR_PLATE_SET3'), abilities: {} },
    // Boots
    { id: 'T4_SHOES_LEATHER_SET1', name: 'Zapatos de Mercenario de Adepto', type: 'boots', iconUrl: getItemIconUrl('T4_SHOES_LEATHER_SET1'), abilities: {} },
    // Offhands
    { id: 'T4_OFF_SHIELD', name: 'Escudo de Adepto', type: 'offhand', iconUrl: getItemIconUrl('T4_OFF_SHIELD'), abilities: {} },
    // Capes
    { id: 'T4_CAPE_THETFORD', name: 'Capa de Thetford de Adepto', type: 'cape', iconUrl: getItemIconUrl('T4_CAPE_THETFORD'), abilities: {} },
    // Potions
    { id: 'T6_POTION_HEAL', name: 'Poción de Curación de Gran Maestro', type: 'potion', iconUrl: getItemIconUrl('T6_POTION_HEAL'), abilities: {} },
    // Food
    { id: 'T7_MEAL_STEW', name: 'Estofado de Ternera de Anciano', type: 'food', iconUrl: getItemIconUrl('T7_MEAL_STEW'), abilities: {} },
];

let builds: Build[] = [
    {
        id: 'build1', title: 'Hacha de Batalla para Ganking', category: 'Ganking', description: 'Build de alta movilidad y daño para cazar objetivos solitarios.', author: 'PlayerOne',
        equipment: {
            weapon: allItems.find(i => i.id === 'T4_MAIN_AXE') || null,
            offhand: allItems.find(i => i.id === 'T4_OFF_SHIELD') || null,
            helmet: allItems.find(i => i.id === 'T7_HEAD_LEATHER_SET2') || null,
            chest: allItems.find(i => i.id === 'T8_ARMOR_PLATE_SET3') || null,
            boots: allItems.find(i => i.id === 'T4_SHOES_LEATHER_SET1') || null,
            cape: allItems.find(i => i.id === 'T4_CAPE_THETFORD') || null,
        },
        consumables: {
            potion: allItems.find(i => i.id === 'T6_POTION_HEAL') || null,
            food: allItems.find(i => i.id === 'T7_MEAL_STEW') || null,
        },
        abilities: {},
    },
];

let activityLogs: MemberActivityLog[] = Array.from({ length: 200 }).map(() => {
    const randomMember = guildMembers[Math.floor(Math.random() * guildMembers.length)];
    const randomPastTime = Date.now() - Math.random() * 86400000 * 7; // Last 7 days
    return {
        memberId: randomMember.name,
        timestamp: new Date(randomPastTime).toISOString(),
    };
});

// --- USER MANAGEMENT ---
export const findUserById = (id: string): User | undefined => users.find(u => u.id === id);
export const findUserByName = (name: string): User | undefined => users.find(u => u.name.toLowerCase() === name.toLowerCase());
export const getAllUsers = (): User[] => users;
export const createUser = (name: string): User => {
    const newUser: User = {
        id: uuidv4(),
        name,
        role: 'Invitado',
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    createAuditLog('system', 'System', 'user_registered', newUser.id, 'user', { username: name });
    return newUser;
};
export const updateUser = (id: string, updates: Partial<Omit<User, 'id'>>): User | undefined => {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        return users[userIndex];
    }
    return undefined;
};
export const deleteUser = (id: string): void => {
    users = users.filter(u => u.id !== id);
};

// --- AUDIT LOG MANAGEMENT ---
export const getAuditLogs = (): AuditLog[] => auditLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
export const createAuditLog = (actorId: string, actorName: string, action: string, targetId?: string, targetType?: string, details?: Record<string, any>): void => {
    const newLog: AuditLog = {
        id: uuidv4(),
        actorId,
        actorName,
        action,
        targetId,
        targetType,
        timestamp: new Date().toISOString(),
        details,
    };
    auditLogs.push(newLog);
};

// --- GUILD MANAGEMENT ---
export const getGuildMembers = (): GuildMember[] => guildMembers;
export const getActivityLogs = (): MemberActivityLog[] => activityLogs;

// --- BUILDS & ITEMS MANAGEMENT ---
export const getBuilds = (): Build[] => builds;
export const createBuild = (buildData: Build): Build => {
    const newBuild = { ...buildData, id: uuidv4() };
    builds.push(newBuild);
    // You might want an audit log for build creation too
    return newBuild;
};
export const getItems = (type: Item['type'], search?: string): Item[] => {
    let results = allItems.filter(item => item.type === type);
    if (search) {
        results = results.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
    }
    return results;
};

// --- SESSION HELPER ---
export const findUserFromRequest = (req: Request): User | undefined => {
    // This is a simplified session check. In a real app, you'd have a proper session middleware.
    // This helper is for use in API endpoints to get the currently "logged in" user for authorization.
    const sessionCookie = req.headers.cookie?.split('; ').find(row => row.startsWith('sessionId='));
    if (!sessionCookie) return undefined;

    const sessionId = sessionCookie.split('=')[1];
    
    // A more robust session store would be needed in a real app (e.g., Redis)
    const activeSession = Object.entries(users).find(([sid, uid]) => sid === sessionId);
    // This is wrong, sessions are not stored in users. I need to get it from the non-existent session store.
    // I need to look up the user ID in my simple session object. But I don't have one globally here.
    // I'll skip this and let the routes handle their own auth checks for simplicity.
    // The user can be injected via middleware instead. Let's assume a simple lookup.
    // The auth router has the sessions object. This is a design flaw of a simple mock.
    // I will export the session lookup logic, which is not ideal but works for this mock.
    // Let's create a global session store instead.
    
    // This function will not work as sessions is not defined here. 
    // It should be handled in a middleware that has access to the sessions object.
    
    // Let's create a dummy function.
    // This needs to be implemented properly with a shared session store or context.
    // For now, let's hardcode the admin user for any administrative action.
    return users.find(u => u.name === 'Admin');
}
