import React, { useState, useMemo } from 'react';
import {
  Flame,
  Home,
  Store,
  Users,
  MessageSquare,
  Settings,
  Globe,
  LogOut,
  Plus,
  Minus,
  Search,
  Table2,
  Calendar as CalendarIcon,
  Clock,
  MoreVertical,
  CheckSquare,
  Square,
  Download,
  Menu,
  X,
  Heart,
  Sparkles,
  Bell,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderEdit,
  Trash2,
  GripVertical,
  ArrowLeft,
  LayoutGrid,
  ListTodo,
  Target,
  Award,
  Skull,
  AlertTriangle,
  Database,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ListOrdered,
  Pencil,
  CalendarDays,
} from 'lucide-react';
import {
  ACTION_TYPE_META,
  ActionDraftTab,
  ActionFolder,
  ActionItem,
  ActionType,
  ChronologySubMode,
  HubFilterType,
  HubSection,
  MANAGEMENT_STATUS_MAP,
  ManagementStatus,
  MONTHS_PT,
  NotificationItem,
  UserPersonaStats,
  ViewMode,
} from './types';
import {
  INITIAL_ACTIONS,
  INITIAL_FOLDERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_USER_STATS,
  KOSMO_PILLARS,
} from './mockData';
import { ActionFormPrototype, buildDraftTab } from './ActionFormPrototype';
import { MissionBossCardPrototype } from './MissionBossCardPrototype';
import { FolderAssignPopover } from './FolderAssignPopover';
import {
  addDaysIso,
  doesActionOccurOnDate,
  flattenFoldersWithDepth,
  formatShortPtBrDate,
  getDescendantFolderIds,
  getFolderChildren,
  getFolderPath,
  getFolderPathLabel,
  getMonthMatrix,
  getWeekDatesFromIso,
  parseIsoDate,
  toIsoDate,
} from './folderUtils';

const TODAY_ISO = '2026-11-21';

const TYPE_FILTERS: { id: HubFilterType; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'diaria', label: 'Diárias' },
  { id: 'fazer', label: 'Fazer' },
  { id: 'meta', label: 'Missões' },
  { id: 'conquista', label: 'Conquistas' },
  { id: 'boss', label: 'Boss' },
  { id: 'problema', label: 'Problemas' },
  { id: 'historico', label: 'Histórico' },
];

const WEEKDAY_HEADERS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'] as const;

const SIDEBAR_NAV = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'acoes', label: 'Ações', icon: Flame },
  { id: 'loja', label: 'Loja de Recompensas', icon: Store },
  { id: 'equipe', label: 'Minha Equipe', icon: Users },
  { id: 'comunidade', label: 'Comunidade', icon: MessageSquare },
  { id: 'config', label: 'Configurações', icon: Settings },
  { id: 'social', label: 'Ir para Rede Social', icon: Globe },
];

const HUB_CATEGORIES: {
  id: HubFilterType;
  title: string;
  badge: string;
  description: string;
  tags: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBoxClass: string;
  iconClass: string;
  badgeClass: string;
  hoverBorder: string;
}[] = [
  {
    id: 'todas',
    title: 'TODAS AÇÕES',
    badge: 'VISÃO GERAL',
    description: 'Acesse suas tarefas pendentes, diárias, missões e objetivos atuais.',
    tags: 'DIÁRIAS · FAZER · MISSÕES',
    icon: LayoutGrid,
    iconBoxClass: 'bg-[#4850FF]/10 border-[#4850FF]/25',
    iconClass: 'text-[#4850FF]',
    badgeClass: 'bg-[#4850FF]/15 text-[#98A9FF] border-[#4850FF]/30',
    hoverBorder: 'hover:border-[#4850FF]/50',
  },
  {
    id: 'diaria',
    title: 'DIÁRIAS (Tasks)',
    badge: 'MAX 20 | FREE',
    description: 'Tarefas recorrentes para manter sua ofensiva e consistência diária.',
    tags: 'RESET DIÁRIO · OFENSIVA',
    icon: CalendarIcon,
    iconBoxClass: 'bg-slate-500/10 border-slate-500/25',
    iconClass: 'text-slate-300',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    hoverBorder: 'hover:border-slate-400/50',
  },
  {
    id: 'fazer',
    title: 'FAZER (Req.)',
    badge: 'MAX 10/DIA',
    description: 'Requisitos únicos que desaparecem no fim do dia determinado.',
    tags: 'URGENTE · PONTUAL',
    icon: ListTodo,
    iconBoxClass: 'bg-sky-500/10 border-sky-500/25',
    iconClass: 'text-sky-400',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    hoverBorder: 'hover:border-sky-400/50',
  },
  {
    id: 'meta',
    title: 'MISSÕES (Metas)',
    badge: 'MAX 5/MÊS',
    description: 'Metas de médio prazo que desaparecem no fim do mês determinado.',
    tags: 'ALTO XP · PLANEJAMENTO',
    icon: Target,
    iconBoxClass: 'bg-purple-500/10 border-purple-500/25',
    iconClass: 'text-purple-400',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    hoverBorder: 'hover:border-purple-400/50',
  },
  {
    id: 'conquista',
    title: 'CONQUISTAS',
    badge: 'MAX 3/MÊS',
    description: 'Marcos importantes, criados manualmente ou AUTO pelo seu Nível.',
    tags: 'RECOMPENSAS · MARCOS',
    icon: Award,
    iconBoxClass: 'bg-yellow-500/10 border-yellow-500/25',
    iconClass: 'text-yellow-400',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    hoverBorder: 'hover:border-yellow-400/50',
  },
  {
    id: 'boss',
    title: 'BOSS (Objetivos)',
    badge: 'MAX 1/MÊS',
    description: 'O grande objetivo do mês. Derrote-o antes do prazo para não perder HP.',
    tags: 'RISCO DE HP · ÉPICO',
    icon: Skull,
    iconBoxClass: 'bg-red-500/10 border-red-500/25',
    iconClass: 'text-red-400',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    hoverBorder: 'hover:border-red-400/50',
  },
  {
    id: 'problema',
    title: 'PROBLEMAS',
    badge: 'MAX 10/DIA',
    description: 'Imprevistos e inimigos diários. Resolva o quanto antes para evitar dano.',
    tags: 'PENALIDADE · URGENTE',
    icon: AlertTriangle,
    iconBoxClass: 'bg-orange-500/10 border-orange-500/25',
    iconClass: 'text-orange-400',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    hoverBorder: 'hover:border-orange-400/50',
  },
  {
    id: 'historico',
    title: 'BANCO DE DADOS',
    badge: 'HISTÓRICO',
    description: 'Acesse o histórico completo de todas as ações que você já concluiu.',
    tags: 'REGISTROS · PROGRESSO',
    icon: Database,
    iconBoxClass: 'bg-gray-500/10 border-gray-500/25',
    iconClass: 'text-gray-400',
    badgeClass: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
    hoverBorder: 'hover:border-gray-400/50',
  },
];

const HUB_VISUALIZATION_CARDS: {
  id: 'explorer' | ViewMode;
  title: string;
  badge: string;
  description: string;
  tags: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBoxClass: string;
  iconClass: string;
  badgeClass: string;
  heroGradientClass: string;
  hoverBorder: string;
}[] = [
  {
    id: 'explorer',
    title: 'VISUALIZAR PASTAS/AÇÕES',
    badge: 'EXPLORADOR',
    description: 'Pastas e subpastas infinitas, cards soltos e arraste bidirecional.',
    tags: 'WINDOWS EXPLORER · MÚLTIPLAS PASTAS',
    icon: FolderOpen,
    iconBoxClass: 'bg-[#4850FF]/15 border-[#4850FF]/35',
    iconClass: 'text-[#98A9FF]',
    badgeClass: 'bg-[#4850FF]/20 text-[#98A9FF] border-[#4850FF]/35',
    heroGradientClass: 'bg-gradient-to-br from-[#01055B]/55 via-[#111618] to-[#0f172a]',
    hoverBorder: 'hover:border-[#4850FF]/70 hover:shadow-[0_12px_30px_rgba(72,80,255,0.18)]',
  },
  {
    id: 'tabela',
    title: 'VISUALIZAR TABELAS',
    badge: 'ESTRUTURADO',
    description: 'Grade com subtarefas expansíveis (+/-), ordenação manual e filtros.',
    tags: 'CLICKUP STYLE · SUBTAREFAS',
    icon: Table2,
    iconBoxClass: 'bg-sky-500/15 border-sky-500/35',
    iconClass: 'text-sky-400',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/35',
    heroGradientClass: 'bg-gradient-to-br from-sky-950/60 via-[#111618] to-[#0b151e]',
    hoverBorder: 'hover:border-sky-400/70 hover:shadow-[0_12px_30px_rgba(56,189,248,0.16)]',
  },
  {
    id: 'calendario',
    title: 'VISUALIZAR CALENDÁRIO',
    badge: 'GOOGLE AGENDA',
    description: 'Grade semanal cronológica com mini-mês e navegação mensal por setas.',
    tags: 'SEMANAL · MENSAL INTERATIVO',
    icon: CalendarIcon,
    iconBoxClass: 'bg-emerald-500/15 border-emerald-500/35',
    iconClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35',
    heroGradientClass: 'bg-gradient-to-br from-emerald-950/60 via-[#111618] to-[#0b1713]',
    hoverBorder: 'hover:border-emerald-400/70 hover:shadow-[0_12px_30px_rgba(16,185,129,0.16)]',
  },
  {
    id: 'cronologia',
    title: 'VISUALIZAR CRONOLOGIA',
    badge: 'SEQUENCIAL',
    description: 'Horários por dia escolhido com agendamento ou capítulos por pasta (1., 1.1).',
    tags: 'POR HORÁRIO · CAPÍTULOS MANUAIS',
    icon: Clock,
    iconBoxClass: 'bg-purple-500/15 border-purple-500/35',
    iconClass: 'text-purple-400',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/35',
    heroGradientClass: 'bg-gradient-to-br from-purple-950/55 via-[#111618] to-amber-950/25',
    hoverBorder: 'hover:border-purple-400/70 hover:shadow-[0_12px_30px_rgba(168,85,247,0.16)]',
  },
];

function getPillarColorClass(pillarName: string): string {
  const found = KOSMO_PILLARS.find((p) => p.name === pillarName);
  return found ? found.colorClass : 'bg-gray-600';
}

function getFrequencyLabel(action: ActionItem): string {
  const f = action.frequency;
  if (!f) return action.due_time ? `${action.due_date} · ${action.due_time}` : action.due_date;
  if (f.diariaTimes.length > 0) {
    return `FREQ: DIÁRIA ${f.occurrenceLabel ?? `1/${f.diariaTimes.length}`}`;
  }
  if (f.semanalDays.length > 0) {
    return 'FREQ: SEMANAL';
  }
  if (f.mensalDays.length > 0) {
    return 'FREQ: MENSAL';
  }
  return 'RECORRENTE';
}

