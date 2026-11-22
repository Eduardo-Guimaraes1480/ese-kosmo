// =============================================================================
// ESE KOSMO — TIPOS CANÔNICOS DE DOMÍNIO E SCHEMA (MIGRATION 001 CONSOLIDADA)
// =============================================================================

export type PlanType = 'free' | 'pro' | 'ultra';

export type ActionType =
  | 'diaria'
  | 'fazer'
  | 'meta'
  | 'boss'
  | 'problema'
  | 'conquista';

export type ActionStatus = 'pendente' | 'em_andamento' | 'concluido' | 'falha';

export type ManagementStatus =
  | 'nao_definido'
  | 'nao_resolvido'
  | 'pausado'
  | 'em_andamento'
  | 'concluido'
  | 'atrasado'
  | 'transferido';

export type ImpactDegree = 'pequeno' | 'moderado' | 'alto';

export type VisibilityType = 'privado' | 'publico' | 'amigos' | 'equipe';

export type PenaltyType = 'hp_only' | 'xp' | 'ese' | 'pilar' | 'radar';

export type RequirementOrigin = 'created' | 'referenced';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'once';

// ── Perfil do Usuário (public.profiles) ──────────────────────────────────────

export interface Profile {
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
  plano: PlanType;
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;

// ── Ações (public.actions) ───────────────────────────────────────────────────

export interface Action {
  // 15 Colunas Originais (Preservadas)
  id: string;
  user_id: string;
  title: string;
  type: ActionType | string;
  xp_reward: number;
  ese_reward: number;
  status: ActionStatus | string;
  order_index: number;
  created_at: string;
  description: string | null;
  pillar: string | null;
  sacrifice_priority: string | null;
  pilar_impact: number | null;
  radar_impact: number | null;
  completed_at: string | null;

  // 17 Novas Colunas Confirmadas (Migration 001)
  management_status: ManagementStatus;
  due_date: string | null;
  start_date: string | null;
  impact_degree: ImpactDegree;
  level_jump: number;
  unlocked_vocation: string | null;
  is_system: boolean;
  penalty_active: boolean;
  penalty_hp: number;
  penalty_type: PenaltyType | string | null;
  penalty_value: number;
  penalty_applied: boolean;
  penalty_applied_at: string | null;
  is_shared: boolean;
  visibility: VisibilityType | string;
}

export type ActionInsert = Omit<Action, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
  management_status?: ManagementStatus;
  impact_degree?: ImpactDegree;
  level_jump?: number;
  is_system?: boolean;
  penalty_active?: boolean;
  penalty_hp?: number;
  penalty_value?: number;
  penalty_applied?: boolean;
  is_shared?: boolean;
  visibility?: VisibilityType | string;
};

export type ActionUpdate = Partial<Omit<Action, 'id' | 'user_id' | 'created_at'>>;

// ── Subtarefas Simples (public.action_subtasks) ───────────────────────────────

export interface ActionSubtask {
  id: string;
  action_id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
}

export type ActionSubtaskInsert = Omit<ActionSubtask, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
  is_completed?: boolean;
  order_index?: number;
};

export type ActionSubtaskUpdate = Partial<Omit<ActionSubtask, 'id' | 'action_id' | 'user_id' | 'created_at'>>;

// ── Requisitos Referenciados N:N (public.action_requirements) ────────────────

export interface ActionRequirement {
  id: string;
  parent_action_id: string;
  req_action_id: string;
  user_id: string;
  origin: RequirementOrigin;
  order_index: number;
  created_at: string;
}

export type ActionRequirementInsert = Omit<ActionRequirement, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
  origin?: RequirementOrigin;
  order_index?: number;
};

export type ActionRequirementUpdate = Partial<Pick<ActionRequirement, 'order_index' | 'origin'>>;

// ── Recorrências e Agendamentos (public.action_schedules) ─────────────────────

export interface ActionSchedule {
  id: string;
  action_id: string;
  user_id: string;
  frequency_type: FrequencyType;
  days_of_week: number[] | null;
  days_of_month: number[] | null;
  times_of_day: string[] | null;
  duration_minutes: number | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export type ActionScheduleInsert = Omit<ActionSchedule, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
  start_date?: string;
};

export type ActionScheduleUpdate = Partial<Omit<ActionSchedule, 'id' | 'action_id' | 'user_id' | 'created_at'>>;

// ── Pilares (public.pillars) ─────────────────────────────────────────────────

export interface Pillar {
  id: string;
  user_id: string;
  name: string;
  level: number;
  progress: number;
  color: string;
  created_at: string;
}

export type PillarInsert = Omit<Pillar, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type PillarUpdate = Partial<Omit<Pillar, 'id' | 'user_id' | 'created_at'>>;

// ── Gráfico de Sacrifícios (public.grafico_sacrificios) ──────────────────────

export interface GraficoSacrificio {
  id: string;
  user_id: string;
  prioridade: string;
  valor: number;
  atualizado: string;
}

// ── Notificações (public.notifications) ──────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

// ── Utilitários de Domínio ───────────────────────────────────────────────────

/**
 * Determina se uma ação está em atraso com base na data de vencimento e no status real.
 */
export function isActionOverdue(action: Pick<Action, 'due_date' | 'status'>): boolean {
  if (!action.due_date) return false;
  if (action.status === 'concluido') return false;
  return new Date(action.due_date).getTime() < Date.now();
}

/**
 * Retorna o status gerencial efetivo para exibição visual.
 * Se a ação estiver vencida e não concluída, projeta 'atrasado' sem alterar o banco.
 */
export function getEffectiveManagementStatus(
  action: Pick<Action, 'due_date' | 'status' | 'management_status'>
): ManagementStatus {
  if (isActionOverdue(action)) {
    return 'atrasado';
  }
  return action.management_status || 'nao_definido';
}

// ── Tipos de Planos e Limites (Fase 7) ────────────────────────────────────────

export type PlanPeriod = 'daily' | 'monthly' | 'total';

export interface PlanTypeUsageItem {
  used: number;
  limit: number | null; // null se ilimitado (Pro/Ultra)
  period: PlanPeriod;
  percentage?: number;
  isNearLimit?: boolean;   // >= 80%
  isLimitReached?: boolean; // >= 100%
}

export interface PlanFeatures {
  pomodoro: boolean;
  boost: boolean;
  humor: boolean;
  unlimited_database: boolean;
  ai_assistant: boolean;
}

export interface UserPlanInfo {
  plan: PlanType;
  is_unlimited: boolean;
  usage: {
    diaria: PlanTypeUsageItem;
    fazer: PlanTypeUsageItem;
    meta: PlanTypeUsageItem;
    boss: PlanTypeUsageItem;
    problema: PlanTypeUsageItem;
    conquista: PlanTypeUsageItem;
    folders: PlanTypeUsageItem;
    history: {
      limit: number | null; // 15 no Free, null no Pro/Ultra
    };
  };
  features: PlanFeatures;
}

