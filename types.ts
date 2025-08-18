
export interface GuildMember {
  name: string;
  role: 'Maestro del Gremio' | 'Mano Derecha' | 'Oficial' | 'Miembro' | 'Iniciado' | 'Invitado';
  lastSeen: string;
  online: boolean;
}

export interface Item {
  id: string;
  name:string;
  type: 'weapon' | 'offhand' | 'helmet' | 'chest' | 'boots' | 'cape' | 'potion' | 'food';
  iconUrl: string;
  abilities: { [key: string]: Ability[] };
}

export interface Ability {
  id: string;
  name: string;
  iconUrl: string;
}

export interface Build {
  id: string;
  title: string;
  category: string;
  description: string;
  author: string;
  equipment: {
      weapon: Item | null;
      offhand: Item | null;
      helmet: Item | null;
      chest: Item | null;
      boots: Item | null;
      cape: Item | null;
  };
  consumables: {
      potion: Item | null;
      food: Item | null;
  };
  abilities: {
    [slot: string]: Ability | null;
  };
  aiGuide?: string;
}

export interface MemberActivityLog {
  memberId: string;
  timestamp: string; // ISO 8601 format
}

export interface User {
  id: string; // SteamID64 or internal ID
  name: string;
  avatarUrl?: string; 
  role: GuildMember['role'];
  status: 'pending' | 'active' | 'rejected';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetId?: string;
  targetType?: string;
  timestamp: string;
  details?: Record<string, any>;
}
