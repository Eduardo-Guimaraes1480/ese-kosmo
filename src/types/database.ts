// =============================================================================
// ESE KOSMO — DEFINIÇÕES DE TABELAS SUPABASE (MIGRATION 001)
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          vocation: string | null;
          level: number;
          xp: number;
          hp: number;
          ese_balance: number;
          avatar_url: string | null;
          created_at: string;
          offensive_days: number;
          last_active_date: string | null;
          plano: 'free' | 'pro' | 'ultra';
        };
        Insert: {
          id: string;
          nickname?: string | null;
          vocation?: string | null;
          level?: number;
          xp?: number;
          hp?: number;
          ese_balance?: number;
          avatar_url?: string | null;
          created_at?: string;
          offensive_days?: number;
          last_active_date?: string | null;
          plano?: 'free' | 'pro' | 'ultra';
        };
        Update: {
          id?: string;
          nickname?: string | null;
          vocation?: string | null;
          level?: number;
          xp?: number;
          hp?: number;
          ese_balance?: number;
          avatar_url?: string | null;
          created_at?: string;
          offensive_days?: number;
          last_active_date?: string | null;
          plano?: 'free' | 'pro' | 'ultra';
        };
        Relationships: [];
      };
      actions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: string;
          xp_reward: number;
          ese_reward: number;
          status: string;
          order_index: number;
          created_at: string;
          description: string | null;
          pillar: string | null;
          sacrifice_priority: string | null;
          pilar_impact: number | null;
          radar_impact: number | null;
          completed_at: string | null;
          management_status: string;
          due_date: string | null;
          start_date: string | null;
          impact_degree: string;
          level_jump: number;
          unlocked_vocation: string | null;
          is_system: boolean;
          penalty_active: boolean;
          penalty_hp: number;
          penalty_type: string | null;
          penalty_value: number;
          penalty_applied: boolean;
          penalty_applied_at: string | null;
          is_shared: boolean;
          visibility: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          type?: string;
          xp_reward?: number;
          ese_reward?: number;
          status?: string;
          order_index?: number;
          created_at?: string;
          description?: string | null;
          pillar?: string | null;
          sacrifice_priority?: string | null;
          pilar_impact?: number | null;
          radar_impact?: number | null;
          completed_at?: string | null;
          management_status?: string;
          due_date?: string | null;
          start_date?: string | null;
          impact_degree?: string;
          level_jump?: number;
          unlocked_vocation?: string | null;
          is_system?: boolean;
          penalty_active?: boolean;
          penalty_hp?: number;
          penalty_type?: string | null;
          penalty_value?: number;
          penalty_applied?: boolean;
          penalty_applied_at?: string | null;
          is_shared?: boolean;
          visibility?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: string;
          xp_reward?: number;
          ese_reward?: number;
          status?: string;
          order_index?: number;
          created_at?: string;
          description?: string | null;
          pillar?: string | null;
          sacrifice_priority?: string | null;
          pilar_impact?: number | null;
          radar_impact?: number | null;
          completed_at?: string | null;
          management_status?: string;
          due_date?: string | null;
          start_date?: string | null;
          impact_degree?: string;
          level_jump?: number;
          unlocked_vocation?: string | null;
          is_system?: boolean;
          penalty_active?: boolean;
          penalty_hp?: number;
          penalty_type?: string | null;
          penalty_value?: number;
          penalty_applied?: boolean;
          penalty_applied_at?: string | null;
          is_shared?: boolean;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "actions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      action_subtasks: {
        Row: {
          id: string;
          action_id: string;
          user_id: string;
          title: string;
          is_completed: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          action_id: string;
          user_id: string;
          title: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          action_id?: string;
          user_id?: string;
          title?: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "action_subtasks_action_id_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_subtasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      action_requirements: {
        Row: {
          id: string;
          parent_action_id: string;
          req_action_id: string;
          user_id: string;
          origin: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_action_id: string;
          req_action_id: string;
          user_id: string;
          origin?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_action_id?: string;
          req_action_id?: string;
          user_id?: string;
          origin?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "action_requirements_parent_fkey";
            columns: ["parent_action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_requirements_req_fkey";
            columns: ["req_action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_requirements_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      action_schedules: {
        Row: {
          id: string;
          action_id: string;
          user_id: string;
          frequency_type: string;
          days_of_week: number[] | null;
          days_of_month: number[] | null;
          times_of_day: string[] | null;
          duration_minutes: number | null;
          start_date: string;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action_id: string;
          user_id: string;
          frequency_type: string;
          days_of_week?: number[] | null;
          days_of_month?: number[] | null;
          times_of_day?: string[] | null;
          duration_minutes?: number | null;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action_id?: string;
          user_id?: string;
          frequency_type?: string;
          days_of_week?: number[] | null;
          days_of_month?: number[] | null;
          times_of_day?: string[] | null;
          duration_minutes?: number | null;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "action_schedules_action_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_schedules_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      pillars: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          level: number;
          progress: number;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          level?: number;
          progress?: number;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          level?: number;
          progress?: number;
          color?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pillars_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      grafico_sacrificios: {
        Row: {
          id: string;
          user_id: string;
          prioridade: string;
          valor: number;
          atualizado: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prioridade: string;
          valor?: number;
          atualizado?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prioridade?: string;
          valor?: number;
          atualizado?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grafico_sacrificios_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      action_folders: {
        Row: {
          id: string;
          user_id: string;
          parent_folder_id: string | null;
          name: string;
          color: string;
          icon: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          parent_folder_id?: string | null;
          name: string;
          color?: string;
          icon?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          parent_folder_id?: string | null;
          name?: string;
          color?: string;
          icon?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "action_folders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_folders_parent_folder_id_fkey";
            columns: ["parent_folder_id"];
            isOneToOne: false;
            referencedRelation: "action_folders";
            referencedColumns: ["id"];
          }
        ];
      };
      action_folder_items: {
        Row: {
          id: string;
          folder_id: string;
          action_id: string;
          user_id: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          folder_id: string;
          action_id: string;
          user_id: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          folder_id?: string;
          action_id?: string;
          user_id?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "action_folder_items_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "action_folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_folder_items_action_id_fkey";
            columns: ["action_id"];
            isOneToOne: false;
            referencedRelation: "actions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "action_folder_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      protect_profile_plan: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      prevent_requirement_keys_mutation: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      prevent_folder_cycle: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      check_folder_item_user_match: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      calculate_level_from_xp: {
        Args: { p_xp: number };
        Returns: number;
      };
      complete_action: {
        Args: { p_action_id: string };
        Returns: Json;
      };
      reopen_action: {
        Args: { p_action_id: string };
        Returns: Json;
      };
      apply_penalty: {
        Args: { p_action_id: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

