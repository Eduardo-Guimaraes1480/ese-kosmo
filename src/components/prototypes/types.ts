export type ActionType =
  | 'diaria'
  | 'fazer'
  | 'meta'
  | 'boss'
  | 'problema'
  | 'conquista';

export type ManagementStatus =
  | 'nao_definido'
  | 'nao_resolvido'
  | 'pausado'
  | 'em_andamento'
  | 'concluido'
  | 'atrasado'
  | 'transferido';

export type SacrificePriority =
  | 'Saúde'
  | 'Família'
  | 'Social'
  | 'Trabalho'
  | 'Estudos';

export type ReferenceCategory = 'nenhum' | 'meta' | 'boss' | 'conquista';

export type ViewMode = 'tabela' | 'calendario' | 'cronologia';

export type ChronologySubMode = 'horario' | 'manual';

export type HubSection = 'hub' | 'explorer' | 'workspace';

export type HubFilterType =
  | 'todas'
  | 'diaria'
  | 'fazer'
  | 'meta'
  | 'conquista'
  | 'boss'
  | 'problema'
  | 'historico';

export interface FrequencyConfig {
  diariaTimes: string[];
  semanalDays: string[];
  mensalDays: string[];
  timeStart?: string;
  timeEnd?: string;
  timeExpectation?: string;
  occurrenceLabel?: string;
}

export interface LinkedRequirement {
  id: string;
  title: string;
  description?: string;
  xp_reward: number;
  ese_reward: number;
  timeLabel?: string;
  done: boolean;
  source: 'criado' | 'referenciado';
  linkedActionId?: string;
}

export interface PenaltyConfig {
  xp_loss: number;
  ese_loss: number;
  pilar_loss: number;
  radar_loss: number;
}

export interface SimpleSubtask {
  id: string;
  title: string;
  is_completed: boolean;
  order_index?: number;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: ActionType;
  status: 'pendente' | 'concluido';
  management_status: ManagementStatus;
  pillars: string[];
  sacrifice_priorities: SacrificePriority[];
  xp_reward: number;
  ese_reward: number;
  pilar_impact: number;
  radar_impact: number;
  due_date: string;
  due_time: string;
  folderIds: string[];
  order_index: number;
  reference_type?: ReferenceCategory;
  reference_id?: string | null;
  reference_title?: string | null;
  frequency?: FrequencyConfig;
  requirements?: LinkedRequirement[];
  subtasks?: SimpleSubtask[];
  penalties?: PenaltyConfig;
  penalty_active?: boolean;
  penalty_applied?: boolean;
  new_vocation?: string;
  vocation_bonus?: string;
  vocation_icon?: 'code' | 'brain' | 'coins' | 'sparkles' | 'trophy' | 'flame';
  completed_at?: string | null;
  created_at: string;
}

export interface ActionFolder {
  id: string;
  user_id: string;
  parent_folder_id: string | null;
  name: string;
  color: string;   // era accentHex — alinhado com DB
  icon: string;    // ex: 'folder', 'star', 'code'
  order_index: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  read: boolean;
  category: 'boss' | 'streak' | 'social' | 'folder' | 'milestone';
}

export interface ActionDraftTab {
  tabId: string;
  sourceActionId: string | null;
  isDirty: boolean;
  type: ActionType;
  title: string;
  description: string;
  managementStatus: ManagementStatus;
  selectedPillars: string[];
  selectedSacrifices: SacrificePriority[];
  dueDate: string;
  dueTime: string;
  folderIds: string[];
  refCategory: ReferenceCategory;
  refSearch: string;
  selectedRefId: string | null;
  diariaTimes: string[];
  semanalDays: string[];
  mensalDays: string[];
  timeMode: 'range' | 'expectation';
  timeStart: string;
  timeEnd: string;
  timeExpectation: string;
  requirements: LinkedRequirement[];
  subtasks?: SimpleSubtask[];
  newVocation: string;
  xpReward: number;
  eseReward: number;
  pilarImpact: number;
  radarImpact: number;
  lossXp: number;
  lossEse: number;
  lossPilar: number;
  lossRadar: number;
}

export interface PillarOption {
  id: string;
  name: string;
  colorClass: string;
  hex: string;
  level: number;
  progress: number;
}

export interface UserPersonaStats {
  nickname: string;
  vocacao: string;
  level: number;
  xp_total: number;
  ese_total: number;
  hp: number;
  streak_days: number;
}

export interface StatusMeta {
  id: ManagementStatus;
  label: string;
  shortLabel: string;
  dotClass: string;
  ringClass: string;
  textClass: string;
  badgeClass: string;
  hex: string;
  description: string;
}

