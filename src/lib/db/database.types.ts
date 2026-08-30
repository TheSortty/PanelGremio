/**
 * Tipos de la base de datos.
 *
 * Escritos a mano para espejar supabase/migrations/. En cuanto tengas el
 * proyecto linkeado, regeneralos desde la base real para que no haya deriva:
 *
 *     npm run db:types
 *
 * Ese comando sobrescribe este archivo con la salida de
 * `supabase gen types typescript --linked`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          role: Database['public']['Enums']['guild_role']
          status: Database['public']['Enums']['user_status']
          steam_id: string | null
          created_at: string
          last_seen: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          role?: Database['public']['Enums']['guild_role']
          status?: Database['public']['Enums']['user_status']
          steam_id?: string | null
          created_at?: string
          last_seen?: string
        }
        Update: {
          name?: string
          avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      builds: {
        Row: {
          id: string
          title: string
          category: string
          description: string | null
          author_id: string
          equipment: Json
          consumables: Json
          abilities: Json
          ai_guide: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          category: string
          description?: string | null
          author_id: string
          equipment?: Json
          consumables?: Json
          abilities?: Json
          ai_guide?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          category?: string
          description?: string | null
          equipment?: Json
          consumables?: Json
          abilities?: Json
          ai_guide?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'builds_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          id: number
          actor_id: string | null
          actor_name: string
          action: string
          target_id: string | null
          target_type: string | null
          details: Json
          created_at: string
        }
        Insert: {
          actor_id?: string | null
          actor_name: string
          action: string
          target_id?: string | null
          target_type?: string | null
          details?: Json
          created_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: 'audit_logs_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      activity_logs: {
        Row: {
          id: number
          profile_id: string
          occurred_at: string
        }
        Insert: {
          profile_id: string
          occurred_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: 'activity_logs_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      items: {
        Row: {
          id: string
          name: string
          type: Database['public']['Enums']['item_type']
          icon_url: string
        }
        Insert: {
          id: string
          name: string
          type: Database['public']['Enums']['item_type']
          icon_url: string
        }
        Update: {
          name?: string
          type?: Database['public']['Enums']['item_type']
          icon_url?: string
        }
        Relationships: []
      }
      spells: {
        Row: {
          id: string
          name: string
          icon_url: string
        }
        Insert: {
          id: string
          name: string
          icon_url: string
        }
        Update: {
          name?: string
          icon_url?: string
        }
        Relationships: []
      }
      item_spells: {
        Row: {
          item_id: string
          spell_id: string
          slot: Database['public']['Enums']['spell_slot']
          position: number
        }
        Insert: {
          item_id: string
          spell_id: string
          slot: Database['public']['Enums']['spell_slot']
          position: number
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: 'item_spells_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'item_spells_spell_id_fkey'
            columns: ['spell_id']
            isOneToOne: false
            referencedRelation: 'spells'
            referencedColumns: ['id']
          },
        ]
      }
      map_markers: {
        Row: {
          id: string
          x: number
          y: number
          type: Database['public']['Enums']['marker_type']
          label: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          x: number
          y: number
          type: Database['public']['Enums']['marker_type']
          label?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'map_markers_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      guild_members: {
        Row: {
          id: string | null
          name: string | null
          avatar_url: string | null
          role: Database['public']['Enums']['guild_role'] | null
          last_seen: string | null
          online: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      registrar_actividad: {
        Args: Record<string, never>
        Returns: undefined
      }
      admin_cambiar_rol: {
        Args: {
          usuario_id: string
          nuevo_rol: Database['public']['Enums']['guild_role']
        }
        Returns: Database['public']['Tables']['profiles']['Row']
      }
      admin_cambiar_estado: {
        Args: {
          usuario_id: string
          nuevo_estado: Database['public']['Enums']['user_status']
        }
        Returns: Database['public']['Tables']['profiles']['Row']
      }
      admin_eliminar_usuario: {
        Args: { usuario_id: string }
        Returns: undefined
      }
      hechizos_de_item: {
        Args: { item: string }
        Returns: {
          slot: Database['public']['Enums']['spell_slot']
          id: string
          name: string
          icon_url: string
          position: number
        }[]
      }
    }
    Enums: {
      guild_role:
        | 'Maestro del Gremio'
        | 'Mano Derecha'
        | 'Oficial'
        | 'Miembro'
        | 'Iniciado'
        | 'Invitado'
      user_status: 'pending' | 'active' | 'rejected'
      item_type:
        | 'weapon'
        | 'offhand'
        | 'helmet'
        | 'chest'
        | 'boots'
        | 'cape'
        | 'potion'
        | 'food'
        | 'mount'
        | 'bag'
        | 'tool'
        | 'other'
      spell_slot: 'Q' | 'W' | 'E' | 'Passive'
      marker_type: 'transport' | 'gank' | 'objective'
    }
    CompositeTypes: Record<string, never>
  }
}

// --- Atajos ------------------------------------------------------------------

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']

export type Enums<T extends keyof PublicSchema['Enums']> =
  PublicSchema['Enums'][T]
