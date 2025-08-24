// services/localDbService.ts

import { User, AuditLog, GuildMember, Build, Item, MemberActivityLog } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

// --- Wrapper de Fetch con Credenciales ---
// Esta función centraliza todas las llamadas a la API y se asegura
// de que las cookies de sesión siempre se envíen.
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    // Añadimos 'credentials: include' a todas las peticiones por defecto.
    const defaultOptions: RequestInit = {
        ...options,
        credentials: 'include', // ¡LA LÍNEA MÁGICA!
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Error en la petición a la API');
    }
    return response.json();
}


// --- Autenticación ---
export const checkSession = (): Promise<User> => apiFetch<User>(`${API_BASE_URL}/auth/session`);
export const login = (username: string): Promise<User> => apiFetch<User>(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username }),
});
export const register = (username: string): Promise<User> => apiFetch<User>(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username }),
});
export const logout = (): Promise<{ message: string }> => apiFetch<{ message: string }>(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
export const loginAsAdmin = (): Promise<User> => apiFetch<User>(`${API_BASE_URL}/auth/login-admin-test`, { method: 'POST' });


// --- Administración de Usuarios ---
export const getUsers = (): Promise<User[]> => apiFetch<User[]>(`${API_BASE_URL}/users`);
export const updateUser = (id: string, updates: Partial<Omit<User, 'id'>>): Promise<User> => apiFetch<User>(`${API_BASE_URL}/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
});
export const deleteUser = (id: string): Promise<{ message: string }> => apiFetch<{ message: string }>(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });


// --- Builds ---
export const getBuilds = (): Promise<Build[]> => apiFetch<Build[]>(`${API_BASE_URL}/builds`);
export const createBuild = (build: Build): Promise<Build> => apiFetch<Build>(`${API_BASE_URL}/builds`, {
    method: 'POST',
    body: JSON.stringify(build),
});


// --- Items ---
export const getItems = (params: { type: Item['type'], search: string }): Promise<Item[]> => {
    const query = new URLSearchParams({ type: params.type, search: params.search }).toString();
    return apiFetch<Item[]>(`${API_BASE_URL}/items?${query}`);
};


// --- Gremio ---
export const getGuildMembers = (): Promise<GuildMember[]> => apiFetch<GuildMember[]>(`${API_BASE_URL}/guild/members`);
export const getActivityLogs = (): Promise<MemberActivityLog[]> => apiFetch<MemberActivityLog[]>(`${API_BASE_URL}/guild/activity`);


// --- Auditoría ---
export const getAuditLogs = (): Promise<AuditLog[]> => apiFetch<AuditLog[]>(`${API_BASE_URL}/admin/logs`);