export const MANAGEMENT_STATUS_MAP: Record<ManagementStatus, StatusMeta> = {
  nao_definido: {
    id: 'nao_definido',
    label: 'Não definido',
    shortLabel: 'Não def.',
    dotClass: 'bg-gray-300',
    ringClass: 'ring-gray-300/30',
    textClass: 'text-gray-300',
    badgeClass: 'bg-gray-300/10 text-gray-300 border-gray-300/30',
    hex: '#D1D5DB',
    description:
      'Quando não é selecionado nenhum status fica na cor cinza claro, ou não foi ativado (sem necessidade) da função status.',
  },
  nao_resolvido: {
    id: 'nao_resolvido',
    label: 'Não resolvido',
    shortLabel: 'Não resol.',
    dotClass: 'bg-orange-500',
    ringClass: 'ring-orange-500/30',
    textClass: 'text-orange-400',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    hex: '#F97316',
    description:
      'Quando é ativada a função status vem por padrão com a cor laranja constando "Não resolvido", mostrando que ainda vai ser feito (Urgente/Importante).',
  },
  pausado: {
    id: 'pausado',
    label: 'Pausado/Futuro',
    shortLabel: 'Pausado',
    dotClass: 'bg-purple-500',
    ringClass: 'ring-purple-500/30',
    textClass: 'text-purple-400',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    hex: '#A855F7',
    description:
      'Tarefa não urgente mas importante, registrada na cor roxa para ser praticada futuramente ou retomada após pausa.',
  },
  em_andamento: {
    id: 'em_andamento',
    label: 'Em andamento',
    shortLabel: 'Andamento',
    dotClass: 'bg-blue-500',
    ringClass: 'ring-blue-500/30',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    hex: '#3B82F6',
    description:
      'Quando inicia uma tarefa que exige tempo para ser finalizada, alterada para azul indicando desenvolvimento ativo.',
  },
  concluido: {
    id: 'concluido',
    label: 'Concluído',
    shortLabel: 'Concluído',
    dotClass: 'bg-green-500',
    ringClass: 'ring-green-500/30',
    textClass: 'text-green-400',
    badgeClass: 'bg-green-500/15 text-green-300 border-green-500/30',
    hex: '#22C55E',
    description:
      'Significa que a atividade já foi concluída, pronta para o check final na caixa de verificação.',
  },
  atrasado: {
    id: 'atrasado',
    label: 'Atrasado/Pendente',
    shortLabel: 'Atrasado',
    dotClass: 'bg-red-500',
    ringClass: 'ring-red-500/30',
    textClass: 'text-red-400',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    hex: '#EF4444',
    description:
      'Ativa automaticamente ao ultrapassar o prazo de dia/hora estipulado, deixando evidente que a tarefa está atrasada.',
  },
  transferido: {
    id: 'transferido',
    label: 'Transferido',
    shortLabel: 'Transferido',
    dotClass: 'bg-yellow-400 ring-2 ring-cyan-400/70',
    ringClass: 'ring-cyan-400/40',
    textClass: 'text-yellow-300',
    badgeClass: 'bg-yellow-400/15 text-yellow-200 border-cyan-400/40',
    hex: '#EAB308',
    description:
      'Assumida por uma pessoa numa equipe e transferida para outro membro dar continuidade e finalizar.',
  },
};

export interface TypeLimits {
  xpMin: number;
  xpMax: number;
  eseMin: number;
  eseMax: number;
  pilarImpactMin: number;
  pilarImpactMax: number;
  radarImpactMin: number;
  radarImpactMax: number;
  hasPenalties: boolean;
  lossXpMin?: number;
  lossXpMax?: number;
  lossEseMin?: number;
  lossEseMax?: number;
  lossPilarMin?: number;
  lossPilarMax?: number;
  lossRadarMin?: number;
  lossRadarMax?: number;
}

export const ACTION_TYPE_LIMITS: Record<ActionType, TypeLimits> = {
  fazer: {
    xpMin: 1,
    xpMax: 25,
    eseMin: 0,
    eseMax: 10,
    pilarImpactMin: 0,
    pilarImpactMax: 1,
    radarImpactMin: 0,
    radarImpactMax: 1,
    hasPenalties: false,
  },
  diaria: {
    xpMin: 1,
    xpMax: 10,
    eseMin: 0,
    eseMax: 5,
    pilarImpactMin: 0,
    pilarImpactMax: 2.5,
    radarImpactMin: 0,
    radarImpactMax: 2.5,
    hasPenalties: false,
  },
  problema: {
    xpMin: 1,
    xpMax: 1000,
    eseMin: 0,
    eseMax: 500,
    pilarImpactMin: 0,
    pilarImpactMax: 100,
    radarImpactMin: 0,
    radarImpactMax: 10,
    hasPenalties: true,
    lossXpMin: -1000,
    lossXpMax: -25,
    lossEseMin: -500,
    lossEseMax: 0,
    lossPilarMin: -100,
    lossPilarMax: 0,
    lossRadarMin: -10,
    lossRadarMax: 0,
  },
  meta: {
    xpMin: 10,
    xpMax: 1500,
    eseMin: 10,
    eseMax: 500,
    pilarImpactMin: 0,
    pilarImpactMax: 25,
    radarImpactMin: 0,
    radarImpactMax: 10,
    hasPenalties: false,
  },
  boss: {
    xpMin: 1,
    xpMax: 2500,
    eseMin: 0,
    eseMax: 1000,
    pilarImpactMin: 0,
    pilarImpactMax: 100,
    radarImpactMin: 0,
    radarImpactMax: 10,
    hasPenalties: true,
    lossXpMin: -2500,
    lossXpMax: -100,
    lossEseMin: -1000,
    lossEseMax: 0,
    lossPilarMin: -100,
    lossPilarMax: -5,
    lossRadarMin: -50,
    lossRadarMax: -5,
  },
  conquista: {
    xpMin: 1,
    xpMax: 2500,
    eseMin: 0,
    eseMax: 1000,
    pilarImpactMin: 0,
    pilarImpactMax: 100,
    radarImpactMin: 0,
    radarImpactMax: 10,
    hasPenalties: false,
  },
};