function getCategoryNotifBadge(cat: NotificationItem['category']): {
  label: string;
  badgeClass: string;
} {
  switch (cat) {
    case 'boss':
      return { label: 'BOSS', badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40' };
    case 'streak':
      return { label: 'OFENSIVA', badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
    case 'social':
      return { label: 'REDE', badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
    case 'folder':
      return { label: 'PASTA', badgeClass: 'bg-[#4850FF]/20 text-[#98A9FF] border-[#4850FF]/40' };
    default:
      return { label: 'MARCO', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  }
}

interface MiniMonthCalendarProps {
  year: number;
  monthIdx: number;
  selectedIso: string;
  actions: ActionItem[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectIso: (iso: string) => void;
  onToday?: () => void;
}

const MiniMonthCalendar: React.FC<MiniMonthCalendarProps> = ({
  year,
  monthIdx,
  selectedIso,
  actions,
  onPrevMonth,
  onNextMonth,
  onSelectIso,
  onToday,
}) => {
  const monthObj = MONTHS_PT[monthIdx] ?? MONTHS_PT[10];
  const cells = useMemo(() => getMonthMatrix(year, monthIdx), [year, monthIdx]);

  return (
    <div className="bg-[#121619] border border-white/10 rounded-2xl p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-heading font-black uppercase tracking-wide text-white">
          {monthObj.full} {year}
        </span>
        <div className="flex items-center gap-1">
          {onToday && (
            <button
              type="button"
              onClick={onToday}
              className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/15 text-[10px] font-bold text-[#98A9FF] cursor-pointer"
            >
              Hoje
            </button>
          )}
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Mês anterior"
            className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-gray-300 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Próximo mês"
            className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-gray-300 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_HEADERS.map((wd) => (
          <span key={wd} className="text-[9px] font-bold text-gray-500 py-0.5">
            {wd.slice(0, 1)}
          </span>
        ))}
        {cells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <span key={`empty-${idx}`} className="h-7" />;
          }
          const cellIso = toIsoDate(year, monthIdx, dayNum);
          const isSelected = cellIso === selectedIso;
          const isToday = cellIso === TODAY_ISO;
          const hasEvents = actions.some((a) => doesActionOccurOnDate(a, cellIso));
          return (
            <button
              key={cellIso}
              type="button"
              onClick={() => onSelectIso(cellIso)}
              className={`h-7 rounded-lg text-[11px] font-mono font-bold flex flex-col items-center justify-center relative transition-colors cursor-pointer tabular-nums ${
                isSelected
                  ? 'bg-[#4850FF] text-white shadow-[0_0_10px_rgba(72,80,255,0.45)]'
                  : isToday
                  ? 'bg-[#4850FF]/20 text-[#98A9FF] border border-[#4850FF]/40'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <span>{dayNum}</span>
              {hasEvents && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const ActionsHubPrototype: React.FC = () => {
  const [actions, setActions] = useState<ActionItem[]>(INITIAL_ACTIONS);
  const [folders, setFolders] = useState<ActionFolder[]>(INITIAL_FOLDERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [userStats, setUserStats] = useState<UserPersonaStats>(INITIAL_USER_STATS);
  const [activeNav, setActiveNav] = useState<string>('acoes');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Navigation between Hub Home (/acoes), Windows Explorer, and Workspace
  const [hubSection, setHubSection] = useState<HubSection>('hub');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'loose'>('all');
  const [expandedFolderTree, setExpandedFolderTree] = useState<Record<string, boolean>>({
    'folder-kosmo': true,
    'folder-kosmo-frontend': true,
  });
  const [explorerEditMode, setExplorerEditMode] = useState<boolean>(false);
  const [explorerDeleteMode, setExplorerDeleteMode] = useState<boolean>(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [newFolderColor, setNewFolderColor] = useState<string>('#4850FF');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState<string>('');
  const [draggedActionId, setDraggedActionId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverActionId, setDragOverActionId] = useState<string | null>(null);

  // Filters & View Modes inside Workspace
  const [typeFilter, setTypeFilter] = useState<HubFilterType>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | ManagementStatus>('todos');
  const [tableFolderFilter, setTableFolderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('tabela');
  const [chronologySubMode, setChronologySubMode] = useState<ChronologySubMode>('horario');

  // Table & Chronology Manual Expanded Subtasks
  const [expandedTableRows, setExpandedTableRows] = useState<Record<string, boolean>>({
    'missao-2': true,
  });
  const [expandedManualChapters, setExpandedManualChapters] = useState<Record<string, boolean>>({
    'missao-2': true,
    'boss-2': true,
  });

  // Calendar Google Agenda state (Item 4)
  const [calendarScope, setCalendarScope] = useState<'semanal' | 'mensal'>('semanal');
  const [calYear, setCalYear] = useState<number>(2026);
  const [calMonth, setCalMonth] = useState<number>(10); // 10 = Novembro
  const [calSelectedIso, setCalSelectedIso] = useState<string>(TODAY_ISO);
  const [calMonthShowAll, setCalMonthShowAll] = useState<boolean>(false);
  const [showMiniCalMobile, setShowMiniCalMobile] = useState<boolean>(false);

  // Chronology Day Picker & Folder Selector state (Items 7 & 8)
  const [chronoSelectedIso, setChronoSelectedIso] = useState<string>(TODAY_ISO);
  const [chronoCalYear, setChronoCalYear] = useState<number>(2026);
  const [chronoCalMonth, setChronoCalMonth] = useState<number>(10);
  const [showChronoCalMobile, setShowChronoCalMobile] = useState<boolean>(false);
  const [schedulingActionId, setSchedulingActionId] = useState<string | null>(null);
  const [scheduleTimeInput, setScheduleTimeInput] = useState<string>('16:00');
  const [chronoManualFolderId, setChronoManualFolderId] = useState<string | 'all' | 'loose'>('all');

  // Persistent Browser-Tabbed Drafts inside Modal (Item 3)
  const [draftTabs, setDraftTabs] = useState<ActionDraftTab[]>(() => [
    buildDraftTab(null, 'fazer', []),
  ]);
  const [activeDraftTabId, setActiveDraftTabId] = useState<string>(() => draftTabs[0].tabId);

  // Header Notifications Popover + Modal + Bottom-Left Ephemeral Toasts
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    subtitle?: string;
    important?: boolean;
  } | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const dirtyDraftCount = useMemo(
    () => draftTabs.filter((t) => t.isDirty).length,
    [draftTabs]
  );

  // Ephemeral Toast ONLY (does NOT clutter Header Bell — Item 5)
  const showEphemeralToast = (title: string, subtitle?: string) => {
    setToastMessage({ title, subtitle, important: false });
    window.setTimeout(() => {
      setToastMessage((curr) => (curr?.title === title ? null : curr));
    }, 3000);
  };

  // Important Notification (adds to Header Bell AND shows toast — Item 5)
  const pushImportantNotification = (
    title: string,
    subtitle: string | undefined,
    category: NotificationItem['category']
  ) => {
    setToastMessage({ title, subtitle, important: true });
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      subtitle,
      timestamp: 'Agora',
      read: false,
      category,
    };
    setNotifications((prev) => [notif, ...prev].slice(0, 20));
    window.setTimeout(() => {
      setToastMessage((curr) => (curr?.title === title ? null : curr));
    }, 3500);
  };

  // Counts per filter tab
  const filterCounts = useMemo<Record<HubFilterType, number>>(() => {
    const counts: Record<HubFilterType, number> = {
      todas: 0,
      diaria: 0,
      fazer: 0,
      meta: 0,
      conquista: 0,
      boss: 0,
      problema: 0,
      historico: 0,
    };
    actions.forEach((a) => {
      if (a.status === 'concluido') {
        counts.historico += 1;
      } else {
        counts.todas += 1;
        counts[a.type] += 1;
      }
    });
    return counts;
  }, [actions]);

  const orderedActions = useMemo(() => {
    return [...actions].sort((a, b) => a.order_index - b.order_index);
  }, [actions]);

  const filteredActions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const allowedTableFolderIds =
      viewMode === 'tabela' && tableFolderFilter !== 'all' && tableFolderFilter !== 'loose'
        ? new Set(getDescendantFolderIds(folders, tableFolderFilter))
        : null;

    return orderedActions.filter((action) => {
      if (typeFilter === 'historico') {
        if (action.status !== 'concluido') return false;
      } else if (typeFilter === 'todas') {
        if (action.status === 'concluido' && action.type !== 'diaria') return false;
      } else {
        if (action.type !== typeFilter) return false;
      }

      if (statusFilter !== 'todos' && action.management_status !== statusFilter) {
        return false;
      }

      if (viewMode === 'tabela' && tableFolderFilter !== 'all') {
        if (tableFolderFilter === 'loose') {
          if (action.folderIds.length > 0) return false;
        } else if (allowedTableFolderIds) {
          if (!action.folderIds.some((fid) => allowedTableFolderIds.has(fid))) return false;
        }
      }

      if (q) {
        const hay = `${action.title} ${action.description} ${action.pillars.join(' ')} ${
          action.new_vocation ?? ''
        } ${action.vocation_bonus ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orderedActions, typeFilter, statusFilter, viewMode, tableFolderFilter, folders, searchQuery]);

  const missionBossConquistaCards = useMemo(() => {
    return filteredActions.filter(
      (a) => a.type === 'meta' || a.type === 'boss' || a.type === 'conquista'
    );
  }, [filteredActions]);

  // Explorer filtered items (supports infinite subfolders via descendants + multi-folder membership)
  const explorerActions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const allowedIds =
      selectedFolderId !== 'all' && selectedFolderId !== 'loose'
        ? new Set(getDescendantFolderIds(folders, selectedFolderId))
        : null;

    return orderedActions.filter((a) => {
      if (selectedFolderId === 'loose') {
        if (a.folderIds.length > 0) return false;
      } else if (allowedIds) {
        if (!a.folderIds.some((fid) => allowedIds.has(fid))) return false;
      }
      if (q) {
        return (
          a.title.toLowerCase().includes(q) ||
          a.pillars.some((p) => p.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [orderedActions, folders, selectedFolderId, searchQuery]);

  const explorerChildFolders = useMemo(() => {
    if (selectedFolderId === 'loose') return [];
    const parentId = selectedFolderId === 'all' ? null : selectedFolderId;
    return getFolderChildren(folders, parentId);
  }, [folders, selectedFolderId]);

  const explorerBreadcrumb = useMemo(() => {
    if (selectedFolderId === 'all' || selectedFolderId === 'loose') return [];
    return getFolderPath(folders, selectedFolderId);
  }, [folders, selectedFolderId]);

  // Toggle action completion
  const handleToggleActionComplete = (actionId: string) => {
    const target = actions.find((a) => a.id === actionId);
    if (!target) return;
    const nextDone = target.status !== 'concluido';

    setActions((prev) =>
      prev.map((a) =>
        a.id === actionId
          ? {
              ...a,
              status: nextDone ? 'concluido' : 'pendente',
              management_status: nextDone ? 'concluido' : 'nao_resolvido',
              completed_at: nextDone ? new Date().toISOString() : null,
            }
          : a
      )
    );

    setUserStats((prev) => ({
      ...prev,
      xp_total: Math.max(0, prev.xp_total + (nextDone ? target.xp_reward : -target.xp_reward)),
      ese_total: Math.max(0, prev.ese_total + (nextDone ? target.ese_reward : -target.ese_reward)),
    }));

    if (nextDone) {
      if (target.type === 'boss') {
        pushImportantNotification(
          `BOSS Derrotado! +${target.xp_reward} XP`,
          `${target.title} concluído`,
          'boss'
        );
      } else if (target.type === 'conquista' || target.type === 'meta') {
        pushImportantNotification(
          `Marco Concluído! +${target.xp_reward} XP`,
          target.title,
          'milestone'
        );
      } else {
        showEphemeralToast(`+${target.xp_reward} XP · +${target.ese_reward} E$E`, target.title);
      }
    } else {
      showEphemeralToast('Ação reaberta', target.title);
    }
  };

  // Toggle requirement inside Mission/BOSS/Conquista or Fazer
  const handleToggleRequirement = (actionId: string, requirementId: string) => {
    let deltaXp = 0;
    let deltaEse = 0;
    let reqTitle = '';
    let markedDone = false;

    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== actionId || !a.requirements) return a;
        const nextReqs = a.requirements.map((r) => {
          if (r.id !== requirementId) return r;
          markedDone = !r.done;
          deltaXp = markedDone ? r.xp_reward : -r.xp_reward;
          deltaEse = markedDone ? r.ese_reward : -r.ese_reward;
          reqTitle = r.title;
          return { ...r, done: markedDone };
        });

        const allDone = nextReqs.length > 0 && nextReqs.every((r) => r.done);
        return {
          ...a,
          requirements: nextReqs,
          management_status: allDone ? 'concluido' : a.management_status,
        };
      })
    );

    if (deltaXp !== 0 || deltaEse !== 0) {
      setUserStats((prev) => ({
        ...prev,
        xp_total: Math.max(0, prev.xp_total + deltaXp),
        ese_total: Math.max(0, prev.ese_total + deltaEse),
      }));
      if (markedDone) {
        showEphemeralToast(`+${deltaXp} XP · +${deltaEse} E$E`, `Subtarefa: ${reqTitle}`);
      }
    }
  };

  // Persistent Drafts Open Handlers (Item 3)
  const handleOpenCreate = (presetType?: ActionType) => {
    const resolvedType =
      presetType ??
      (typeFilter !== 'todas' && typeFilter !== 'historico'
        ? (typeFilter as ActionType)
        : 'fazer');
    const contextFolders =
      hubSection === 'explorer' && selectedFolderId !== 'all' && selectedFolderId !== 'loose'
        ? [selectedFolderId]
        : [];

    // Reuse an existing untouched clean "new" tab if one exists, otherwise append a new draft tab
    const existingCleanNew = draftTabs.find((t) => !t.sourceActionId && !t.isDirty);
    if (existingCleanNew) {
      setActiveDraftTabId(existingCleanNew.tabId);
    } else {
      const fresh = buildDraftTab(null, resolvedType, contextFolders);
      setDraftTabs((prev) => [...prev, fresh]);
      setActiveDraftTabId(fresh.tabId);
    }
    setFormOpen(true);
  };

  const handleOpenEdit = (action: ActionItem) => {
    const alreadyOpen = draftTabs.find((t) => t.sourceActionId === action.id);
    if (alreadyOpen) {
      setActiveDraftTabId(alreadyOpen.tabId);
    } else {
      const created = buildDraftTab(action, action.type, action.folderIds);
      setDraftTabs((prev) => [...prev, created]);
      setActiveDraftTabId(created.tabId);
    }
    setFormOpen(true);
  };

  const handleSaveAction = (saved: ActionItem, inlineFazers?: ActionItem[]) => {
    const existedBefore = actions.some((a) => a.id === saved.id);
    setActions((prev) => {
      const updated = existedBefore
        ? prev.map((a) => (a.id === saved.id ? saved : a))
        : [saved, ...prev];
      if (inlineFazers && inlineFazers.length > 0) {
        return [...updated, ...inlineFazers];
      }
      return updated;
    });
    setFormOpen(false);
    showEphemeralToast(
      existedBefore ? 'Ação atualizada' : 'Nova ação criada',
      `${saved.title} (${ACTION_TYPE_META[saved.type].label})`
    );
  };

  const handleDeleteAction = (actionId: string) => {
    const removed = actions.find((a) => a.id === actionId);
    setActions((prev) => prev.filter((a) => a.id !== actionId));
    setDraftTabs((prev) => {
      const remaining = prev.filter((t) => t.sourceActionId !== actionId);
      if (remaining.length === 0) {
        const fresh = buildDraftTab(null, 'fazer', []);
        setActiveDraftTabId(fresh.tabId);
        return [fresh];
      }
      setActiveDraftTabId(remaining[0].tabId);
      return remaining;
    });
    setFormOpen(false);
    showEphemeralToast('Ação removida', removed?.title ?? 'Registro removido.');
  };

  const handleShareAction = (action: ActionItem) => {
    pushImportantNotification(
      'Compartilhado na Rede Social',
      `${action.title} enviada ao Feed Público.`,
      'social'
    );
  };

  // Multi-Folder Assignment (Item 6)
  const handleSetActionFolders = (actionId: string, nextFolderIds: string[]) => {
    const target = actions.find((a) => a.id === actionId);
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, folderIds: nextFolderIds } : a))
    );
    if (target) {
      showEphemeralToast(
        nextFolderIds.length === 0
          ? 'Movida para Soltas (Sem pasta)'
          : `Vinculada a ${nextFolderIds.length} pasta(s)`,
        target.title
      );
    }
  };

  const handleAddActionToFolderDrop = (actionId: string, folderId: string | null) => {
    const target = actions.find((a) => a.id === actionId);
    if (!target) return;
    if (folderId === null) {
      handleSetActionFolders(actionId, []);
      return;
    }
    const nextIds = target.folderIds.includes(folderId)
      ? target.folderIds
      : [...target.folderIds, folderId];
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, folderIds: nextIds } : a))
    );
    const folder = folders.find((f) => f.id === folderId);
    showEphemeralToast(
      `Adicionada em "${folder?.name ?? 'Pasta'}"`,
      target.title
    );
  };

  // Folder / Subfolder CRUD (Item 2)
  const handleCreateFolder = (overrideParentId?: string | null) => {
    const clean = newFolderName.trim();
    if (!clean) return;
    const parentIdToUse =
      overrideParentId !== undefined ? overrideParentId : newFolderParentId;
    const created: ActionFolder = {
      id: `folder-${Date.now()}`,
      user_id: 'mock-user',
      name: clean,
      color: newFolderColor,
      icon: 'folder',
      parent_folder_id: parentIdToUse,
      order_index: folders.length,
      created_at: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, created]);
    if (parentIdToUse) {
      setExpandedFolderTree((prev) => ({ ...prev, [parentIdToUse]: true }));
    }
    setSelectedFolderId(created.id);
    setNewFolderName('');
    setShowNewFolderInput(false);
    pushImportantNotification(
      parentIdToUse ? 'Subpasta criada' : 'Pasta criada',
      getFolderPathLabel([...folders, created], created.id),
      'folder'
    );
  };

  const handleRenameFolder = (folderId: string) => {
    const clean = renameFolderValue.trim();
    if (!clean) return;
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: clean } : f)));
    setRenamingFolderId(null);
    pushImportantNotification('Pasta renomeada', clean, 'folder');
  };

  const handleDeleteFolder = (folderId: string) => {
    const target = folders.find((f) => f.id === folderId);
    const toRemoveIds = new Set(getDescendantFolderIds(folders, folderId));
    setFolders((prev) => prev.filter((f) => !toRemoveIds.has(f.id)));
    setActions((prev) =>
      prev.map((a) => ({
        ...a,
        folderIds: a.folderIds.filter((fid) => !toRemoveIds.has(fid)),
      }))
    );
    if (selectedFolderId !== 'all' && selectedFolderId !== 'loose' && toRemoveIds.has(selectedFolderId)) {
      setSelectedFolderId('all');
    }
    pushImportantNotification(
      'Pasta removida',
      `${target?.name ?? 'Pasta'} e subpastas removidas.`,
      'folder'
    );
  };

  // Drag-and-Drop Reorder (Table, Explorer grid cards, Manual Chronology)
  const handleReorderActions = (dragId: string, dropTargetId: string) => {
    if (dragId === dropTargetId) return;
    setActions((prev) => {
      const sorted = [...prev].sort((a, b) => a.order_index - b.order_index);
      const fromIndex = sorted.findIndex((a) => a.id === dragId);
      const toIndex = sorted.findIndex((a) => a.id === dropTargetId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return sorted.map((item, idx) => ({ ...item, order_index: idx + 1 }));
    });
    showEphemeralToast('Ordem atualizada', 'Sequência manual salva em memória.');
  };

  // Quick inline schedule in Cronologia por Horário (Item 8)
  const handleAssignActionTime = (actionId: string, newTime: string) => {
    if (!newTime.trim()) return;
    const act = actions.find((a) => a.id === actionId);
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, due_time: newTime } : a))
    );
    setSchedulingActionId(null);
    if (act) {
      showEphemeralToast(`Agendada para ${newTime}`, act.title);
    }
  };

  // Google Calendar Week & Month derived data (Item 4)
  const weekDates = useMemo(() => getWeekDatesFromIso(calSelectedIso), [calSelectedIso]);

  const weeklyHourlyRows = useMemo(() => {
    const dayItems = filteredActions
      .filter((a) => doesActionOccurOnDate(a, calSelectedIso))
      .sort((a, b) => (a.due_time || '99:99').localeCompare(b.due_time || '99:99'));

    const groups: { slot: string; items: ActionItem[] }[] = [];
    dayItems.forEach((item) => {
      const slot = item.due_time?.trim() ? `${item.due_time.slice(0, 2)}:00` : 'Dia Inteiro';
      const found = groups.find((g) => g.slot === slot);
      if (found) found.items.push(item);
      else groups.push({ slot, items: [item] });
    });
    return groups;
  }, [filteredActions, calSelectedIso]);

  const calendarSelectedDayCards = useMemo(() => {
    if (calendarScope === 'mensal' && calMonthShowAll) {
      return filteredActions.filter((a) => {
        const isRec =
          (a.frequency?.diariaTimes?.length ?? 0) > 0 ||
          (a.frequency?.semanalDays?.length ?? 0) > 0 ||
          (a.frequency?.mensalDays?.length ?? 0) > 0;
        const dueMonthIdx = a.due_date ? parseInt(a.due_date.split('-')[1] ?? '0', 10) - 1 : -1;
        return isRec || dueMonthIdx === calMonth;
      });
    }
    return filteredActions
      .filter((a) => doesActionOccurOnDate(a, calSelectedIso))
      .sort((a, b) => (a.due_time || '99:99').localeCompare(b.due_time || '99:99'));
  }, [filteredActions, calendarScope, calMonthShowAll, calMonth, calSelectedIso]);

  const monthlyMatrix = useMemo(() => getMonthMatrix(calYear, calMonth), [calYear, calMonth]);

  // Chronology by Day & Unscheduled Queue (Item 8)
  const chronoDayActions = useMemo(() => {
    return filteredActions.filter((a) => doesActionOccurOnDate(a, chronoSelectedIso));
  }, [filteredActions, chronoSelectedIso]);

  const chronoScheduledGroups = useMemo(() => {
    const scheduled = chronoDayActions
      .filter((a) => Boolean(a.due_time && a.due_time.trim() !== ''))
      .sort((a, b) => a.due_time.localeCompare(b.due_time));

    const groups: { timeSlot: string; items: ActionItem[] }[] = [];
    scheduled.forEach((item) => {
      const slot = `${item.due_time.slice(0, 2)}:00`;
      const existing = groups.find((g) => g.timeSlot === slot);
      if (existing) existing.items.push(item);
      else groups.push({ timeSlot: slot, items: [item] });
    });
    return groups;
  }, [chronoDayActions]);

  const chronoUnscheduledActions = useMemo(() => {
    return chronoDayActions.filter((a) => !a.due_time || a.due_time.trim() === '');
  }, [chronoDayActions]);

  // Chronology Manual Scoped by Folder (Item 7)
  const chronoManualActions = useMemo(() => {
    if (chronoManualFolderId === 'all') return filteredActions;
    if (chronoManualFolderId === 'loose') {
      return filteredActions.filter((a) => a.folderIds.length === 0);
    }
    const allowed = new Set(getDescendantFolderIds(folders, chronoManualFolderId));
    return filteredActions.filter((a) => a.folderIds.some((fid) => allowed.has(fid)));
  }, [filteredActions, chronoManualFolderId, folders]);

  const getActionSubtasks = (action: ActionItem) => {
    const reqs = action.requirements ?? [];
    const linkedFazers = actions.filter(
      (candidate) =>
        candidate.type === 'fazer' &&
        candidate.reference_id === action.id &&
        !reqs.some((r) => r.linkedActionId === candidate.id)
    );
    return { reqs, linkedFazers, totalCount: reqs.length + linkedFazers.length };
  };

  const openWorkspaceWith = (filter: HubFilterType, mode: ViewMode) => {
    setTypeFilter(filter);
    setViewMode(mode);
    setHubSection('workspace');
  };

  const navigateCalendarMonth = (delta: number) => {
    let nextMonth = calMonth + delta;
    let nextYear = calYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setCalMonth(nextMonth);
    setCalYear(nextYear);
    setCalSelectedIso(toIsoDate(nextYear, nextMonth, 1));
    setCalMonthShowAll(false);
  };

  const navigateChronoMonth = (delta: number) => {
    let nextMonth = chronoCalMonth + delta;
    let nextYear = chronoCalYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setChronoCalMonth(nextMonth);
    setChronoCalYear(nextYear);
  };

  // Recursive Folder Tree Renderer for Windows Explorer
  const renderFolderTreeNodes = (parentId: string | null, depth = 0): React.ReactNode => {
    const children = getFolderChildren(folders, parentId);
    if (children.length === 0) return null;

    return children.map((folder) => {
      const subChildren = getFolderChildren(folders, folder.id);
      const hasChildren = subChildren.length > 0;
      const isExpanded = Boolean(expandedFolderTree[folder.id]);
      const descendantIds = new Set(getDescendantFolderIds(folders, folder.id));
      const count = actions.filter((a) => a.folderIds.some((fid) => descendantIds.has(fid))).length;
      const isActive = selectedFolderId === folder.id;
      const isDragOver = dragOverFolderId === folder.id;

      return (
        <div key={folder.id} className="space-y-1">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverFolderId(folder.id);
            }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverFolderId(null);
              if (draggedActionId) {
                handleAddActionToFolderDrop(draggedActionId, folder.id);
                setDraggedActionId(null);
              }
            }}
            style={{ marginLeft: `${depth * 14}px` }}
            className={`rounded-xl border transition-all p-2 ${
              isDragOver
                ? 'bg-[#4850FF]/25 border-[#4850FF] scale-[1.01]'
                : isActive
                ? 'bg-white/10 border-white/25'
                : 'bg-black/25 border-white/5 hover:border-white/15'
            }`}
          >
            {renamingFolderId === folder.id ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={renameFolderValue}
                  onChange={(e) => setRenameFolderValue(e.target.value)}
                  className="flex-1 min-w-0 bg-black/60 border border-white/20 rounded px-2 py-1 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleRenameFolder(folder.id)}
                  className="px-2 py-1 rounded bg-emerald-600 text-[10px] font-bold text-white cursor-pointer shrink-0"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedFolderTree((prev) => ({
                          ...prev,
                          [folder.id]: !prev[folder.id],
                        }))
                      }
                      className="p-0.5 text-gray-400 hover:text-white cursor-pointer shrink-0"
                      aria-label={isExpanded ? 'Recolher subpastas' : 'Expandir subpastas'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      if (hasChildren) {
                        setExpandedFolderTree((prev) => ({ ...prev, [folder.id]: true }));
                      }
                    }}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <span className="shrink-0 flex items-center" style={{ color: folder.color }}>
                      {isActive ? (
                        <FolderOpen className="w-4 h-4" />
                      ) : (
                        <Folder className="w-4 h-4" />
                      )}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{folder.name}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono text-gray-400 tabular-nums px-1">
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewFolderParentId(folder.id);
                      setShowNewFolderInput(true);
                    }}
                    className="p-1 rounded bg-white/5 hover:bg-[#4850FF]/30 text-gray-400 hover:text-white cursor-pointer"
                    title={`Criar subpasta dentro de ${folder.name}`}
                    aria-label={`Criar subpasta dentro de ${folder.name}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  {explorerEditMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingFolderId(folder.id);
                        setRenameFolderValue(folder.name);
                      }}
                      className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer"
                      title="Renomear pasta"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                  {explorerDeleteMode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="p-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 cursor-pointer"
                      title="Deletar pasta e subpastas"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {hasChildren && isExpanded && (
            <div className="space-y-1">{renderFolderTreeNodes(folder.id, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  const activeCalMonthObj = MONTHS_PT[calMonth] ?? MONTHS_PT[10];
  const weekStartLabel = formatShortPtBrDate(weekDates[0]);
  const weekEndLabel = formatShortPtBrDate(weekDates[6]);
  const flatFolders = useMemo(() => flattenFoldersWithDepth(folders), [folders]);

  return (
    <div className="flex h-screen bg-[#0B0F10] text-[#FEFEFE] font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#07090a] border-r border-white/5 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#01055B] border border-[#4850FF]/50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#98A9FF]" />
            </div>
            <span className="font-heading font-black text-base tracking-widest text-white">
              ESE KOSMO
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {SIDEBAR_NAV.map((item) => {
            const NavIcon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  setSidebarOpen(false);
                  if (item.id === 'acoes') {
                    setHubSection('hub');
                  } else {
                    showEphemeralToast(
                      `Seção "${item.label}"`,
                      'Protótipo focado no módulo de Ações.'
                    );
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#4850FF]/15 text-white border border-[#4850FF]/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <NavIcon
                  className={`w-4 h-4 shrink-0 ${active ? 'text-[#98A9FF]' : 'text-gray-500'}`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2.5">
          <a
            href="/ese-kosmo-acoes-standalone.html"
            download="ese-kosmo-acoes-index.html"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[11px] font-semibold text-gray-400 hover:text-white transition-colors"
            title="Exportar versão standalone em arquivo único HTML"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Baixar index.html (Demo)</span>
          </a>

          <button
            type="button"
            onClick={() => showEphemeralToast('Sessão demo ativa', 'Dados armazenados em memória.')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Sticky Responsive Top Header (Item 9) */}
        <header className="sticky top-0 z-30 bg-[#0B0F10]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          {/* Left: Menu + Back + Title & XP Strip (no ugly truncation on 360px) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white shrink-0"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {hubSection !== 'hub' && (
              <button
                type="button"
                onClick={() => setHubSection('hub')}
                className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Voltar para a Tela Inicial de Ações (/acoes)"
                aria-label="Voltar ao Hub de Ações"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-heading font-black text-sm sm:text-xl tracking-wide text-white whitespace-nowrap">
                  {hubSection === 'hub'
                    ? 'AÇÕES'
                    : hubSection === 'explorer'
                    ? 'EXPLORADOR'
                    : 'MINHAS AÇÕES'}
                </h1>
                {hubSection !== 'hub' && (
                  <span className="hidden md:inline-block text-[11px] font-semibold text-gray-500 truncate">
                    /{' '}
                    {hubSection === 'explorer'
                      ? 'Pastas Infinitas'
                      : ACTION_TYPE_META[typeFilter as ActionType]?.tabLabel ?? typeFilter}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-400 tabular-nums whitespace-nowrap">
                <span className="text-amber-300 font-bold">{userStats.xp_total} XP</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#98A9FF] font-bold">{userStats.ese_total} E$E</span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span className="hidden sm:inline">
                  {hubSection === 'workspace' ? filteredActions.length : actions.length}{' '}
                  {(hubSection === 'workspace' ? filteredActions.length : actions.length) === 1
                    ? 'item'
                    : 'itens'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Smart Bell + Compact Persona Card */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
            {/* Notification Bell (Only Important Events — Item 5) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#14181b] hover:bg-[#1c2126] border border-white/10 flex items-center justify-center text-gray-200 hover:text-white transition-colors cursor-pointer"
                aria-label="Notificações importantes"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#4850FF] text-[10px] font-black text-white flex items-center justify-center tabular-nums shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80 bg-[#121619] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs font-heading font-black uppercase tracking-wider text-white">
                      Marcos &amp; Alertas
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                      }
                      className="text-[11px] font-semibold text-[#98A9FF] hover:text-white cursor-pointer"
                    >
                      Marcar lidas
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-gray-500 text-center">
                        Nenhum marco recente.
                      </p>
                    ) : (
                      notifications.map((n) => {
                        const badge = getCategoryNotifBadge(n.category);
                        return (
                          <div
                            key={n.id}
                            className={`p-3.5 text-xs ${
                              n.read ? 'opacity-65' : 'bg-[#4850FF]/[0.07]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black border shrink-0 ${badge.badgeClass}`}
                                >
                                  {badge.label}
                                </span>
                                <span className="font-bold text-white truncate">{n.title}</span>
                              </div>
                              <span className="text-[10px] text-gray-500 shrink-0">
                                {n.timestamp}
                              </span>
                            </div>
                            {n.subtitle && (
                              <p className="text-[11px] text-gray-400 mt-1">{n.subtitle}</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Compact User Persona Card */}
            <div className="flex items-center gap-2 sm:gap-3 bg-[#121619] border border-white/10 rounded-xl px-2.5 sm:px-3 py-1.5">
              <div className="hidden sm:block text-right space-y-0.5">
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="font-bold text-white">{userStats.nickname}</span>
                  <span className="text-[#98A9FF] font-mono font-bold tabular-nums">
                    NVL {userStats.level}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2.5 text-[10px] tabular-nums">
                  <span className="flex items-center gap-1 text-red-400 font-bold">
                    <Heart className="w-3 h-3" /> {userStats.hp}/100 HP
                  </span>
                  <span className="text-orange-400 font-bold">
                    {userStats.streak_days}d Ofensiva
                  </span>
                </div>
              </div>
              <div className="flex sm:hidden flex-col items-end leading-tight tabular-nums">
                <span className="text-[10px] font-black text-[#98A9FF]">
                  NVL {userStats.level}
                </span>
                <span className="text-[9px] font-bold text-red-400">{userStats.hp} HP</span>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#4850FF] to-[#01055B] border border-[#98A9FF]/40 flex items-center justify-center text-[11px] sm:text-xs font-black text-white shrink-0">
                {userStats.nickname.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content (generous pb-32 for mobile floating pill + FAB) */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 pb-32 lg:pb-24 space-y-8">
          {/* ═══════════════════════════════════════════════════════════════════════
              VIEW A: HUB PRINCIPAL (/acoes) — Item 1 & Item 2
             ═══════════════════════════════════════════════════════════════════════ */}
          {hubSection === 'hub' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* SEÇÃO SUPERIOR: EXPLORADOR DE PASTAS E AÇÕES */}
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading font-black text-sm tracking-widest uppercase text-[#98A9FF]">
                      Explorador de Pastas e Ações
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Crie pastas e subpastas infinitas estilo Windows Explorer e organize ações em
                      múltiplas pastas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHubSection('explorer')}
                    className="px-3.5 py-2 rounded-xl bg-[#4850FF]/15 hover:bg-[#4850FF]/25 border border-[#4850FF]/40 text-xs font-bold text-[#98A9FF] hover:text-white transition-colors cursor-pointer"
                  >
                    Abrir Explorador Completo →
                  </button>
                </div>

                {/* Top 4 Quick Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewFolderInput(true);
                      setNewFolderParentId(null);
                      setHubSection('explorer');
                    }}
                    className="group bg-[#111618] hover:bg-[#151b1e] border border-white/10 hover:border-[#4850FF]/50 rounded-2xl p-4 text-left transition-all flex flex-col gap-3 cursor-pointer"
                  >
                    <div className="h-20 sm:h-24 rounded-xl bg-gradient-to-br from-[#01055B]/70 to-[#14191e] border border-white/5 flex items-center justify-center relative overflow-hidden">
                      <div className="flex items-center gap-2 transition-transform duration-300 group-hover:scale-110">
                        <FolderPlus className="w-8 h-8 sm:w-9 sm:h-9 text-[#98A9FF]" />
                        <Plus className="w-5 h-5 text-white bg-[#4850FF] rounded-full p-0.5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-xs tracking-wider uppercase text-white">
                        CRIAR NOVA PASTA/AÇÃO
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Crie pastas raiz, subpastas infinitas ou lance uma nova ação imediata.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExplorerEditMode(false);
                      setExplorerDeleteMode(false);
                      setHubSection('explorer');
                    }}
                    className="group bg-[#111618] hover:bg-[#151b1e] border border-white/10 hover:border-sky-400/50 rounded-2xl p-4 text-left transition-all flex flex-col gap-3 cursor-pointer"
                  >
                    <div className="h-20 sm:h-24 rounded-xl bg-gradient-to-br from-sky-950/60 to-[#14191e] border border-white/5 flex items-center justify-center overflow-hidden">
                      <div className="flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1">
                        <FolderOpen className="w-8 h-8 sm:w-9 sm:h-9 text-sky-400" />
                        <ChevronRight className="w-5 h-5 text-sky-300" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-xs tracking-wider uppercase text-white">
                        EXPLORAR PASTAS/AÇÕES
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Navegue pelas subpastas e arraste cards para reordenar ou vincular pastas.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExplorerEditMode(true);
                      setExplorerDeleteMode(false);
                      setHubSection('explorer');
                    }}
                    className="group bg-[#111618] hover:bg-[#151b1e] border border-white/10 hover:border-amber-400/50 rounded-2xl p-4 text-left transition-all flex flex-col gap-3 cursor-pointer"
                  >
                    <div className="h-20 sm:h-24 rounded-xl bg-gradient-to-br from-amber-950/50 to-[#14191e] border border-white/5 flex items-center justify-center overflow-hidden">
                      <FolderEdit className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400 transition-transform duration-300 group-hover:-rotate-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-xs tracking-wider uppercase text-white">
                        EDITAR PASTAS/AÇÕES
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Renomeie pastas existentes ou abra múltiplos rascunhos em abas.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExplorerDeleteMode(true);
                      setExplorerEditMode(false);
                      setHubSection('explorer');
                    }}
                    className="group bg-[#111618] hover:bg-[#151b1e] border border-white/10 hover:border-red-400/50 rounded-2xl p-4 text-left transition-all flex flex-col gap-3 cursor-pointer"
                  >
                    <div className="h-20 sm:h-24 rounded-xl bg-gradient-to-br from-red-950/50 to-[#14191e] border border-white/5 flex items-center justify-center overflow-hidden">
                      <Trash2 className="w-8 h-8 sm:w-9 sm:h-9 text-red-400 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-xs tracking-wider uppercase text-white">
                        DELETAR PASTAS/AÇÕES
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Limpe pastas antigas ou remova ações concluídas e obsoletas.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Compact Interactive Folder Strip inside Hub Home */}
                <div className="bg-[#111618] border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                      <FolderOpen className="w-4 h-4 text-[#98A9FF]" />
                      <span>Pastas &amp; Subpastas Rápidas</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Nova pasta (ex: Faculdade)..."
                        className="flex-1 sm:flex-none bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4850FF]"
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateFolder(null)}
                        className="px-3 py-1.5 rounded-lg bg-[#4850FF] hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Criar Pasta
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {folders.map((folder) => {
                      const descendantIds = new Set(getDescendantFolderIds(folders, folder.id));
                      const count = actions.filter((a) =>
                        a.folderIds.some((fid) => descendantIds.has(fid))
                      ).length;
                      const isDragOver = dragOverFolderId === folder.id;
                      const pathLabel = getFolderPathLabel(folders, folder.id);
                      return (
                        <div
                          key={folder.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverFolderId(folder.id);
                          }}
                          onDragLeave={() => setDragOverFolderId(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverFolderId(null);
                            if (draggedActionId) {
                              handleAddActionToFolderDrop(draggedActionId, folder.id);
                              setDraggedActionId(null);
                            }
                          }}
                          onClick={() => {
                            setSelectedFolderId(folder.id);
                            setHubSection('explorer');
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                            isDragOver
                              ? 'bg-[#4850FF]/25 border-[#4850FF] scale-[1.02]'
                              : 'bg-black/35 border-white/10 hover:border-white/25 hover:bg-black/55'
                          }`}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${folder.color}22` }}
                          >
                            <span
                              className="flex items-center"
                              style={{ color: folder.color }}
                            >
                              <Folder className="w-5 h-5" />
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{folder.name}</p>
                            {folder.parent_folder_id && (
                              <p className="text-[9px] text-gray-500 truncate">{pathLabel}</p>
                            )}
                            <p className="text-[10px] text-gray-400 tabular-nums">
                              {count} {count === 1 ? 'ação' : 'ações'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* SEÇÃO INFERIOR: ATALHOS DE VISUALIZAÇÃO HERO (1.35fr) + CARDS DE CATEGORIAS (1fr + 1fr) */}
              <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_2fr] gap-4 items-stretch">
                {/* Left Column (1.35fr): 4 Hero Visualization Cards with Thematic Gradients, Watermarks & Hover Lift */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-4 gap-4 h-full">
                  {HUB_VISUALIZATION_CARDS.map((vis) => {
                    const VisIcon = vis.icon;
                    return (
                      <button
                        key={vis.id}
                        type="button"
                        onClick={() =>
                          vis.id === 'explorer'
                            ? setHubSection('explorer')
                            : openWorkspaceWith('todas', vis.id)
                        }
                        className={`group relative overflow-hidden ${vis.heroGradientClass} border border-white/10 ${vis.hoverBorder} rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between gap-4 cursor-pointer h-full`}
                      >
                        {/* Giant Translucent Watermark Icon */}
                        <VisIcon
                          className={`w-32 h-32 sm:w-36 sm:h-36 absolute -right-4 -bottom-5 pointer-events-none opacity-[0.07] group-hover:opacity-[0.14] group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 ${vis.iconClass}`}
                        />

                        <div className="relative z-10 flex items-start justify-between gap-3 w-full">
                          <div
                            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${vis.iconBoxClass}`}
                          >
                            <VisIcon className={`w-6 h-6 ${vis.iconClass}`} />
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${vis.badgeClass}`}
                          >
                            {vis.badge}
                          </span>
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-heading font-black text-sm tracking-widest uppercase text-white">
                              {vis.title}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                          </div>
                          <p className="text-xs text-gray-300/90 mt-1.5 leading-relaxed">
                            {vis.description}
                          </p>
                        </div>

                        <div className="relative z-10 text-[9px] text-gray-400 font-bold tracking-widest uppercase pt-3 border-t border-white/10 w-full">
                          {vis.tags}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Grid (2fr -> two 1fr columns): 8 Existing Category Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-rows-4 gap-4 h-full">
                  {HUB_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => openWorkspaceWith(cat.id, 'tabela')}
                        className={`bg-[#111618] hover:bg-[#151b1e] border border-white/10 ${cat.hoverBorder} rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between gap-4 cursor-pointer h-full`}
                      >
                        <div className="flex items-start justify-between gap-3 w-full">
                          <div
                            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${cat.iconBoxClass}`}
                          >
                            <CatIcon className={`w-6 h-6 ${cat.iconClass}`} />
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${cat.badgeClass}`}
                          >
                            {cat.badge}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-heading font-black text-sm tracking-widest uppercase text-white">
                              {cat.title}
                            </h3>
                            <span className="text-xs font-mono font-bold text-[#98A9FF] tabular-nums">
                              {filterCounts[cat.id]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                            {cat.description}
                          </p>
                        </div>

                        <div className="text-[9px] text-gray-500 font-bold tracking-widest uppercase pt-3 border-t border-white/5 w-full">
                          {cat.tags}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════
              VIEW B: WINDOWS EXPLORER DE PASTAS INFINITAS & DRAG-AND-DROP BIDIRECIONAL
             ═══════════════════════════════════════════════════════════════════════ */}
          {hubSection === 'explorer' && (
            <div className="max-w-7xl mx-auto space-y-5">
              {/* Top Explorer Breadcrumbs & Toolbar (Item 2) */}
              <div className="bg-[#111618] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-300 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId('all')}
                    className="hover:text-white font-bold cursor-pointer"
                  >
                    Meu Kosmo
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId('all')}
                    className="hover:text-white font-bold cursor-pointer"
                  >
                    Ações
                  </button>
                  {selectedFolderId === 'loose' && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="text-sky-300 font-bold">Cards Soltos (Sem Pasta)</span>
                    </>
                  )}
                  {explorerBreadcrumb.map((crumb, idx) => {
                    const isLast = idx === explorerBreadcrumb.length - 1;
                    return (
                      <React.Fragment key={crumb.id}>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <button
                          type="button"
                          onClick={() => setSelectedFolderId(crumb.id)}
                          className={`font-bold cursor-pointer truncate max-w-[140px] ${
                            isLast ? 'text-[#98A9FF]' : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          {crumb.name}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewFolderParentId(
                        selectedFolderId !== 'all' && selectedFolderId !== 'loose'
                          ? selectedFolderId
                          : null
                      );
                      setShowNewFolderInput((v) => !v);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#4850FF] hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>
                      {selectedFolderId !== 'all' && selectedFolderId !== 'loose'
                        ? 'Nova Subpasta'
                        : 'Nova Pasta'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExplorerEditMode((v) => !v);
                      setExplorerDeleteMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                      explorerEditMode
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-white/5 border-white/10 text-gray-300'
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar Pastas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExplorerDeleteMode((v) => !v);
                      setExplorerEditMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer ${
                      explorerDeleteMode
                        ? 'bg-red-500/20 border-red-400 text-red-300'
                        : 'bg-white/5 border-white/10 text-gray-300'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Modo Deletar
                  </button>
                </div>
              </div>

              {showNewFolderInput && (
                <div className="bg-[#14191e] border border-[#4850FF]/40 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#98A9FF]">
                      {newFolderParentId
                        ? `Criar subpasta dentro de: ${getFolderPathLabel(
                            folders,
                            newFolderParentId
                          )}`
                        : 'Criar pasta na raiz'}
                    </span>
                    <select
                      value={newFolderParentId ?? ''}
                      onChange={(e) =>
                        setNewFolderParentId(e.target.value ? e.target.value : null)
                      }
                      aria-label="Pasta pai"
                      className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-gray-200"
                    >
                      <option value="">Raiz (Nível principal)</option>
                      {flatFolders.map(({ folder, pathLabel }) => (
                        <option key={folder.id} value={folder.id}>
                          Dentro de: {pathLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Nome da pasta ou subpasta..."
                      className="flex-1 min-w-[200px] bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#4850FF]"
                    />
                    <div className="flex items-center gap-1.5">
                      {['#4850FF', '#38BDF8', '#A855F7', '#22C55E', '#F97316', '#EF4444'].map(
                        (c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewFolderColor(c)}
                            className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                              newFolderColor === c
                                ? 'border-white scale-110'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                            aria-label={`Cor ${c}`}
                          />
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCreateFolder()}
                      className="px-4 py-2 rounded-xl bg-[#4850FF] hover:bg-blue-500 text-white text-xs font-black uppercase cursor-pointer"
                    >
                      Salvar Pasta
                    </button>
                  </div>
                </div>
              )}

              {/* Windows Explorer Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Recursive Folder Tree (Dropzones!) */}
                <div className="lg:col-span-4 bg-[#111618] border border-white/10 rounded-2xl p-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1 pb-1">
                    Árvore Infinita de Pastas (Solte cards aqui)
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedFolderId('all')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedFolderId === 'all'
                        ? 'bg-[#4850FF]/20 text-white border border-[#4850FF]/40'
                        : 'text-gray-300 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <LayoutGrid className="w-4 h-4 text-[#98A9FF]" />
                      Todas as Pastas e Ações
                    </span>
                    <span className="font-mono text-[11px] text-gray-400 tabular-nums">
                      {actions.length}
                    </span>
                  </button>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverFolderId('loose');
                    }}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverFolderId(null);
                      if (draggedActionId) {
                        handleAddActionToFolderDrop(draggedActionId, null);
                        setDraggedActionId(null);
                      }
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId('loose')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        dragOverFolderId === 'loose'
                          ? 'bg-sky-500/25 border border-sky-400 text-white'
                          : selectedFolderId === 'loose'
                          ? 'bg-[#4850FF]/20 text-white border border-[#4850FF]/40'
                          : 'text-gray-300 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <ListTodo className="w-4 h-4 text-sky-400" />
                        Cards Soltos (Sem Pasta)
                      </span>
                      <span className="font-mono text-[11px] text-gray-400 tabular-nums">
                        {actions.filter((a) => a.folderIds.length === 0).length}
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1.5">
                    {renderFolderTreeNodes(null, 0)}
                  </div>
                </div>

                {/* Right Pane: Child Subfolders + Bidirectional Draggable Action Cards */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filtrar ações nesta pasta..."
                        className="w-full bg-[#111618] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4850FF]"
                      />
                    </div>
                    <span className="text-[11px] text-gray-400">
                      Arraste cards entre si para reordenar ou solte em pastas à esquerda
                    </span>
                  </div>

                  {/* Direct Subfolders Strip (Windows Explorer tiles) */}
                  {explorerChildFolders.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                        Subpastas ({explorerChildFolders.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {explorerChildFolders.map((sub) => {
                          const descIds = new Set(getDescendantFolderIds(folders, sub.id));
                          const subCount = actions.filter((a) =>
                            a.folderIds.some((fid) => descIds.has(fid))
                          ).length;
                          const isOver = dragOverFolderId === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverFolderId(sub.id);
                              }}
                              onDragLeave={() => setDragOverFolderId(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragOverFolderId(null);
                                if (draggedActionId) {
                                  handleAddActionToFolderDrop(draggedActionId, sub.id);
                                  setDraggedActionId(null);
                                }
                              }}
                              onClick={() => setSelectedFolderId(sub.id)}
                              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                                isOver
                                  ? 'bg-[#4850FF]/25 border-[#4850FF] scale-[1.02]'
                                  : 'bg-[#121619] border-white/10 hover:border-white/25'
                              }`}
                            >
                              <span
                                className="shrink-0 flex items-center"
                                style={{ color: sub.color }}
                              >
                                <Folder className="w-5 h-5" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{sub.name}</p>
                                <p className="text-[10px] text-gray-400 tabular-nums">
                                  {subCount} {subCount === 1 ? 'ação' : 'ações'}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {explorerActions.length === 0 ? (
                    <div className="bg-[#111618] border border-dashed border-white/15 rounded-2xl p-10 text-center space-y-2">
                      <p className="text-sm font-bold text-white">Pasta vazia</p>
                      <p className="text-xs text-gray-400">
                        Arraste ações para cá, vincule usando o ícone de pasta ou crie uma nova
                        ação no botão flutuante.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {explorerActions.map((action) => {
                        const st = MANAGEMENT_STATUS_MAP[action.management_status];
                        const tm = ACTION_TYPE_META[action.type];
                        const isCardDragTarget = dragOverActionId === action.id;

                        return (
                          <article
                            key={action.id}
                            draggable
                            onDragStart={() => setDraggedActionId(action.id)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (draggedActionId && draggedActionId !== action.id) {
                                setDragOverActionId(action.id);
                              }
                            }}
                            onDragLeave={() => setDragOverActionId(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverActionId(null);
                              if (draggedActionId && draggedActionId !== action.id) {
                                handleReorderActions(draggedActionId, action.id);
                                setDraggedActionId(null);
                              }
                            }}
                            onDragEnd={() => {
                              setDraggedActionId(null);
                              setDragOverFolderId(null);
                              setDragOverActionId(null);
                            }}
                            className={`bg-[#121619] border rounded-2xl p-4 space-y-3 cursor-grab active:cursor-grabbing transition-all ${
                              isCardDragTarget
                                ? 'border-[#4850FF] bg-[#4850FF]/15 ring-2 ring-[#4850FF]/40'
                                : 'border-white/10 hover:border-white/25'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <GripVertical className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <h3
                                    onClick={() => handleOpenEdit(action)}
                                    className="font-bold text-sm text-white truncate hover:text-[#98A9FF] cursor-pointer"
                                  >
                                    {action.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] tabular-nums">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-black border ${tm.badgeClass}`}
                                    >
                                      {tm.label}
                                    </span>
                                    <span className="text-amber-300 font-bold">
                                      {action.xp_reward} XP
                                    </span>
                                    <span className="text-[#98A9FF] font-bold">
                                      {action.ese_reward} E$E
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${st.dotClass}`}
                                  title={st.label}
                                />
                                {explorerDeleteMode ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAction(action.id)}
                                    className="p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 cursor-pointer"
                                    title="Deletar ação"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(action)}
                                    className="p-1 text-gray-400 hover:text-white cursor-pointer"
                                    title="Editar ação"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Multi-Folder Badges + FolderPlus Popover (Item 6) */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px]">
                              <div className="flex flex-wrap items-center gap-1 min-w-0">
                                {action.folderIds.length === 0 ? (
                                  <span className="text-gray-500 italic text-[10px]">
                                    Solta (Sem pasta)
                                  </span>
                                ) : (
                                  action.folderIds.map((fid) => {
                                    const fObj = folders.find((f) => f.id === fid);
                                    if (!fObj) return null;
                                    return (
                                      <span
                                        key={fid}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-200 max-w-[140px] truncate"
                                        title={getFolderPathLabel(folders, fid)}
                                      >
                                        <span
                                          className="w-1.5 h-1.5 rounded-full shrink-0"
                                          style={{ backgroundColor: fObj.color }}
                                        />
                                        <span className="truncate">{fObj.name}</span>
                                      </span>
                                    );
                                  })
                                )}
                              </div>

                              <FolderAssignPopover
                                folders={folders}
                                selectedFolderIds={action.folderIds}
                                onChangeFolderIds={(next) =>
                                  handleSetActionFolders(action.id, next)
                                }
                                compact
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════
              VIEW C: WORKSPACE (TABELA · CALENDÁRIO · CRONOLOGIA)
             ═══════════════════════════════════════════════════════════════════════ */}
          {hubSection === 'workspace' && (
            <div className="space-y-6">
              {/* Type Filters (Horizontally Scrollable on Mobile) + Search + View Switcher */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:pb-0">
                  {TYPE_FILTERS.map((tf) => {
                    const active = typeFilter === tf.id;
                    return (
                      <button
                        key={tf.id}
                        type="button"
                        onClick={() => setTypeFilter(tf.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase border transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#4850FF]/20 border-[#4850FF] text-white shadow-[0_0_12px_rgba(72,80,255,0.2)]'
                            : 'bg-[#121619] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span>{tf.label}</span>
                        <span
                          className={`text-[10px] font-mono tabular-nums ${
                            active ? 'text-[#98A9FF]' : 'text-gray-500'
                          }`}
                        >
                          {filterCounts[tf.id]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 flex-1">
                    <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por título, pilar ou vocação..."
                        className="w-full bg-[#121619] border border-white/10 focus:border-[#4850FF] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-2 bg-[#121619] border border-white/10 rounded-xl px-3 py-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          statusFilter === 'todos'
                            ? 'bg-white/40'
                            : MANAGEMENT_STATUS_MAP[statusFilter].dotClass
                        }`}
                      />
                      <select
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(e.target.value as 'todos' | ManagementStatus)
                        }
                        aria-label="Filtrar por Status Gerencial"
                        className="bg-transparent text-xs font-semibold text-gray-200 focus:outline-none cursor-pointer w-full sm:w-auto"
                      >
                        <option value="todos" className="bg-[#111618]">
                          Todos os Status
                        </option>
                        {(Object.keys(MANAGEMENT_STATUS_MAP) as ManagementStatus[]).map((key) => (
                          <option key={key} value={key} className="bg-[#111618]">
                            {MANAGEMENT_STATUS_MAP[key].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {viewMode === 'tabela' && (
                      <div className="flex items-center gap-2 bg-[#121619] border border-white/10 rounded-xl px-3 py-2">
                        <Folder className="w-3.5 h-3.5 text-[#98A9FF] shrink-0" />
                        <select
                          value={tableFolderFilter}
                          onChange={(e) => setTableFolderFilter(e.target.value)}
                          aria-label="Filtrar tabela por pasta"
                          className="bg-transparent text-xs font-semibold text-gray-200 focus:outline-none cursor-pointer w-full sm:w-auto max-w-[220px]"
                        >
                          <option value="all" className="bg-[#111618]">
                            Todas as Pastas
                          </option>
                          <option value="loose" className="bg-[#111618]">
                            Soltas (Sem pasta)
                          </option>
                          {flatFolders.map(({ folder, pathLabel }) => (
                            <option key={folder.id} value={folder.id} className="bg-[#111618]">
                              {pathLabel}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 3-Mode View Switcher (Responsive horizontal scroll on narrow mobile) */}
                  <div
                    className="flex items-center p-1 bg-[#121619] border border-white/10 rounded-xl overflow-x-auto no-scrollbar max-w-full self-start xl:self-auto"
                    role="tablist"
                    aria-label="Modo de visualização"
                  >
                    {(
                      [
                        { id: 'tabela', label: 'Modo Tabela', icon: Table2 },
                        { id: 'calendario', label: 'Modo Calendário', icon: CalendarIcon },
                        { id: 'cronologia', label: 'Modo Cronologia', icon: Clock },
                      ] as {
                        id: ViewMode;
                        label: string;
                        icon: React.ComponentType<{ className?: string }>;
                      }[]
                    ).map((mode) => {
                      const ModeIcon = mode.icon;
                      const active = viewMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setViewMode(mode.id)}
                          className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-[#4850FF] text-white shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <ModeIcon className="w-3.5 h-3.5" />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {filteredActions.length === 0 ? (
                <div className="bg-[#121619] border border-white/10 rounded-2xl p-10 text-center space-y-3">
                  <p className="text-sm font-bold text-white">
                    Nenhuma ação encontrada com os filtros atuais
                  </p>
                  <p className="text-xs text-gray-400">
                    Ajuste a busca, o filtro de status/pasta ou crie uma nova ação usando o botão
                    flutuante.
                  </p>
                  {(tableFolderFilter !== 'all' || statusFilter !== 'todos' || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTableFolderFilter('all');
                        setStatusFilter('todos');
                        setSearchQuery('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#4850FF]/20 border border-[#4850FF]/40 text-xs font-bold text-[#98A9FF] hover:text-white cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* ── VIEW 1: MODO TABELA PROFISSIONAL COM SUBTAREFAS E DRAG-AND-DROP ── */}
                  {viewMode === 'tabela' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                          <span className="text-xs font-semibold text-[#98A9FF]">
                            Modo Tabela — arraste linhas para reordenar · expanda + para subtarefas
                          </span>
                          <span className="text-[11px] text-gray-500 tabular-nums">
                            {filteredActions.length} ações listadas
                          </span>
                        </div>

                        <div className="bg-[#0e1215] border border-white/15 rounded-2xl overflow-hidden shadow-lg">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-white/15 text-[11px] font-bold uppercase tracking-wider text-gray-300 bg-[#151a1f] divide-x divide-white/[0.08]">
                                  <th className="py-3 px-3 w-10 text-center">#</th>
                                  <th className="py-3 px-4">Status</th>
                                  <th className="py-3 px-4">Ação / Subtarefas</th>
                                  <th className="py-3 px-4">Tipo</th>
                                  <th className="py-3 px-4">Pilar</th>
                                  <th className="py-3 px-4">Prazo / Freq.</th>
                                  <th className="py-3 px-4">XP / E$E</th>
                                  <th className="py-3 px-4">Ref. / Progresso</th>
                                  <th className="py-3 px-3 text-center">Pastas / Editar</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.08] text-xs">
                                {filteredActions.map((action) => {
                                  const st = MANAGEMENT_STATUS_MAP[action.management_status];
                                  const tm = ACTION_TYPE_META[action.type];
                                  const done = action.status === 'concluido';
                                  const { reqs, linkedFazers, totalCount } =
                                    getActionSubtasks(action);
                                  const hasSubtasks = totalCount > 0;
                                  const isRowExpanded = Boolean(expandedTableRows[action.id]);
                                  const doneSubtasks =
                                    reqs.filter((r) => r.done).length +
                                    linkedFazers.filter((f) => f.status === 'concluido').length;
                                  const isDragTarget = dragOverActionId === action.id;

                                  return (
                                    <React.Fragment key={action.id}>
                                      <tr
                                        draggable
                                        onDragStart={() => setDraggedActionId(action.id)}
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          setDragOverActionId(action.id);
                                        }}
                                        onDragLeave={() => setDragOverActionId(null)}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          setDragOverActionId(null);
                                          if (draggedActionId) {
                                            handleReorderActions(draggedActionId, action.id);
                                            setDraggedActionId(null);
                                          }
                                        }}
                                        className={`divide-x divide-white/[0.06] transition-colors ${
                                          isDragTarget
                                            ? 'bg-[#4850FF]/20 outline outline-1 outline-[#4850FF]'
                                            : 'hover:bg-white/[0.03]'
                                        } ${done ? 'opacity-65' : ''}`}
                                      >
                                        <td className="py-3 px-2 text-center">
                                          <span
                                            className="inline-flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-200"
                                            title="Arraste para reordenar"
                                          >
                                            <GripVertical className="w-4 h-4" />
                                          </span>
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap">
                                          <span className="inline-flex items-center gap-2">
                                            <span
                                              className={`w-2.5 h-2.5 rounded-full ${st.dotClass}`}
                                            />
                                            <span className={`font-semibold ${st.textClass}`}>
                                              {st.shortLabel}
                                            </span>
                                          </span>
                                        </td>

                                        <td className="py-3 px-4 min-w-[240px]">
                                          <div className="flex items-center gap-2.5">
                                            {hasSubtasks ? (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setExpandedTableRows((prev) => ({
                                                    ...prev,
                                                    [action.id]: !prev[action.id],
                                                  }))
                                                }
                                                className="w-5 h-5 rounded border border-white/20 bg-white/5 hover:bg-[#4850FF]/30 hover:border-[#4850FF] flex items-center justify-center text-gray-200 shrink-0 cursor-pointer"
                                                title={
                                                  isRowExpanded
                                                    ? 'Recolher subtarefas'
                                                    : 'Expandir subtarefas'
                                                }
                                                aria-label="Expandir subtarefas"
                                              >
                                                {isRowExpanded ? (
                                                  <Minus className="w-3 h-3" />
                                                ) : (
                                                  <Plus className="w-3 h-3" />
                                                )}
                                              </button>
                                            ) : (
                                              <span className="w-5 shrink-0" />
                                            )}

                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleToggleActionComplete(action.id)
                                              }
                                              className="shrink-0 transition-transform active:scale-90 cursor-pointer"
                                              aria-label={`Concluir ${action.title}`}
                                            >
                                              {done ? (
                                                <div className="w-5 h-5 rounded bg-[#4850FF] flex items-center justify-center">
                                                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                                                </div>
                                              ) : (
                                                <div className="w-5 h-5 rounded bg-black/40 border border-white/20 flex items-center justify-center">
                                                  <Square className="w-3.5 h-3.5 text-gray-500" />
                                                </div>
                                              )}
                                            </button>

                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-2">
                                                <p
                                                  className={`font-bold text-sm truncate ${
                                                    done
                                                      ? 'line-through text-gray-500'
                                                      : 'text-white'
                                                  }`}
                                                >
                                                  {action.title}
                                                </p>
                                                {hasSubtasks && (
                                                  <span className="text-[10px] font-mono text-gray-400 tabular-nums shrink-0">
                                                    {doneSubtasks}/{totalCount}
                                                  </span>
                                                )}
                                              </div>
                                              {action.description && (
                                                <p className="text-[11px] text-gray-500 truncate max-w-xs">
                                                  {action.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap">
                                          <span
                                            className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border ${tm.badgeClass}`}
                                          >
                                            {tm.label}
                                          </span>
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap">
                                          <span
                                            className={`px-2.5 py-1 rounded text-[10px] font-black uppercase text-white ${getPillarColorClass(
                                              action.pillars[0] ?? ''
                                            )}`}
                                          >
                                            {action.pillars[0] ?? 'GERAL'}
                                          </span>
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap font-mono text-gray-300 tabular-nums">
                                          {action.due_time || 'Flexível'}
                                          {action.frequency?.timeExpectation
                                            ? ` · ${action.frequency.timeExpectation}`
                                            : ''}
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap font-bold tabular-nums">
                                          <span className="text-amber-300">
                                            XP: {action.xp_reward}
                                          </span>
                                          <span className="text-gray-500 mx-1.5">·</span>
                                          <span className="text-[#98A9FF]">
                                            {action.ese_reward} E$E
                                          </span>
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap">
                                          {hasSubtasks ? (
                                            <div className="flex items-center gap-2 tabular-nums">
                                              <div className="w-16 h-2 bg-white/15 rounded-full overflow-hidden">
                                                <div
                                                  className={`h-full ${
                                                    action.type === 'boss'
                                                      ? 'bg-red-500'
                                                      : action.type === 'conquista'
                                                      ? 'bg-yellow-500'
                                                      : 'bg-purple-500'
                                                  }`}
                                                  style={{
                                                    width: `${Math.round(
                                                      (doneSubtasks / totalCount) * 100
                                                    )}%`,
                                                  }}
                                                />
                                              </div>
                                              <span className="text-[11px] font-bold text-gray-300">
                                                {doneSubtasks}/{totalCount}
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="px-2.5 py-1 rounded bg-sky-500/15 text-sky-300 text-[10px] font-bold">
                                              REF: {action.reference_title || 'NENHUM'}
                                            </span>
                                          )}
                                        </td>

                                        <td className="py-3 px-3 text-center whitespace-nowrap">
                                          <div className="inline-flex items-center gap-1">
                                            <FolderAssignPopover
                                              folders={folders}
                                              selectedFolderIds={action.folderIds}
                                              onChangeFolderIds={(next) =>
                                                handleSetActionFolders(action.id, next)
                                              }
                                              compact
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEdit(action)}
                                              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                              aria-label={`Editar ${action.title}`}
                                            >
                                              <MoreVertical className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>

                                      {hasSubtasks && isRowExpanded && (
                                        <>
                                          {reqs.map((req, rIdx) => (
                                            <tr
                                              key={req.id}
                                              className="bg-[#090c0e] divide-x divide-white/[0.05] text-[11px]"
                                            >
                                              <td className="py-2.5 px-2 text-center text-gray-600 font-mono tabular-nums">
                                                {rIdx + 1}
                                              </td>
                                              <td className="py-2.5 px-4 whitespace-nowrap">
                                                <span
                                                  className={`inline-flex items-center gap-1.5 ${
                                                    req.done
                                                      ? 'text-emerald-400'
                                                      : 'text-gray-400'
                                                  }`}
                                                >
                                                  <span
                                                    className={`w-2 h-2 rounded-full ${
                                                      req.done
                                                        ? 'bg-emerald-500'
                                                        : 'bg-gray-500'
                                                    }`}
                                                  />
                                                  {req.done ? 'Concluída' : 'Aberta'}
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-4 pl-10">
                                                <div className="flex items-center gap-2.5">
                                                  <span className="text-gray-600 font-mono select-none">
                                                    └─
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleToggleRequirement(action.id, req.id)
                                                    }
                                                    className="shrink-0 cursor-pointer"
                                                  >
                                                    {req.done ? (
                                                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                                                    ) : (
                                                      <Square className="w-4 h-4 text-gray-500" />
                                                    )}
                                                  </button>
                                                  <span
                                                    className={`font-semibold ${
                                                      req.done
                                                        ? 'line-through text-gray-500'
                                                        : 'text-gray-200'
                                                    }`}
                                                  >
                                                    {req.title}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="py-2.5 px-4 text-gray-500 uppercase font-bold text-[10px]">
                                                SUB-REQ
                                              </td>
                                              <td className="py-2.5 px-4 text-gray-500">—</td>
                                              <td className="py-2.5 px-4 font-mono text-gray-400 tabular-nums">
                                                {req.timeLabel || 'Sem horário'}
                                              </td>
                                              <td className="py-2.5 px-4 font-bold tabular-nums">
                                                <span className="text-amber-300/80">
                                                  {req.xp_reward} XP
                                                </span>{' '}
                                                ·{' '}
                                                <span className="text-[#98A9FF]/80">
                                                  {req.ese_reward} E$E
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-4 text-gray-500">
                                                {req.source === 'criado'
                                                  ? 'Criado inline'
                                                  : 'Referenciado'}
                                              </td>
                                              <td className="py-2.5 px-3 text-center text-gray-600">
                                                —
                                              </td>
                                            </tr>
                                          ))}

                                          {linkedFazers.map((child) => {
                                            const childDone = child.status === 'concluido';
                                            return (
                                              <tr
                                                key={child.id}
                                                className="bg-[#090c0e] divide-x divide-white/[0.05] text-[11px]"
                                              >
                                                <td className="py-2.5 px-2 text-center text-gray-600">
                                                  •
                                                </td>
                                                <td className="py-2.5 px-4 whitespace-nowrap">
                                                  <span
                                                    className={`inline-flex items-center gap-1.5 ${
                                                      MANAGEMENT_STATUS_MAP[
                                                        child.management_status
                                                      ].textClass
                                                    }`}
                                                  >
                                                    <span
                                                      className={`w-2 h-2 rounded-full ${
                                                        MANAGEMENT_STATUS_MAP[
                                                          child.management_status
                                                        ].dotClass
                                                      }`}
                                                    />
                                                    {
                                                      MANAGEMENT_STATUS_MAP[
                                                        child.management_status
                                                      ].shortLabel
                                                    }
                                                  </span>
                                                </td>
                                                <td className="py-2.5 px-4 pl-10">
                                                  <div className="flex items-center gap-2.5">
                                                    <span className="text-gray-600 font-mono select-none">
                                                      └─
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleToggleActionComplete(child.id)
                                                      }
                                                      className="shrink-0 cursor-pointer"
                                                    >
                                                      {childDone ? (
                                                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                                                      ) : (
                                                        <Square className="w-4 h-4 text-gray-500" />
                                                      )}
                                                    </button>
                                                    <span
                                                      className={`font-semibold ${
                                                        childDone
                                                          ? 'line-through text-gray-500'
                                                          : 'text-sky-200'
                                                      }`}
                                                    >
                                                      {child.title}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="py-2.5 px-4 text-sky-400 uppercase font-bold text-[10px]">
                                                  FAZER LINK
                                                </td>
                                                <td className="py-2.5 px-4 text-gray-400">
                                                  {child.pillars[0]}
                                                </td>
                                                <td className="py-2.5 px-4 font-mono text-gray-400 tabular-nums">
                                                  {child.due_time || 'Flexível'}
                                                </td>
                                                <td className="py-2.5 px-4 font-bold tabular-nums">
                                                  <span className="text-amber-300/80">
                                                    {child.xp_reward} XP
                                                  </span>{' '}
                                                  ·{' '}
                                                  <span className="text-[#98A9FF]/80">
                                                    {child.ese_reward} E$E
                                                  </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-sky-400">
                                                  Vinculada
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(child)}
                                                    className="p-1 text-gray-400 hover:text-white cursor-pointer"
                                                  >
                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {missionBossConquistaCards.length > 0 && (
                        <div className="space-y-3">
                          <div className="px-1">
                            <h2 className="font-heading font-black text-base tracking-wide text-white uppercase">
                              Missões, BOSS &amp; Conquistas Expansíveis
                            </h2>
                            <p className="text-xs text-gray-400">
                              Marque os requisitos vinculados para atualizar a barra de progresso ou
                              HP do Boss em tempo real.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                            {missionBossConquistaCards.map((cardAction, index) => (
                              <MissionBossCardPrototype
                                key={cardAction.id}
                                action={cardAction}
                                folders={folders}
                                onToggleRequirement={handleToggleRequirement}
                                onToggleActionComplete={handleToggleActionComplete}
                                onChangeFolderIds={handleSetActionFolders}
                                onEditClick={handleOpenEdit}
                                defaultExpanded={index === 1}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── VIEW 2: MODO CALENDÁRIO GOOGLE AGENDA (Item 4) ───────────────────── */}
                  {viewMode === 'calendario' && (
                    <div className="space-y-5">
                      {/* Header Toolbar */}
                      <div className="bg-[#121619] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="flex items-center p-1 bg-black/45 border border-white/10 rounded-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setCalendarScope('semanal');
                                setCalMonthShowAll(false);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                calendarScope === 'semanal'
                                  ? 'bg-[#4850FF] text-white'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Grade Semanal
                            </button>
                            <button
                              type="button"
                              onClick={() => setCalendarScope('mensal')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                calendarScope === 'mensal'
                                  ? 'bg-[#4850FF] text-white'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Grade Mensal
                            </button>
                          </div>

                          {calendarScope === 'semanal' && (
                            <button
                              type="button"
                              onClick={() => setShowMiniCalMobile((v) => !v)}
                              className="lg:hidden px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-[#98A9FF] flex items-center gap-1.5 cursor-pointer"
                            >
                              <CalendarDays className="w-3.5 h-3.5" />
                              <span>{showMiniCalMobile ? 'Ocultar Mês' : 'Mini Mês'}</span>
                            </button>
                          )}
                        </div>

                        {/* Google Calendar Navigation Arrows (< Novembro de 2026 > or < Semana >) */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCalSelectedIso(TODAY_ISO);
                              setCalYear(2026);
                              setCalMonth(10);
                              setCalMonthShowAll(false);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-[#98A9FF] cursor-pointer"
                          >
                            Hoje
                          </button>

                          <div className="flex items-center gap-1 bg-black/45 border border-white/10 rounded-xl px-1.5 py-1">
                            <button
                              type="button"
                              onClick={() =>
                                calendarScope === 'semanal'
                                  ? setCalSelectedIso(addDaysIso(calSelectedIso, -7))
                                  : navigateCalendarMonth(-1)
                              }
                              aria-label={
                                calendarScope === 'semanal' ? 'Semana anterior' : 'Mês anterior'
                              }
                              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            <span className="px-2 sm:px-3 text-xs sm:text-sm font-heading font-black text-white whitespace-nowrap tabular-nums">
                              {calendarScope === 'semanal'
                                ? `${weekStartLabel} – ${weekEndLabel} ${calYear}`
                                : `${activeCalMonthObj.full} de ${calYear}`}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                calendarScope === 'semanal'
                                  ? setCalSelectedIso(addDaysIso(calSelectedIso, 7))
                                  : navigateCalendarMonth(1)
                              }
                              aria-label={
                                calendarScope === 'semanal' ? 'Próxima semana' : 'Próximo mês'
                              }
                              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* WEEKLY GOOGLE CALENDAR LAYOUT (No JAN-DEZ bar!) */}
                      {calendarScope === 'semanal' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                          {/* Mini Monthly Calendar (Desktop sidebar + Mobile collapsible) */}
                          <div
                            className={`lg:col-span-4 space-y-3 ${
                              showMiniCalMobile ? 'block' : 'hidden lg:block'
                            }`}
                          >
                            <MiniMonthCalendar
                              year={calYear}
                              monthIdx={calMonth}
                              selectedIso={calSelectedIso}
                              actions={filteredActions}
                              onPrevMonth={() => navigateCalendarMonth(-1)}
                              onNextMonth={() => navigateCalendarMonth(1)}
                              onToday={() => {
                                setCalSelectedIso(TODAY_ISO);
                                setCalYear(2026);
                                setCalMonth(10);
                              }}
                              onSelectIso={(iso) => {
                                setCalSelectedIso(iso);
                                const parsed = parseIsoDate(iso);
                                setCalYear(parsed.getFullYear());
                                setCalMonth(parsed.getMonth());
                              }}
                            />

                            <div className="bg-[#121619] border border-white/10 rounded-2xl p-3.5 text-xs space-y-1.5">
                              <p className="font-bold text-white">Dia selecionado</p>
                              <p className="text-[#98A9FF] font-mono tabular-nums">
                                {calSelectedIso} · {calendarSelectedDayCards.length}{' '}
                                {calendarSelectedDayCards.length === 1 ? 'ação' : 'ações'}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                Clique em qualquer dia da barra acima para ver os cards completos
                                abaixo.
                              </p>
                            </div>
                          </div>

                          {/* Right Google Calendar Week Strip + Stacked Chronological Schedule */}
                          <div className="lg:col-span-8 bg-[#121619] border border-white/10 rounded-2xl overflow-hidden">
                            {/* Top 7-Day Selector Bar (DOM..SÁB) */}
                            <div className="grid grid-cols-7 border-b border-white/10 bg-[#0d1014]">
                              {weekDates.map((iso, idx) => {
                                const dayNum = parseInt(iso.split('-')[2] ?? '1', 10);
                                const isSel = iso === calSelectedIso;
                                const isToday = iso === TODAY_ISO;
                                const count = filteredActions.filter((a) =>
                                  doesActionOccurOnDate(a, iso)
                                ).length;
                                return (
                                  <button
                                    key={iso}
                                    type="button"
                                    onClick={() => setCalSelectedIso(iso)}
                                    className={`py-2.5 px-1 flex flex-col items-center gap-1 border-r last:border-r-0 border-white/5 transition-colors cursor-pointer ${
                                      isSel
                                        ? 'bg-[#4850FF]/20'
                                        : 'hover:bg-white/[0.04]'
                                    }`}
                                  >
                                    <span className="text-[10px] font-bold text-gray-400">
                                      {WEEKDAY_HEADERS[idx]}
                                    </span>
                                    <span
                                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-mono font-black tabular-nums ${
                                        isSel
                                          ? 'bg-[#4850FF] text-white'
                                          : isToday
                                          ? 'border border-[#4850FF] text-[#98A9FF]'
                                          : 'text-gray-200'
                                      }`}
                                    >
                                      {dayNum}
                                    </span>
                                    <span className="text-[9px] font-mono text-emerald-400 tabular-nums">
                                      {count > 0 ? `${count}•` : '—'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Stacked Chronological Schedule for Selected Week Day */}
                            <div className="p-4 space-y-2.5 max-h-[380px] overflow-y-auto">
                              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400 pb-1">
                                <span>Agenda Cronológica — {calSelectedIso}</span>
                                <span>{weeklyHourlyRows.length} faixas</span>
                              </div>

                              {weeklyHourlyRows.length === 0 ? (
                                <p className="text-xs text-gray-500 italic py-6 text-center">
                                  Nenhuma ação agendada para este dia da semana.
                                </p>
                              ) : (
                                weeklyHourlyRows.map((row) => (
                                  <div
                                    key={row.slot}
                                    className="flex items-stretch gap-3 border-t border-white/5 pt-2.5"
                                  >
                                    <div className="w-16 sm:w-20 shrink-0 text-right pr-2 pt-1 font-mono text-xs font-bold text-[#98A9FF] tabular-nums">
                                      {row.slot}
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                      {row.items.map((item) => {
                                        const tm = ACTION_TYPE_META[item.type];
                                        const done = item.status === 'concluido';
                                        return (
                                          <div
                                            key={item.id}
                                            onClick={() => handleOpenEdit(item)}
                                            className={`px-3 py-2 rounded-xl border bg-black/35 hover:bg-black/55 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                              tm.borderClass
                                            } ${done ? 'opacity-60' : ''}`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: tm.accentHex }}
                                              />
                                              <span
                                                className={`text-xs font-bold truncate ${
                                                  done
                                                    ? 'line-through text-gray-400'
                                                    : 'text-white'
                                                }`}
                                              >
                                                {item.title}
                                              </span>
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-400 shrink-0 tabular-nums">
                                              {item.due_time || 'Flexível'}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MONTHLY GOOGLE CALENDAR GRID (Mobile-Safe 360px+ & Arrow Header) */}
                      {calendarScope === 'mensal' && (
                        <div className="bg-[#121619] border border-white/10 rounded-2xl p-2.5 sm:p-4 space-y-2">
                          <div className="flex items-center justify-between px-1 pb-1">
                            <span className="text-[11px] font-bold text-gray-400">
                              Clique em um dia para filtrar os cards abaixo
                            </span>
                            <button
                              type="button"
                              onClick={() => setCalMonthShowAll((v) => !v)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                                calMonthShowAll
                                  ? 'bg-[#4850FF] text-white'
                                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {calMonthShowAll ? 'Mostrando Mês Inteiro' : 'Ver Todo o Mês'}
                            </button>
                          </div>

                          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pb-1">
                            {WEEKDAY_HEADERS.map((wd) => (
                              <span
                                key={wd}
                                className="text-[10px] font-black tracking-wider text-gray-400"
                              >
                                {wd}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {monthlyMatrix.map((dayNum, idx) => {
                              if (dayNum === null) {
                                return (
                                  <div
                                    key={`m-empty-${idx}`}
                                    className="min-h-[48px] sm:min-h-[68px] rounded-xl bg-black/15 border border-white/[0.03]"
                                  />
                                );
                              }
                              const cellIso = toIsoDate(calYear, calMonth, dayNum);
                              const matching = filteredActions.filter((a) =>
                                doesActionOccurOnDate(a, cellIso)
                              );
                              const isSelected = !calMonthShowAll && calSelectedIso === cellIso;
                              const isToday = cellIso === TODAY_ISO;

                              return (
                                <button
                                  key={cellIso}
                                  type="button"
                                  onClick={() => {
                                    setCalSelectedIso(cellIso);
                                    setCalMonthShowAll(false);
                                  }}
                                  className={`p-1 sm:p-2 rounded-xl border text-left min-h-[48px] sm:min-h-[68px] flex flex-col justify-between transition-colors cursor-pointer overflow-hidden ${
                                    isSelected
                                      ? 'bg-[#4850FF]/25 border-[#4850FF]'
                                      : isToday
                                      ? 'bg-[#4850FF]/10 border-[#4850FF]/40'
                                      : 'bg-black/30 border-white/5 hover:border-white/20'
                                  }`}
                                >
                                  <span className="text-[11px] sm:text-xs font-mono font-bold text-gray-200 tabular-nums">
                                    {dayNum}
                                  </span>
                                  {matching.length > 0 && (
                                    <>
                                      {/* Compact badge on mobile (<640px) so it never overflows */}
                                      <span className="sm:hidden self-end px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black tabular-nums">
                                        {matching.length}
                                      </span>
                                      {/* Descriptive label on sm+ */}
                                      <span className="hidden sm:inline text-[10px] font-bold text-emerald-400 tabular-nums truncate">
                                        {matching.length}{' '}
                                        {matching.length === 1 ? 'ação' : 'ações'}
                                      </span>
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Selected Day Full Cards Grid (3 columns on desktop — Item 4) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <h3 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                            {calendarScope === 'mensal' && calMonthShowAll
                              ? `Ações de ${activeCalMonthObj.full} de ${calYear}`
                              : `Ações do dia ${calSelectedIso}`}
                          </h3>
                          <span className="text-xs text-gray-400 tabular-nums">
                            {calendarSelectedDayCards.length}{' '}
                            {calendarSelectedDayCards.length === 1 ? 'card' : 'cards'}
                          </span>
                        </div>

                        {calendarSelectedDayCards.length === 0 ? (
                          <div className="bg-[#121619] border border-dashed border-white/10 rounded-2xl p-8 text-center text-xs text-gray-400">
                            Nenhuma ação registrada para esta data com os filtros atuais.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {calendarSelectedDayCards.map((action) => {
                              const st = MANAGEMENT_STATUS_MAP[action.management_status];
                              const done = action.status === 'concluido';
                              const f = action.frequency;
                              const freqText = getFrequencyLabel(action);
                              const chips = [
                                ...(f?.semanalDays ?? []),
                                ...(f?.mensalDays ?? []),
                              ];

                              return (
                                <article
                                  key={action.id}
                                  className={`p-4 rounded-2xl bg-[#14171c] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-3 ${
                                    done ? 'opacity-65' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleActionComplete(action.id)}
                                        className="mt-0.5 shrink-0 cursor-pointer"
                                      >
                                        {done ? (
                                          <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                                          </div>
                                        ) : (
                                          <div className="w-6 h-6 rounded bg-black/40 border border-white/20 flex items-center justify-center">
                                            <Square className="w-4 h-4 text-gray-400" />
                                          </div>
                                        )}
                                      </button>
                                      <div className="min-w-0">
                                        <h4
                                          className={`font-bold text-sm text-white truncate ${
                                            done ? 'line-through text-gray-400' : ''
                                          }`}
                                        >
                                          {action.title}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-bold tabular-nums">
                                          <span className="text-amber-300">
                                            XP: {action.xp_reward}
                                          </span>
                                          <span className="text-[#98A9FF]">
                                            {action.ese_reward} E$E
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${getPillarColorClass(
                                              action.pillars[0] ?? ''
                                            )}`}
                                          >
                                            {action.pillars[0]}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <FolderAssignPopover
                                        folders={folders}
                                        selectedFolderIds={action.folderIds}
                                        onChangeFolderIds={(next) =>
                                          handleSetActionFolders(action.id, next)
                                        }
                                        compact
                                      />
                                      <span
                                        className={`w-3 h-3 rounded-full mx-0.5 ${st.dotClass}`}
                                        title={st.label}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEdit(action)}
                                        className="p-1 text-gray-400 hover:text-white cursor-pointer"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-white/10 flex items-end justify-between gap-2">
                                    <div className="space-y-1.5">
                                      <span className="inline-block px-2.5 py-1 rounded bg-emerald-600/85 text-white text-[10px] font-black tracking-wider uppercase">
                                        {freqText}
                                      </span>
                                      {chips.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {chips.map((c) => (
                                            <span
                                              key={c}
                                              className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-gray-200"
                                            >
                                              {c}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {(action.due_time || f?.timeExpectation) && (
                                      <div className="text-right shrink-0 tabular-nums">
                                        {action.due_time && (
                                          <p className="text-base font-heading font-black text-emerald-400">
                                            {action.due_time}
                                          </p>
                                        )}
                                        {(f?.timeStart || f?.timeEnd || f?.timeExpectation) && (
                                          <p className="text-[11px] text-gray-400 font-medium">
                                            {f.timeStart && f.timeEnd
                                              ? `${f.timeStart} - ${f.timeEnd}`
                                              : f.timeExpectation
                                              ? `${f.timeExpectation}`
                                              : ''}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── VIEW 3: MODO CRONOLOGIA (Items 7 & 8) ───────────────────────────────── */}
                  {viewMode === 'cronologia' && (
                    <div className="space-y-4">
                      {/* Sub-Mode Switcher */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121619] border border-white/10 rounded-2xl p-4">
                        <span className="text-xs font-semibold text-[#98A9FF]">
                          {chronologySubMode === 'horario'
                            ? 'Cronologia por Horário — Escolha um dia no mini-calendário e agende horários'
                            : 'Cronologia Manual (Capítulos) — Escolha uma pasta e ordene seus capítulos (1., 1.1)'}
                        </span>

                        <div className="flex items-center p-1 bg-black/40 border border-white/10 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                          <button
                            type="button"
                            onClick={() => setChronologySubMode('horario')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              chronologySubMode === 'horario'
                                ? 'bg-[#4850FF] text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Cronologia por Horário</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setChronologySubMode('manual')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              chronologySubMode === 'manual'
                                ? 'bg-[#4850FF] text-white'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                            <span>Cronologia Manual (Capítulos)</span>
                          </button>
                        </div>
                      </div>

                      {/* SUB-MODE A: Cronologia por Horário com Mini-Calendário + Agendamento Rápido (Item 8) */}
                      {chronologySubMode === 'horario' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                          {/* Mini Monthly Calendar Day Picker */}
                          <div className="lg:col-span-4 space-y-3">
                            <button
                              type="button"
                              onClick={() => setShowChronoCalMobile((v) => !v)}
                              className="lg:hidden w-full px-3.5 py-2.5 rounded-xl bg-[#121619] border border-white/10 text-xs font-bold text-white flex items-center justify-between cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4 text-[#98A9FF]" />
                                Dia selecionado: {chronoSelectedIso}
                              </span>
                              <span className="text-[#98A9FF]">
                                {showChronoCalMobile ? 'Ocultar' : 'Trocar Dia'}
                              </span>
                            </button>

                            <div className={showChronoCalMobile ? 'block' : 'hidden lg:block'}>
                              <MiniMonthCalendar
                                year={chronoCalYear}
                                monthIdx={chronoCalMonth}
                                selectedIso={chronoSelectedIso}
                                actions={filteredActions}
                                onPrevMonth={() => navigateChronoMonth(-1)}
                                onNextMonth={() => navigateChronoMonth(1)}
                                onToday={() => {
                                  setChronoSelectedIso(TODAY_ISO);
                                  setChronoCalYear(2026);
                                  setChronoCalMonth(10);
                                }}
                                onSelectIso={(iso) => setChronoSelectedIso(iso)}
                              />
                            </div>

                            <div className="bg-[#121619] border border-white/10 rounded-2xl p-3.5 text-xs space-y-1">
                              <p className="font-bold text-white">Resumo do dia {chronoSelectedIso}</p>
                              <p className="text-emerald-400 font-semibold tabular-nums">
                                {chronoDayActions.length - chronoUnscheduledActions.length} com
                                horário · {chronoUnscheduledActions.length} sem horário
                              </p>
                            </div>
                          </div>

                          {/* Chronological Timeline + Bottom Unscheduled Section */}
                          <div className="lg:col-span-8 space-y-6">
                            {chronoScheduledGroups.length === 0 ? (
                              <div className="bg-[#121619] border border-dashed border-white/15 rounded-2xl p-8 text-center text-xs text-gray-400">
                                Nenhuma ação com horário marcado para {chronoSelectedIso}.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {chronoScheduledGroups.map((group) => (
                                  <div
                                    key={group.timeSlot}
                                    className="flex gap-3 sm:gap-4 items-stretch"
                                  >
                                    <div className="w-14 sm:w-20 shrink-0 pt-3 text-right pr-2 sm:pr-3 border-r border-white/10">
                                      <span className="font-mono font-black text-xs sm:text-sm text-[#98A9FF] tabular-nums">
                                        {group.timeSlot}
                                      </span>
                                    </div>

                                    <div className="flex-1 space-y-3 pb-2 min-w-0">
                                      {group.items.map((action) => {
                                        const isProblem = action.type === 'problema';
                                        const isBoss = action.type === 'boss';
                                        const st = MANAGEMENT_STATUS_MAP[action.management_status];
                                        const done = action.status === 'concluido';
                                        const f = action.frequency;

                                        return (
                                          <article
                                            key={action.id}
                                            className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                              isProblem
                                                ? 'bg-[#2a1208] border-orange-500/45 hover:border-orange-400/70'
                                                : isBoss
                                                ? 'bg-[#210d0d] border-red-500/40'
                                                : 'bg-[#14171c] border-white/10 hover:border-white/20'
                                            } ${done ? 'opacity-65' : ''}`}
                                          >
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleToggleActionComplete(action.id)
                                                }
                                                className="mt-1 shrink-0 cursor-pointer"
                                              >
                                                {done ? (
                                                  <div className="w-6 h-6 rounded bg-[#4850FF] flex items-center justify-center">
                                                    <CheckSquare className="w-4 h-4 text-white" />
                                                  </div>
                                                ) : (
                                                  <div className="w-6 h-6 rounded bg-black/40 border border-white/20 flex items-center justify-center">
                                                    <Square className="w-4 h-4 text-gray-400" />
                                                  </div>
                                                )}
                                              </button>

                                              <div className="min-w-0 flex-1 space-y-1.5">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                  <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                      isProblem
                                                        ? 'bg-orange-700/80 text-orange-100'
                                                        : 'bg-white/10 text-gray-200'
                                                    }`}
                                                  >
                                                    {getFrequencyLabel(action)}
                                                  </span>
                                                  <span
                                                    className={`font-mono font-black text-xs sm:text-sm tabular-nums ${
                                                      isProblem
                                                        ? 'text-orange-400'
                                                        : 'text-emerald-400'
                                                    }`}
                                                  >
                                                    {action.due_time}
                                                  </span>
                                                </div>

                                                <h4
                                                  className={`font-heading font-bold text-sm sm:text-base truncate ${
                                                    done
                                                      ? 'line-through text-gray-500'
                                                      : 'text-white'
                                                  }`}
                                                >
                                                  {action.title}
                                                </h4>

                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold tabular-nums">
                                                  <span className="text-amber-300">
                                                    XP: {action.xp_reward}
                                                  </span>
                                                  <span className="text-[#98A9FF]">
                                                    {action.ese_reward} E$E
                                                  </span>
                                                  <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${getPillarColorClass(
                                                      action.pillars[0] ?? ''
                                                    )}`}
                                                  >
                                                    {action.pillars[0]}
                                                  </span>
                                                  {f?.timeExpectation && (
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                      {f.timeExpectation}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                              <FolderAssignPopover
                                                folders={folders}
                                                selectedFolderIds={action.folderIds}
                                                onChangeFolderIds={(next) =>
                                                  handleSetActionFolders(action.id, next)
                                                }
                                                compact
                                              />
                                              <span
                                                className={`w-3 h-3 rounded-full ${st.dotClass}`}
                                                title={st.label}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleOpenEdit(action)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                                                aria-label={`Editar ${action.title}`}
                                              >
                                                <MoreVertical className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </article>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Bottom Unscheduled Queue (Item 8) */}
                            <div className="bg-[#121619] border border-dashed border-white/15 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-heading font-black uppercase tracking-wider text-gray-300">
                                  Sem horário definido (Clique para agendar)
                                </span>
                                <span className="text-[11px] font-mono text-gray-400 tabular-nums">
                                  {chronoUnscheduledActions.length} ações
                                </span>
                              </div>

                              {chronoUnscheduledActions.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">
                                  Todas as ações deste dia já possuem horário definido.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {chronoUnscheduledActions.map((act) => {
                                    const tm = ACTION_TYPE_META[act.type];
                                    const isScheduling = schedulingActionId === act.id;
                                    return (
                                      <div
                                        key={act.id}
                                        className="p-3 rounded-xl bg-black/35 border border-white/10 flex flex-wrap items-center justify-between gap-3"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-black border shrink-0 ${tm.badgeClass}`}
                                          >
                                            {tm.label}
                                          </span>
                                          <span className="text-xs font-bold text-white truncate">
                                            {act.title}
                                          </span>
                                        </div>

                                        {isScheduling ? (
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              type="time"
                                              value={scheduleTimeInput}
                                              onChange={(e) => setScheduleTimeInput(e.target.value)}
                                              className="bg-[#111618] border border-[#4850FF] rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleAssignActionTime(act.id, scheduleTimeInput)
                                              }
                                              className="px-2.5 py-1 rounded-lg bg-[#4850FF] text-white text-xs font-bold cursor-pointer"
                                            >
                                              Salvar
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setSchedulingActionId(null)}
                                              className="px-2 py-1 text-xs text-gray-400 hover:text-white cursor-pointer"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSchedulingActionId(act.id);
                                              setScheduleTimeInput('16:00');
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-[#4850FF]/15 hover:bg-[#4850FF]/30 border border-[#4850FF]/40 text-[11px] font-bold text-[#98A9FF] hover:text-white flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Agendar horário</span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-MODE B: Cronologia Manual Escopada por Pasta (Item 7) */}
                      {chronologySubMode === 'manual' && (
                        <div className="space-y-4">
                          {/* Upfront Folder Selector Bar */}
                          <div className="bg-[#121619] border border-white/10 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-white">
                              <FolderOpen className="w-4 h-4 text-[#98A9FF]" />
                              <span>Organizar capítulos da pasta:</span>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-0.5">
                              <button
                                type="button"
                                onClick={() => setChronoManualFolderId('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                                  chronoManualFolderId === 'all'
                                    ? 'bg-[#4850FF] text-white'
                                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                Todas as Pastas
                              </button>
                              <button
                                type="button"
                                onClick={() => setChronoManualFolderId('loose')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                                  chronoManualFolderId === 'loose'
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                Soltas (Sem Pasta)
                              </button>
                              {flatFolders.map(({ folder, pathLabel }) => (
                                <button
                                  key={folder.id}
                                  type="button"
                                  onClick={() => setChronoManualFolderId(folder.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                                    chronoManualFolderId === folder.id
                                      ? 'bg-[#4850FF] text-white'
                                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                  }`}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: folder.color }}
                                  />
                                  <span>{pathLabel}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {chronoManualActions.length === 0 ? (
                            <div className="bg-[#121619] border border-dashed border-white/15 rounded-2xl p-8 text-center text-xs text-gray-400">
                              Nenhuma ação vinculada a esta pasta para ordenar capítulos.
                            </div>
                          ) : (
                            <div className="relative pl-3 sm:pl-6 space-y-3 border-l-2 border-[#4850FF]/35 ml-1 sm:ml-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 pb-1">
                                <span>
                                  Início da Jornada (
                                  {chronoManualFolderId === 'all'
                                    ? 'Todas'
                                    : chronoManualFolderId === 'loose'
                                    ? 'Soltas'
                                    : getFolderPathLabel(folders, chronoManualFolderId)}
                                  )
                                </span>
                                <span className="hidden sm:inline">
                                  Arraste pelo ícone :: para reordenar capítulos
                                </span>
                              </div>

                              {chronoManualActions.map((action, chapterIdx) => {
                                const chapterNum = chapterIdx + 1;
                                const st = MANAGEMENT_STATUS_MAP[action.management_status];
                                const tm = ACTION_TYPE_META[action.type];
                                const done = action.status === 'concluido';
                                const { reqs, linkedFazers, totalCount } =
                                  getActionSubtasks(action);
                                const isExpanded = Boolean(expandedManualChapters[action.id]);
                                const isDragTarget = dragOverActionId === action.id;
                                const hasTime = Boolean(action.due_time && action.due_time.trim());

                                return (
                                  <div
                                    key={action.id}
                                    draggable
                                    onDragStart={() => setDraggedActionId(action.id)}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      setDragOverActionId(action.id);
                                    }}
                                    onDragLeave={() => setDragOverActionId(null)}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      setDragOverActionId(null);
                                      if (draggedActionId) {
                                        handleReorderActions(draggedActionId, action.id);
                                        setDraggedActionId(null);
                                      }
                                    }}
                                    className={`rounded-2xl border transition-all ${
                                      isDragTarget
                                        ? 'bg-[#4850FF]/20 border-[#4850FF]'
                                        : 'bg-[#121619] border-white/10 hover:border-white/25'
                                    } ${done ? 'opacity-65' : ''}`}
                                  >
                                    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2 sm:gap-3">
                                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                        <span
                                          className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-white shrink-0"
                                          title="Arrastar capítulo"
                                        >
                                          <GripVertical className="w-4 h-4" />
                                        </span>

                                        <span className="px-2 py-1 rounded-lg bg-[#01055B] border border-[#4850FF]/50 font-mono font-black text-xs sm:text-sm text-[#98A9FF] tabular-nums shrink-0">
                                          {chapterNum}.
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() => handleToggleActionComplete(action.id)}
                                          className="shrink-0 cursor-pointer"
                                        >
                                          {done ? (
                                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                                          ) : (
                                            <Square className="w-5 h-5 text-gray-400" />
                                          )}
                                        </button>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                            <h4
                                              className={`font-heading font-bold text-sm sm:text-base text-white truncate ${
                                                done ? 'line-through text-gray-500' : ''
                                              }`}
                                            >
                                              {action.title}
                                            </h4>
                                            <span
                                              className={`px-2 py-0.5 rounded text-[10px] font-black border ${tm.badgeClass}`}
                                            >
                                              {tm.label}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-[11px] font-bold tabular-nums">
                                            <span className="text-amber-300">
                                              XP: {action.xp_reward}
                                            </span>
                                            <span className="text-[#98A9FF]">
                                              {action.ese_reward} E$E
                                            </span>
                                            <span className="text-gray-400">
                                              {action.pillars[0]}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                        {/* Render time ONLY if defined (Item 7) */}
                                        {hasTime && (
                                          <span className="hidden xs:inline-block px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 font-mono text-[11px] font-bold text-emerald-300 tabular-nums">
                                            {action.due_time}
                                          </span>
                                        )}

                                        {totalCount > 0 && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpandedManualChapters((prev) => ({
                                                ...prev,
                                                [action.id]: !prev[action.id],
                                              }))
                                            }
                                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-gray-300 flex items-center gap-1 cursor-pointer tabular-nums"
                                          >
                                            {isExpanded ? (
                                              <Minus className="w-3 h-3" />
                                            ) : (
                                              <Plus className="w-3 h-3" />
                                            )}
                                            <span>{totalCount}</span>
                                          </button>
                                        )}

                                        <FolderAssignPopover
                                          folders={folders}
                                          selectedFolderIds={action.folderIds}
                                          onChangeFolderIds={(next) =>
                                            handleSetActionFolders(action.id, next)
                                          }
                                          compact
                                        />

                                        <span
                                          className={`w-2.5 h-2.5 rounded-full ${st.dotClass}`}
                                          title={st.label}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEdit(action)}
                                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                                        >
                                          <MoreVertical className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    {totalCount > 0 && isExpanded && (
                                      <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-2 ml-4 sm:ml-10">
                                        {reqs.map((req, subIdx) => (
                                          <div
                                            key={req.id}
                                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/35 border border-white/5"
                                          >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <span className="font-mono font-bold text-xs text-[#98A9FF] tabular-nums shrink-0">
                                                {chapterNum}.{subIdx + 1}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleToggleRequirement(action.id, req.id)
                                                }
                                                className="shrink-0 cursor-pointer"
                                              >
                                                {req.done ? (
                                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                                ) : (
                                                  <Square className="w-4 h-4 text-gray-500" />
                                                )}
                                              </button>
                                              <span
                                                className={`text-xs font-semibold truncate ${
                                                  req.done
                                                    ? 'line-through text-gray-500'
                                                    : 'text-gray-200'
                                                }`}
                                              >
                                                {req.title}
                                              </span>
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-400 tabular-nums shrink-0">
                                              {req.xp_reward} XP · {req.ese_reward} E$E
                                            </span>
                                          </div>
                                        ))}

                                        {linkedFazers.map((child, fIdx) => {
                                          const childDone = child.status === 'concluido';
                                          return (
                                            <div
                                              key={child.id}
                                              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/35 border border-sky-500/20"
                                            >
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="font-mono font-bold text-xs text-sky-400 tabular-nums shrink-0">
                                                  {chapterNum}.{reqs.length + fIdx + 1}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleToggleActionComplete(child.id)
                                                  }
                                                  className="shrink-0 cursor-pointer"
                                                >
                                                  {childDone ? (
                                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                                  ) : (
                                                    <Square className="w-4 h-4 text-gray-500" />
                                                  )}
                                                </button>
                                                <span
                                                  className={`text-xs font-semibold truncate ${
                                                    childDone
                                                      ? 'line-through text-gray-500'
                                                      : 'text-sky-100'
                                                  }`}
                                                >
                                                  {child.title}
                                                </span>
                                              </div>
                                              <span className="text-[11px] font-bold text-sky-300 tabular-nums shrink-0">
                                                {child.xp_reward} XP · {child.ese_reward} E$E
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 pt-1">
                                Fim da Sequência
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>

        {/* Floating Action Button (FAB) — Bottom-Right Flame + Plus (with dirty draft badge) */}
        <button
          type="button"
          onClick={() => handleOpenCreate()}
          aria-label="Criar ou retomar Ação"
          title={
            dirtyDraftCount > 0
              ? `Criar ação (${dirtyDraftCount} rascunho(s) em aberto)`
              : 'Criar nova Ação'
          }
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#4850FF] hover:bg-blue-500 text-white shadow-[0_0_24px_rgba(72,80,255,0.6)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Flame className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#01055B] border-2 border-[#98A9FF] flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-white" />
          </span>
          {dirtyDraftCount > 0 && (
            <span
              className="absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-[#0B0F10] text-[9px] font-black tabular-nums shadow"
              title="Rascunhos preservados"
            >
              {dirtyDraftCount}
            </span>
          )}
        </button>
      </div>

      {/* Centered Floating Bottom Nav Pill on Mobile/Tablet (Item 9.1) */}
      <nav
        aria-label="Navegação rápida mobile"
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30 rounded-full bg-[#0d1014]/95 backdrop-blur-xl border border-white/15 px-3 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.65)] flex items-center gap-1"
      >
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'acoes', label: 'Ações', icon: Flame },
          { id: 'loja', label: 'Loja', icon: Store },
          { id: 'equipe', label: 'Equipe', icon: Users },
        ].map((nav) => {
          const NavIcon = nav.icon;
          const active = activeNav === nav.id;
          return (
            <button
              key={nav.id}
              type="button"
              onClick={() => {
                setActiveNav(nav.id);
                if (nav.id === 'acoes') setHubSection('hub');
                else {
                  showEphemeralToast(
                    `Seção "${nav.label}"`,
                    'Protótipo focado no módulo de Ações.'
                  );
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#4850FF] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <NavIcon className="w-4 h-4 shrink-0" />
              <span className={active ? 'inline' : 'hidden sm:inline'}>{nav.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dynamic Browser-Tabbed Create / Edit Modal with Persistent Drafts */}
      {formOpen && (
        <ActionFormPrototype
          isOpen={formOpen}
          initialFolderIds={
            selectedFolderId !== 'all' && selectedFolderId !== 'loose' ? [selectedFolderId] : []
          }
          existingActions={actions}
          folders={folders}
          tabs={draftTabs}
          activeTabId={activeDraftTabId}
          onChangeTabs={setDraftTabs}
          onChangeActiveTabId={setActiveDraftTabId}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveAction}
          onDelete={handleDeleteAction}
          onShare={handleShareAction}
        />
      )}

      {/* Ephemeral Bottom-Left Toast (Clear of FAB & Mobile Floating Pill — Items 5 & 9.1) */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 lg:left-72 z-40 bg-[#01055B] border border-[#4850FF] rounded-2xl px-4 py-3 shadow-[0_10px_30px_rgba(72,80,255,0.35)] max-w-[calc(100vw-6.5rem)] sm:max-w-xs">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-[#4850FF]/35 text-[9px] font-black uppercase tracking-wider text-[#98A9FF]">
              {toastMessage.important ? 'MARCO' : 'AVISO'}
            </span>
            <p className="text-xs font-black text-white tracking-wide truncate">
              {toastMessage.title}
            </p>
          </div>
          {toastMessage.subtitle && (
            <p className="text-[11px] text-[#98A9FF] mt-0.5 truncate">{toastMessage.subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};
