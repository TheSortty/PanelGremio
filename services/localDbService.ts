// NOTA: Este archivo ha sido reutilizado para centralizar las llamadas a la API del backend.
// Se recomienda encarecidamente renombrar este archivo a `apiService.ts`.

import { User, AuditLog, GuildMember, Build, Item, MemberActivityLog } from '../types';

// Helper para manejar las respuestas de fetch
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Error en la petición a la API');
    }
    return response.json();
}

// --- Autenticación ---

export const checkSession = (): Promise<User> => fetch('/api/auth/session').then(res => handleResponse<User>(res));
export const login = (username: string): Promise<User> => fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
}).then(res => handleResponse<User>(res));
export const register = (username: string): Promise<User> => fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
}).then(res => handleResponse<User>(res));
export const logout = (): Promise<{ message: string }> => fetch('/api/auth/logout', { method: 'POST' }).then(res => handleResponse<{ message: string }>(res));
export const loginAsAdmin = (): Promise<User> => fetch('/api/auth/login-admin-test', { method: 'POST' }).then(res => handleResponse<User>(res));

// --- Administración de Usuarios ---

export const getUsers = (): Promise<User[]> => fetch('/api/users').then(res => handleResponse<User[]>(res));
export const updateUser = (id: string, updates: Partial<Omit<User, 'id'>>): Promise<User> => fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
}).then(res => handleResponse<User>(res));
export const deleteUser = (id: string): Promise<{ message: string }> => fetch(`/api/users/${id}`, { method: 'DELETE' }).then(res => handleResponse<{ message: string }>(res));

// --- Builds ---

export const getBuilds = (): Promise<Build[]> => fetch('/api/builds').then(res => handleResponse<Build[]>(res));
export const createBuild = (build: Build): Promise<Build> => fetch('/api/builds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(build),
}).then(res => handleResponse<Build>(res));

// --- Items ---

export const getItems = (params: { type: Item['type'], search: string }): Promise<Item[]> => {
    const query = new URLSearchParams({ type: params.type, search: params.search }).toString();
    return fetch(`/api/items?${query}`).then(res => handleResponse<Item[]>(res));
};

// --- Gremio ---

export const getGuildMembers = (): Promise<GuildMember[]> => fetch('/api/guild/members').then(res => handleResponse<GuildMember[]>(res));
export const getActivityLogs = (): Promise<MemberActivityLog[]> => fetch('/api/guild/activity').then(res => handleResponse<MemberActivityLog[]>(res));

// --- Auditoría ---

export const getAuditLogs = (): Promise<AuditLog[]> => fetch('/api/admin/logs').then(res => handleResponse<AuditLog[]>(res));