export interface ActionTypeMeta {
  id: ActionType;
  label: string;
  tabLabel: string;
  activeTabClass: string;
  badgeClass: string;
  panelClass: string;
  borderClass: string;
  accentHex: string;
}

export const ACTION_TYPE_META: Record<ActionType, ActionTypeMeta> = {
  diaria: {
    id: 'diaria',
    label: 'DIÁRIA',
    tabLabel: 'Diárias',
    activeTabClass: 'bg-green-700 text-white border-green-500/60 shadow-[0_0_14px_rgba(21,128,61,0.35)]',
    badgeClass: 'bg-green-500/15 text-green-300 border-green-500/30',
    panelClass: 'bg-[#1c3512]/65 border-green-500/35',
    borderClass: 'border-green-500/35',
    accentHex: '#22C55E',
  },
  fazer: {
    id: 'fazer',
    label: 'FAZER',
    tabLabel: 'Fazer',
    activeTabClass: 'bg-sky-700 text-white border-sky-400/60 shadow-[0_0_14px_rgba(3,105,161,0.35)]',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    panelClass: 'bg-[#0b2a42]/65 border-sky-400/35',
    borderClass: 'border-sky-400/35',
    accentHex: '#38BDF8',
  },
  meta: {
    id: 'meta',
    label: 'MISSÃO',
    tabLabel: 'Missão',
    activeTabClass: 'bg-purple-800 text-white border-purple-500/60 shadow-[0_0_14px_rgba(107,33,168,0.4)]',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    panelClass: 'bg-[#2a1246]/70 border-purple-500/40',
    borderClass: 'border-purple-500/40',
    accentHex: '#A855F7',
  },
  boss: {
    id: 'boss',
    label: 'BOSS',
    tabLabel: 'BOSS',
    activeTabClass: 'bg-red-900 text-white border-red-500/60 shadow-[0_0_16px_rgba(127,29,29,0.5)]',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/35',
    panelClass: 'bg-[#3b0c0c]/75 border-red-500/40',
    borderClass: 'border-red-500/40',
    accentHex: '#EF4444',
  },
  problema: {
    id: 'problema',
    label: 'INIMIGO',
    tabLabel: 'Inimigo',
    activeTabClass: 'bg-orange-900 text-white border-orange-500/60 shadow-[0_0_14px_rgba(124,45,18,0.4)]',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    panelClass: 'bg-[#3d1709]/70 border-orange-500/40',
    borderClass: 'border-orange-500/40',
    accentHex: '#F97316',
  },
  conquista: {
    id: 'conquista',
    label: 'CONQUISTA',
    tabLabel: 'Conquista',
    activeTabClass: 'bg-yellow-700 text-white border-yellow-500/60 shadow-[0_0_14px_rgba(161,98,7,0.4)]',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/35',
    panelClass: 'bg-[#363607]/70 border-yellow-500/40',
    borderClass: 'border-yellow-500/40',
    accentHex: '#EAB308',
  },
};

export const MONTHS_PT: { index: number; short: string; full: string; days: number }[] = [
  { index: 0, short: 'JAN', full: 'Janeiro', days: 31 },
  { index: 1, short: 'FEV', full: 'Fevereiro', days: 28 },
  { index: 2, short: 'MAR', full: 'Março', days: 31 },
  { index: 3, short: 'ABR', full: 'Abril', days: 30 },
  { index: 4, short: 'MAI', full: 'Maio', days: 31 },
  { index: 5, short: 'JUN', full: 'Junho', days: 30 },
  { index: 6, short: 'JUL', full: 'Julho', days: 31 },
  { index: 7, short: 'AGO', full: 'Agosto', days: 31 },
  { index: 8, short: 'SET', full: 'Setembro', days: 30 },
  { index: 9, short: 'OUT', full: 'Outubro', days: 31 },
  { index: 10, short: 'NOV', full: 'Novembro', days: 30 },
  { index: 11, short: 'DEZ', full: 'Dezembro', days: 31 },
];
