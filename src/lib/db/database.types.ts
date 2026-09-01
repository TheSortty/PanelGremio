export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: number
          occurred_at: string
          profile_id: string
        }
        Insert: {
          id?: never
          occurred_at?: string
          profile_id: string
        }
        Update: {
          id?: never
          occurred_at?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ajustes: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          albion_guild_id: string | null
          albion_guild_name: string | null
          id: boolean
          region: string
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          albion_guild_id?: string | null
          albion_guild_name?: string | null
          id?: boolean
          region?: string
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          albion_guild_id?: string | null
          albion_guild_name?: string | null
          id?: boolean
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "ajustes_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajustes_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          actualizada_en: string
          captura_perfil: string
          captura_stats: string
          contenido: string[]
          cuenta: Database["public"]["Enums"]["tipo_cuenta"]
          discord: string | null
          dispositivo: Database["public"]["Enums"]["dispositivo_juego"]
          edad: number
          enviada_en: string
          gremio_anterior: string | null
          horario: string
          id: string
          profile_id: string
          quien_lo_trajo: string | null
          rol_juego_principal: string
          rol_juego_secundario: string | null
        }
        Insert: {
          actualizada_en?: string
          captura_perfil: string
          captura_stats: string
          contenido?: string[]
          cuenta: Database["public"]["Enums"]["tipo_cuenta"]
          discord?: string | null
          dispositivo: Database["public"]["Enums"]["dispositivo_juego"]
          edad: number
          enviada_en?: string
          gremio_anterior?: string | null
          horario: string
          id?: string
          profile_id: string
          quien_lo_trajo?: string | null
          rol_juego_principal: string
          rol_juego_secundario?: string | null
        }
        Update: {
          actualizada_en?: string
          captura_perfil?: string
          captura_stats?: string
          contenido?: string[]
          cuenta?: Database["public"]["Enums"]["tipo_cuenta"]
          discord?: string | null
          dispositivo?: Database["public"]["Enums"]["dispositivo_juego"]
          edad?: number
          enviada_en?: string
          gremio_anterior?: string | null
          horario?: string
          id?: string
          profile_id?: string
          quien_lo_trajo?: string | null
          rol_juego_principal?: string
          rol_juego_secundario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          details: Json
          id: number
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name: string
          created_at?: string
          details?: Json
          id?: never
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          details?: Json
          id?: never
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      builds: {
        Row: {
          abilities: Json
          author_id: string
          category: string
          consumables: Json
          created_at: string
          description: string | null
          equipment: Json
          guide: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          abilities?: Json
          author_id: string
          category: string
          consumables?: Json
          created_at?: string
          description?: string | null
          equipment?: Json
          guide?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          abilities?: Json
          author_id?: string
          category?: string
          consumables?: Json
          created_at?: string
          description?: string | null
          equipment?: Json
          guide?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "builds_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "builds_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendance: {
        Row: {
          event_id: string
          profile_id: string
          respondido_en: string
          respuesta: Database["public"]["Enums"]["respuesta_evento"]
          rol: string | null
        }
        Insert: {
          event_id: string
          profile_id: string
          respondido_en?: string
          respuesta: Database["public"]["Enums"]["respuesta_evento"]
          rol?: string | null
        }
        Update: {
          event_id?: string
          profile_id?: string
          respondido_en?: string
          respuesta?: Database["public"]["Enums"]["respuesta_evento"]
          rol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actualizado_en: string
          comienza_en: string
          creado_en: string
          creado_por: string | null
          descripcion: string | null
          id: string
          ip_minimo: number | null
          lugar: string | null
          tipo: Database["public"]["Enums"]["tipo_evento"]
          titulo: string
        }
        Insert: {
          actualizado_en?: string
          comienza_en: string
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          id?: string
          ip_minimo?: number | null
          lugar?: string | null
          tipo?: Database["public"]["Enums"]["tipo_evento"]
          titulo: string
        }
        Update: {
          actualizado_en?: string
          comienza_en?: string
          creado_en?: string
          creado_por?: string | null
          descripcion?: string | null
          id?: string
          ip_minimo?: number | null
          lugar?: string | null
          tipo?: Database["public"]["Enums"]["tipo_evento"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fines: {
        Row: {
          emitida_en: string
          emitida_por: string | null
          estado: Database["public"]["Enums"]["estado_multa"]
          id: string
          monto: number
          motivo: string
          profile_id: string
          saldada_en: string | null
        }
        Insert: {
          emitida_en?: string
          emitida_por?: string | null
          estado?: Database["public"]["Enums"]["estado_multa"]
          id?: string
          monto?: number
          motivo: string
          profile_id: string
          saldada_en?: string | null
        }
        Update: {
          emitida_en?: string
          emitida_por?: string | null
          estado?: Database["public"]["Enums"]["estado_multa"]
          id?: string
          monto?: number
          motivo?: string
          profile_id?: string
          saldada_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fines_emitida_por_fkey"
            columns: ["emitida_por"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fines_emitida_por_fkey"
            columns: ["emitida_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_spells: {
        Row: {
          item_id: string
          position: number
          slot: Database["public"]["Enums"]["spell_slot"]
          spell_id: string
        }
        Insert: {
          item_id: string
          position: number
          slot: Database["public"]["Enums"]["spell_slot"]
          spell_id: string
        }
        Update: {
          item_id?: string
          position?: number
          slot?: Database["public"]["Enums"]["spell_slot"]
          spell_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_spells_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_spells_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spells"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          crafting: Json | null
          enchantments: Json
          icon_ok: boolean
          id: string
          item_power: number | null
          name: string
          stats: Json
          tier: number | null
          two_handed: boolean
          type: Database["public"]["Enums"]["item_type"]
        }
        Insert: {
          crafting?: Json | null
          enchantments?: Json
          icon_ok?: boolean
          id: string
          item_power?: number | null
          name: string
          stats?: Json
          tier?: number | null
          two_handed?: boolean
          type: Database["public"]["Enums"]["item_type"]
        }
        Update: {
          crafting?: Json | null
          enchantments?: Json
          icon_ok?: boolean
          id?: string
          item_power?: number | null
          name?: string
          stats?: Json
          tier?: number | null
          two_handed?: boolean
          type?: Database["public"]["Enums"]["item_type"]
        }
        Relationships: []
      }
      map_markers: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          type: Database["public"]["Enums"]["marker_type"]
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          type: Database["public"]["Enums"]["marker_type"]
          x: number
          y: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          type?: Database["public"]["Enums"]["marker_type"]
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_markers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_markers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          last_seen: string
          name: string
          role: Database["public"]["Enums"]["guild_role"]
          status: Database["public"]["Enums"]["user_status"]
          steam_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          last_seen?: string
          name: string
          role?: Database["public"]["Enums"]["guild_role"]
          status?: Database["public"]["Enums"]["user_status"]
          steam_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          last_seen?: string
          name?: string
          role?: Database["public"]["Enums"]["guild_role"]
          status?: Database["public"]["Enums"]["user_status"]
          steam_id?: string | null
        }
        Relationships: []
      }
      routes: {
        Row: {
          author_id: string | null
          created_at: string
          destination: string | null
          id: string
          name: string
          notes: string | null
          origin: string
          steps: Json
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          name: string
          notes?: string | null
          origin: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          name?: string
          notes?: string | null
          origin?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "guild_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spells: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      guild_members: {
        Row: {
          avatar_url: string | null
          id: string | null
          last_seen: string | null
          name: string | null
          online: boolean | null
          role: Database["public"]["Enums"]["guild_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          last_seen?: string | null
          name?: string | null
          online?: never
          role?: Database["public"]["Enums"]["guild_role"] | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          last_seen?: string | null
          name?: string | null
          online?: never
          role?: Database["public"]["Enums"]["guild_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_cambiar_estado: {
        Args: {
          nuevo_estado: Database["public"]["Enums"]["user_status"]
          usuario_id: string
        }
        Returns: {
          avatar_url: string | null
          created_at: string
          id: string
          last_seen: string
          name: string
          role: Database["public"]["Enums"]["guild_role"]
          status: Database["public"]["Enums"]["user_status"]
          steam_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_cambiar_rol: {
        Args: {
          nuevo_rol: Database["public"]["Enums"]["guild_role"]
          usuario_id: string
        }
        Returns: {
          avatar_url: string | null
          created_at: string
          id: string
          last_seen: string
          name: string
          role: Database["public"]["Enums"]["guild_role"]
          status: Database["public"]["Enums"]["user_status"]
          steam_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_eliminar_usuario: {
        Args: { usuario_id: string }
        Returns: undefined
      }
      hechizos_de_item: {
        Args: { item: string }
        Returns: {
          id: string
          name: string
          position: number
          slot: Database["public"]["Enums"]["spell_slot"]
        }[]
      }
      limpiar_mapa: { Args: never; Returns: number }
      metricas_actividad: {
        Args: { zona?: string }
        Returns: {
          conexiones: number
          dia: number
          hora: number
          miembros: string[]
        }[]
      }
      registrar_actividad: { Args: never; Returns: undefined }
      transferir_liderazgo: {
        Args: { nuevo_maestro: string }
        Returns: undefined
      }
    }
    Enums: {
      dispositivo_juego: "PC" | "Móvil" | "Tablet"
      estado_multa: "pendiente" | "pagada" | "perdonada"
      guild_role:
        | "Maestro del Gremio"
        | "Mano Derecha"
        | "Oficial"
        | "Miembro"
        | "Iniciado"
        | "Invitado"
      item_type:
        | "weapon"
        | "offhand"
        | "helmet"
        | "chest"
        | "boots"
        | "cape"
        | "potion"
        | "food"
        | "mount"
        | "bag"
        | "tool"
        | "other"
        | "resource"
        | "fish"
      marker_type: "transport" | "gank" | "objective"
      respuesta_evento: "voy" | "quizas" | "no_voy"
      spell_slot: "Q" | "W" | "E" | "Passive"
      tipo_cuenta: "primera" | "segunda"
      tipo_evento:
        | "ZvZ"
        | "GvG"
        | "Mazmorra"
        | "Recolección"
        | "Faction"
        | "Otro"
      user_status: "pending" | "active" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      dispositivo_juego: ["PC", "Móvil", "Tablet"],
      estado_multa: ["pendiente", "pagada", "perdonada"],
      guild_role: [
        "Maestro del Gremio",
        "Mano Derecha",
        "Oficial",
        "Miembro",
        "Iniciado",
        "Invitado",
      ],
      item_type: [
        "weapon",
        "offhand",
        "helmet",
        "chest",
        "boots",
        "cape",
        "potion",
        "food",
        "mount",
        "bag",
        "tool",
        "other",
        "resource",
        "fish",
      ],
      marker_type: ["transport", "gank", "objective"],
      respuesta_evento: ["voy", "quizas", "no_voy"],
      spell_slot: ["Q", "W", "E", "Passive"],
      tipo_cuenta: ["primera", "segunda"],
      tipo_evento: ["ZvZ", "GvG", "Mazmorra", "Recolección", "Faction", "Otro"],
      user_status: ["pending", "active", "rejected"],
    },
  },
} as const
