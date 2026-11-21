import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Search,
  Globe,
  Timer,
  Smile,
  Rocket,
  BarChart3,
  Check,
  AlertCircle,
  Link2,
  Info,
  Skull,
  Target,
  Award,
  Calendar,
  ListTodo,
  AlertTriangle,
  Folder,
  Table2,
  Clock,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  ACTION_TYPE_LIMITS,
  ACTION_TYPE_META,
  ActionDraftTab,
  ActionFolder,
  ActionItem,
  ActionType,
  LinkedRequirement,
  MANAGEMENT_STATUS_MAP,
  ManagementStatus,
  ReferenceCategory,
  SacrificePriority,
  SimpleSubtask,
} from './types';
import { KOSMO_PILLARS, SACRIFICE_PRIORITIES } from './mockData';
import { FolderAssignPopover } from './FolderAssignPopover';
import {
  flattenFoldersWithDepth,
  getDescendantFolderIds,
  getFolderPathLabel,
} from './folderUtils';

export interface ActionFormPrototypeProps {
  isOpen?: boolean;
  initialAction?: ActionItem | null;
  initialType?: ActionType;
  initialFolderIds?: string[];
  existingActions: ActionItem[];
  folders?: ActionFolder[];
  tabs?: ActionDraftTab[];
  activeTabId?: string;
  onChangeTabs?: React.Dispatch<React.SetStateAction<ActionDraftTab[]>>;
  onChangeActiveTabId?: (tabId: string) => void;
  onClose: () => void;
  onSave: (
    savedAction: ActionItem,
    createdInlineFazers?: ActionItem[],
    savedTabId?: string
  ) => void;
  onDelete?: (actionId: string) => void;
  onShare?: (action: ActionItem) => void;
}

type QuickOpenBrowseMode = 'pastas' | 'calendario' | 'tabela' | 'cronologia';

const WEEKDAY_OPTIONS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM', 'TODOS OS DIAS'];

const TYPE_ORDER: ActionType[] = ['diaria', 'fazer', 'meta', 'boss', 'problema', 'conquista'];

const TYPE_ICONS: Record<ActionType, React.ComponentType<{ className?: string }>> = {
  diaria: Calendar,
  fazer: ListTodo,
  meta: Target,
  boss: Skull,
  problema: AlertTriangle,
  conquista: Award,
};

function clampNumber(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function formatWeightPerReq(count: number, negative: boolean): string {
  if (count <= 0) return negative ? '-0,00/100%' : '+0,00/100%';
  const raw = (100 / count).toFixed(2).replace('.', ',');
  return `${negative ? '-' : '+'}${raw}/100%`;
}

export function buildDraftTab(
  action: ActionItem | null,
  fallbackType: ActionType,
  fallbackFolderIds: string[] = []
): ActionDraftTab {
  const t: ActionType = action?.type ?? fallbackType;
  const lim = ACTION_TYPE_LIMITS[t];

  return {
    tabId: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceActionId: action?.id ?? null,
    isDirty: false,
    type: t,
    title: action?.title ?? `Nova Ação (${ACTION_TYPE_META[t].tabLabel})`,
    description: action?.description ?? '',
    managementStatus: action?.management_status ?? 'nao_resolvido',
    selectedPillars: action?.pillars?.length ? action.pillars : ['ARTES'],
    selectedSacrifices: action?.sacrifice_priorities?.length
      ? action.sacrifice_priorities
      : ['Saúde'],
    dueDate: action?.due_date ?? '2026-11-21',
    dueTime: action?.due_time ?? (t === 'meta' || t === 'boss' || t === 'conquista' ? '' : '21:00'),
    folderIds: action?.folderIds ? [...action.folderIds] : [...fallbackFolderIds],
    refCategory: action?.reference_type ?? 'nenhum',
    refSearch: '',
    selectedRefId: action?.reference_id ?? null,
    diariaTimes: action?.frequency?.diariaTimes ?? ['07:00'],
    semanalDays: action?.frequency?.semanalDays ?? ['SEG'],
    mensalDays: action?.frequency?.mensalDays ?? ['DIA 10'],
    timeMode: action?.frequency?.timeExpectation ? 'expectation' : 'range',
    timeStart: action?.frequency?.timeStart ?? '09:00',
    timeEnd: action?.frequency?.timeEnd ?? '10:00',
    timeExpectation: action?.frequency?.timeExpectation ?? '',
    subtasks: action?.subtasks ? [...action.subtasks] : [],
    requirements:
      action?.requirements ??
      (t === 'meta' || t === 'boss' || t === 'conquista'
        ? [
            {
              id: `req-draft-1-${Date.now()}`,
              title: 'Requisito #1 (Criado ou Referenciado)',
              xp_reward: 15,
              ese_reward: 5,
              done: false,
              source: 'criado',
            },
            {
              id: `req-draft-2-${Date.now()}`,
              title: 'Requisito #2 (Ex: Criado)',
              xp_reward: 20,
              ese_reward: 10,
              done: false,
              source: 'criado',
            },
            {
              id: `req-draft-3-${Date.now()}`,
              title: 'Requisito #3 (Ex: Referenciado)',
              xp_reward: 25,
              ese_reward: 10,
              done: false,
              source: 'referenciado',
            },
          ]
        : []),
    newVocation: action?.new_vocation ?? '',
    xpReward: clampNumber(action?.xp_reward ?? lim.xpMin, lim.xpMin, lim.xpMax),
    eseReward: clampNumber(action?.ese_reward ?? lim.eseMin, lim.eseMin, lim.eseMax),
    pilarImpact: clampNumber(
      action?.pilar_impact ?? Math.min(1, lim.pilarImpactMax),
      lim.pilarImpactMin,
      lim.pilarImpactMax
    ),
    radarImpact: clampNumber(
      action?.radar_impact ?? Math.min(1, lim.radarImpactMax),
      lim.radarImpactMin,
      lim.radarImpactMax
    ),
    lossXp: action?.penalties?.xp_loss ?? -250,
    lossEse: action?.penalties?.ese_loss ?? -100,
    lossPilar: action?.penalties?.pilar_loss ?? -15,
    lossRadar: action?.penalties?.radar_loss ?? -5,
  };
}

export const ActionFormPrototype: React.FC<ActionFormPrototypeProps> = ({
  isOpen = true,
  initialAction = null,
  initialType = 'fazer',
  initialFolderIds = [],
  existingActions,
  folders = [],
  tabs: controlledTabs,
  activeTabId: controlledActiveTabId,
  onChangeTabs,
  onChangeActiveTabId,
  onClose,
  onSave,
  onDelete,
  onShare,
}) => {
  // Fallback internal state if rendered standalone without controlled tabs
  const [internalTabs, setInternalTabs] = useState<ActionDraftTab[]>(() => [
    buildDraftTab(initialAction, initialType, initialFolderIds),
  ]);
  const [internalActiveTabId, setInternalActiveTabId] = useState<string>(
    () => internalTabs[0].tabId
  );

  const tabs = controlledTabs ?? internalTabs;
  const setTabs = onChangeTabs ?? setInternalTabs;
  const activeTabId = controlledActiveTabId ?? internalActiveTabId;
  const setActiveTabId = onChangeActiveTabId ?? setInternalActiveTabId;

  const [showStatusLegend, setShowStatusLegend] = useState<boolean>(false);
  const [newDiariaTime, setNewDiariaTime] = useState<string>('18:00');
  const [newMensalDay, setNewMensalDay] = useState<string>('15');
  const [showInlineCreator, setShowInlineCreator] = useState<boolean>(false);
  const [inlineReqTitle, setInlineReqTitle] = useState<string>('');
  const [inlineReqXp, setInlineReqXp] = useState<number>(15);
  const [inlineReqEse, setInlineReqEse] = useState<number>(5);
  const [inlineReqTime, setInlineReqTime] = useState<string>('19:00');
  const [showExistingPicker, setShowExistingPicker] = useState<boolean>(false);
  const [existingFazerSearch, setExistingFazerSearch] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');

  // Enhanced "+ Abrir existente" Quick Explorer Modal state
  const [showQuickSwitchMenu, setShowQuickSwitchMenu] = useState<boolean>(false);
  const [quickBrowseMode, setQuickBrowseMode] = useState<QuickOpenBrowseMode>('pastas');
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [quickFolderFilter, setQuickFolderFilter] = useState<string>('all');
  const [quickTypeFilter, setQuickTypeFilter] = useState<ActionType | 'all'>('all');
  const [quickSelectedIds, setQuickSelectedIds] = useState<string[]>([]);

  const activeTab = useMemo(
    () => tabs.find((t) => t.tabId === activeTabId) ?? tabs[0],
    [tabs, activeTabId]
  );

  const updateActiveTab = (patch: Partial<ActionDraftTab>) => {
    if (!activeTab) return;
    setTabs((prev) =>
      prev.map((tb) =>
        tb.tabId === activeTab.tabId ? { ...tb, ...patch, isDirty: true } : tb
      )
    );
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !activeTab) return;
    const newSt: SimpleSubtask = {
      id: `subtask-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newSubtaskTitle.trim(),
      is_completed: false,
      order_index: activeTab.subtasks?.length || 0,
    };
    updateActiveTab({
      subtasks: [...(activeTab.subtasks || []), newSt],
    });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    if (!activeTab || !activeTab.subtasks) return;
    updateActiveTab({
      subtasks: activeTab.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, is_completed: !s.is_completed } : s
      ),
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (!activeTab || !activeTab.subtasks) return;
    updateActiveTab({
      subtasks: activeTab.subtasks.filter((s) => s.id !== subtaskId),
    });
  };

  const handleMoveSubtask = (index: number, direction: 'up' | 'down') => {
    if (!activeTab || !activeTab.subtasks) return;
    const list = [...activeTab.subtasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const [removed] = list.splice(index, 1);
    list.splice(targetIndex, 0, removed);
    updateActiveTab({ subtasks: list });
  };

  const handleCreateBrowserTab = (
    presetAction: ActionItem | null = null,
    presetType: ActionType = 'fazer'
  ) => {
    if (presetAction) {
      const alreadyOpen = tabs.find((t) => t.sourceActionId === presetAction.id);
      if (alreadyOpen) {
        setActiveTabId(alreadyOpen.tabId);
        setShowQuickSwitchMenu(false);
        setQuickSelectedIds([]);
        setValidationError(null);
        setConfirmDelete(false);
        return;
      }
    }
    const newTab = buildDraftTab(presetAction, presetType, initialFolderIds);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.tabId);
    setValidationError(null);
    setConfirmDelete(false);
    setShowQuickSwitchMenu(false);
    setQuickSelectedIds([]);
  };

  const handleToggleQuickSelect = (actionId: string) => {
    setQuickSelectedIds((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const handleOpenMultipleExisting = () => {
    if (quickSelectedIds.length === 0) return;
    const selectedActions = quickSelectedIds
      .map((id) => existingActions.find((a) => a.id === id))
      .filter((a): a is ActionItem => Boolean(a));

    if (selectedActions.length === 0) return;

    let targetActiveTabId = activeTabId;
    setTabs((prev) => {
      const next = [...prev];
      selectedActions.forEach((act) => {
        const existingTab = next.find((t) => t.sourceActionId === act.id);
        if (existingTab) {
          targetActiveTabId = existingTab.tabId;
        } else {
          const built = buildDraftTab(act, act.type, act.folderIds);
          next.push(built);
          targetActiveTabId = built.tabId;
        }
      });
      return next;
    });

    setActiveTabId(targetActiveTabId);
    setShowQuickSwitchMenu(false);
    setQuickSelectedIds([]);
    setValidationError(null);
    setConfirmDelete(false);
  };

  const handleCloseBrowserTab = (e: React.MouseEvent, tabIdToClose: string) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // Reset single tab cleanly or close modal
      const replacement = buildDraftTab(null, 'fazer', initialFolderIds);
      setTabs([replacement]);
      setActiveTabId(replacement.tabId);
      onClose();
      return;
    }
    const idx = tabs.findIndex((t) => t.tabId === tabIdToClose);
    const remaining = tabs.filter((t) => t.tabId !== tabIdToClose);
    setTabs(remaining);
    if (activeTabId === tabIdToClose) {
      const nextActive = remaining[Math.max(0, idx - 1)] ?? remaining[0];
      setActiveTabId(nextActive.tabId);
    }
  };

  const handleSwitchType = (nextType: ActionType) => {
    if (!activeTab) return;
    setValidationError(null);
    const nextLimits = ACTION_TYPE_LIMITS[nextType];
    const shouldResetDefaultTitle =
      activeTab.title.startsWith('Nova Ação') || activeTab.title.startsWith('Título da Ação');

    const defaultReqs =
      (nextType === 'meta' || nextType === 'boss' || nextType === 'conquista') &&
      activeTab.requirements.length === 0
        ? [
            {
              id: `req-draft-1-${Date.now()}`,
              title: 'Requisito #1 (Criado ou Referenciado)',
              xp_reward: 15,
              ese_reward: 5,
              done: false,
              source: 'criado' as const,
            },
            {
              id: `req-draft-2-${Date.now()}`,
              title: 'Requisito #2 (Ex: Criado)',
              xp_reward: 20,
              ese_reward: 10,
              done: false,
              source: 'criado' as const,
            },
            {
              id: `req-draft-3-${Date.now()}`,
              title: 'Requisito #3 (Ex: Referenciado)',
              xp_reward: 25,
              ese_reward: 10,
              done: false,
              source: 'referenciado' as const,
            },
          ]
        : activeTab.requirements;

    updateActiveTab({
      type: nextType,
      title: shouldResetDefaultTitle
        ? `Nova Ação (${ACTION_TYPE_META[nextType].tabLabel})`
        : activeTab.title,
      xpReward: clampNumber(activeTab.xpReward, nextLimits.xpMin, nextLimits.xpMax),
      eseReward: clampNumber(activeTab.eseReward, nextLimits.eseMin, nextLimits.eseMax),
      pilarImpact: clampNumber(
        activeTab.pilarImpact,
        nextLimits.pilarImpactMin,
        nextLimits.pilarImpactMax
      ),
      radarImpact: clampNumber(
        activeTab.radarImpact,
        nextLimits.radarImpactMin,
        nextLimits.radarImpactMax
      ),
      requirements: defaultReqs,
      lossXp: nextLimits.hasPenalties
        ? clampNumber(activeTab.lossXp, nextLimits.lossXpMin ?? -2500, nextLimits.lossXpMax ?? 0)
        : activeTab.lossXp,
      lossEse: nextLimits.hasPenalties
        ? clampNumber(activeTab.lossEse, nextLimits.lossEseMin ?? -1000, nextLimits.lossEseMax ?? 0)
        : activeTab.lossEse,
      lossPilar: nextLimits.hasPenalties
        ? clampNumber(
            activeTab.lossPilar,
            nextLimits.lossPilarMin ?? -100,
            nextLimits.lossPilarMax ?? 0
          )
        : activeTab.lossPilar,
      lossRadar: nextLimits.hasPenalties
        ? clampNumber(
            activeTab.lossRadar,
            nextLimits.lossRadarMin ?? -50,
            nextLimits.lossRadarMax ?? 0
          )
        : activeTab.lossRadar,
    });
  };

  const togglePillar = (pillarName: string) => {
    if (!activeTab) return;
    const prev = activeTab.selectedPillars;
    const next = prev.includes(pillarName)
      ? prev.length > 1
        ? prev.filter((p) => p !== pillarName)
        : prev
      : [...prev, pillarName];
    updateActiveTab({ selectedPillars: next });
  };

  const toggleSacrifice = (sac: SacrificePriority) => {
    if (!activeTab) return;
    const prev = activeTab.selectedSacrifices;
    const next = prev.includes(sac)
      ? prev.length > 1
        ? prev.filter((s) => s !== sac)
        : prev
      : [...prev, sac];
    updateActiveTab({ selectedSacrifices: next });
  };

  const linkableParents = useMemo(() => {
    if (!activeTab || activeTab.refCategory === 'nenhum') return [];
    const search = activeTab.refSearch.trim().toLowerCase();
    return existingActions.filter((a) => {
      if (a.type !== activeTab.refCategory) return false;
      if (!search) return true;
      return (
        a.title.toLowerCase().includes(search) ||
        a.pillars.some((p) => p.toLowerCase().includes(search))
      );
    });
  }, [existingActions, activeTab]);

  const availableFazerActions = useMemo(() => {
    if (!activeTab) return [];
    const search = existingFazerSearch.trim().toLowerCase();
    const linkedIds = new Set(activeTab.requirements.map((r) => r.linkedActionId).filter(Boolean));
    return existingActions.filter((a) => {
      if (a.type !== 'fazer') return false;
      if (linkedIds.has(a.id)) return false;
      if (!search) return true;
      return a.title.toLowerCase().includes(search);
    });
  }, [existingActions, existingFazerSearch, activeTab]);

  const flatFolders = useMemo(() => flattenFoldersWithDepth(folders), [folders]);

  const quickOpenFilteredActions = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    let base = [...existingActions];

    if (quickBrowseMode === 'pastas') {
      if (quickFolderFilter === 'loose') {
        base = base.filter((a) => a.folderIds.length === 0);
      } else if (quickFolderFilter !== 'all') {
        const allowed = new Set(getDescendantFolderIds(folders, quickFolderFilter));
        base = base.filter((a) => a.folderIds.some((fid) => allowed.has(fid)));
      }
    } else if (quickBrowseMode === 'tabela') {
      if (quickTypeFilter !== 'all') {
        base = base.filter((a) => a.type === quickTypeFilter);
      }
    } else if (quickBrowseMode === 'calendario') {
      base.sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
    } else if (quickBrowseMode === 'cronologia') {
      base.sort((a, b) => {
        const tA = a.due_time || '99:99';
        const tB = b.due_time || '99:99';
        if (tA !== tB) return tA.localeCompare(tB);
        return a.order_index - b.order_index;
      });
    }

    if (q) {
      base = base.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.pillars.some((p) => p.toLowerCase().includes(q)) ||
          ACTION_TYPE_META[a.type].label.toLowerCase().includes(q)
      );
    }
    return base;
  }, [existingActions, folders, quickBrowseMode, quickFolderFilter, quickTypeFilter, quickSearch]);

  const handleAddDiariaTime = () => {
    if (!activeTab || !newDiariaTime) return;
    if (!activeTab.diariaTimes.includes(newDiariaTime)) {
      updateActiveTab({ diariaTimes: [...activeTab.diariaTimes, newDiariaTime] });
    }
  };

  const handleToggleWeekday = (day: string) => {
    if (!activeTab) return;
    const prev = activeTab.semanalDays;
    updateActiveTab({
      semanalDays: prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    });
  };

  const handleAddMensalDay = () => {
    if (!activeTab) return;
    const num = parseInt(newMensalDay, 10);
    if (Number.isNaN(num) || num < 1 || num > 31) return;
    const label = `DIA ${num}`;
    if (!activeTab.mensalDays.includes(label)) {
      updateActiveTab({ mensalDays: [...activeTab.mensalDays, label] });
    }
  };

  const handleAddInlineRequirement = () => {
    if (!activeTab) return;
    const clean = inlineReqTitle.trim();
    if (!clean) return;
    const newReq: LinkedRequirement = {
      id: `req-${Date.now()}`,
      title: clean,
      xp_reward: clampNumber(inlineReqXp, 1, 25),
      ese_reward: clampNumber(inlineReqEse, 0, 10),
      timeLabel: inlineReqTime || undefined,
      done: false,
      source: 'criado',
    };
    updateActiveTab({ requirements: [...activeTab.requirements, newReq] });
    setInlineReqTitle('');
    setShowInlineCreator(false);
  };

  const handleSelectExistingFazer = (fazer: ActionItem) => {
    if (!activeTab) return;
    const newReq: LinkedRequirement = {
      id: `req-ref-${fazer.id}-${Date.now()}`,
      title: fazer.title,
      description: fazer.description,
      xp_reward: fazer.xp_reward,
      ese_reward: fazer.ese_reward,
      timeLabel: fazer.due_time || undefined,
      done: fazer.status === 'concluido',
      source: 'referenciado',
      linkedActionId: fazer.id,
    };
    updateActiveTab({ requirements: [...activeTab.requirements, newReq] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTab) return;
    setValidationError(null);

    if (!activeTab.title.trim()) {
      setValidationError('Informe o título da ação antes de salvar.');
      return;
    }

    if (activeTab.type === 'diaria' || activeTab.type === 'problema') {
      const hasAnyFreq =
        activeTab.diariaTimes.length > 0 ||
        activeTab.semanalDays.length > 0 ||
        activeTab.mensalDays.length > 0;
      if (!hasAnyFreq) {
        setValidationError(
          'Defina pelo menos um campo de frequência (Diária, Semanal ou Mensal).'
        );
        return;
      }
    }

    if (
      (activeTab.type === 'meta' ||
        activeTab.type === 'boss' ||
        activeTab.type === 'conquista') &&
      activeTab.requirements.length === 0
    ) {
      setValidationError('Vincule ou crie pelo menos 1 requisito "FAZER" obrigatório.');
      return;
    }

    const limits = ACTION_TYPE_LIMITS[activeTab.type];
    const sourceAction = activeTab.sourceActionId
      ? existingActions.find((a) => a.id === activeTab.sourceActionId) ?? null
      : null;
    const selectedRefObj =
      existingActions.find((a) => a.id === activeTab.selectedRefId) ?? null;

    const payload: ActionItem = {
      id: sourceAction?.id ?? `action-${Date.now()}`,
      title: activeTab.title.trim(),
      description: activeTab.description.trim(),
      type: activeTab.type,
      status: activeTab.managementStatus === 'concluido' ? 'concluido' : 'pendente',
      management_status: activeTab.managementStatus,
      pillars: activeTab.selectedPillars,
      sacrifice_priorities: activeTab.selectedSacrifices,
      xp_reward: clampNumber(activeTab.xpReward, limits.xpMin, limits.xpMax),
      ese_reward: clampNumber(activeTab.eseReward, limits.eseMin, limits.eseMax),
      pilar_impact: clampNumber(
        activeTab.pilarImpact,
        limits.pilarImpactMin,
        limits.pilarImpactMax
      ),
      radar_impact: clampNumber(
        activeTab.radarImpact,
        limits.radarImpactMin,
        limits.radarImpactMax
      ),
      due_date: activeTab.dueDate,
      due_time: activeTab.dueTime,
      folderIds: activeTab.folderIds,
      order_index: sourceAction?.order_index ?? existingActions.length + 1,
      reference_type: activeTab.type === 'fazer' ? activeTab.refCategory : undefined,
      reference_id:
        activeTab.type === 'fazer' && activeTab.refCategory !== 'nenhum'
          ? activeTab.selectedRefId
          : null,
      reference_title:
        activeTab.type === 'fazer'
          ? activeTab.refCategory === 'nenhum'
            ? 'NENHUM'
            : selectedRefObj?.title ?? 'NENHUM'
          : undefined,
      frequency:
        activeTab.type === 'diaria' || activeTab.type === 'problema'
          ? {
              diariaTimes: activeTab.diariaTimes,
              semanalDays: activeTab.semanalDays,
              mensalDays: activeTab.mensalDays,
              timeStart: activeTab.timeMode === 'range' ? activeTab.timeStart : undefined,
              timeEnd: activeTab.timeMode === 'range' ? activeTab.timeEnd : undefined,
              timeExpectation:
                activeTab.timeMode === 'expectation'
                  ? activeTab.timeExpectation.trim() || undefined
                  : undefined,
              occurrenceLabel:
                activeTab.diariaTimes.length > 1
                  ? `1/${activeTab.diariaTimes.length}`
                  : activeTab.diariaTimes.length === 1
                  ? '1/1'
                  : undefined,
            }
          : undefined,
      requirements:
        activeTab.type === 'meta' ||
        activeTab.type === 'boss' ||
        activeTab.type === 'conquista'
          ? activeTab.requirements
          : undefined,
      subtasks: activeTab.subtasks || [],
      penalties: limits.hasPenalties
        ? {
            xp_loss: activeTab.lossXp,
            ese_loss: activeTab.lossEse,
            pilar_loss: activeTab.lossPilar,
            radar_loss: activeTab.lossRadar,
          }
        : undefined,
      new_vocation:
        activeTab.type === 'boss' || activeTab.type === 'conquista'
          ? activeTab.newVocation.trim() || sourceAction?.new_vocation
          : sourceAction?.new_vocation,
      vocation_bonus:
        (activeTab.type === 'boss' ||
          activeTab.type === 'conquista' ||
          activeTab.type === 'meta') &&
        activeTab.newVocation.trim()
          ? `(+15%) ${activeTab.newVocation.trim().toUpperCase()}`
          : sourceAction?.vocation_bonus,
      vocation_icon:
        sourceAction?.vocation_icon ?? (activeTab.type === 'boss' ? 'flame' : 'sparkles'),
      created_at: sourceAction?.created_at ?? new Date().toISOString(),
      completed_at:
        activeTab.managementStatus === 'concluido'
          ? sourceAction?.completed_at ?? new Date().toISOString()
          : null,
    };

    const inlineCreatedFazers: ActionItem[] =
      activeTab.type === 'meta' ||
      activeTab.type === 'boss' ||
      activeTab.type === 'conquista'
        ? activeTab.requirements
            .filter(
              (r) =>
                r.source === 'criado' &&
                !r.id.startsWith('req-draft-') &&
                !existingActions.some((ea) => ea.title === r.title && ea.type === 'fazer')
            )
            .map((r, idx) => ({
              id: `fazer-inline-${r.id}`,
              title: r.title,
              description: r.description ?? `Requisito vinculado a ${payload.title}`,
              type: 'fazer',
              status: r.done ? 'concluido' : 'pendente',
              management_status: r.done ? 'concluido' : 'nao_resolvido',
              pillars: activeTab.selectedPillars,
              sacrifice_priorities: activeTab.selectedSacrifices,
              xp_reward: r.xp_reward,
              ese_reward: r.ese_reward,
              pilar_impact: 0.5,
              radar_impact: 0.5,
              due_date: activeTab.dueDate,
              due_time: r.timeLabel ?? activeTab.dueTime,
              folderIds: activeTab.folderIds,
              order_index: existingActions.length + idx + 2,
              reference_type: activeTab.type as ReferenceCategory,
              reference_id: payload.id,
              reference_title: payload.title,
              created_at: new Date().toISOString(),
            }))
        : [];

    setTabs((prev) =>
      prev.map((tb) =>
        tb.tabId === activeTab.tabId
          ? { ...tb, isDirty: false, sourceActionId: payload.id }
          : tb
      )
    );

    onSave(payload, inlineCreatedFazers, activeTab.tabId);
  };

  if (!isOpen || !activeTab) return null;

  const isEditing = Boolean(activeTab.sourceActionId);
  const limits = ACTION_TYPE_LIMITS[activeTab.type];
  const activeTypeMeta = ACTION_TYPE_META[activeTab.type];
  const activeStatusMeta = MANAGEMENT_STATUS_MAP[activeTab.managementStatus];
  const dirtyCount = tabs.filter((t) => t.isDirty).length;

  return (
    <>
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Sua Ação"
    >
      <div className="w-full max-w-5xl bg-[#0B0F10] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-auto max-h-[94vh] flex flex-col">
        {/* Top Space-Blue Header Bar */}
        <header className="bg-gradient-to-r from-[#01055B] to-[#01022A] border-b border-white/10 px-4 sm:px-5 py-3 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-heading font-black text-base sm:text-2xl tracking-wider text-white uppercase whitespace-nowrap">
              SUA AÇÃO
            </span>
            <span className="hidden sm:inline-block text-xs text-[#98A9FF] font-medium truncate">
              {tabs.length} {tabs.length === 1 ? 'aba aberta' : 'abas abertas'}
              {dirtyCount > 0 ? ` · ${dirtyCount} rascunho(s) salvo(s)` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowStatusLegend((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] sm:text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
              title="Ver legenda dos 7 Status Gerenciais"
            >
              <Info className="w-3.5 h-3.5 text-[#98A9FF]" />
              <span className="hidden xs:inline sm:inline">Legenda Status</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="Minimizar / fechar modal mantendo rascunhos"
              title="Minimizar mantendo abas e rascunhos abertos"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        {/* Browser-Style Multi-Tab Strip with Persistent Drafts */}
        <div className="bg-[#050708] border-b border-white/10 px-3 pt-2 flex items-end gap-1 overflow-x-auto no-scrollbar shrink-0 relative">
          {tabs.map((tab) => {
            const TabIcon = TYPE_ICONS[tab.type];
            const isActive = tab.tabId === activeTab.tabId;
            const cleanTitle =
              tab.title.replace(/^Nova Ação \([^)]+\)/, '').trim() || tab.title;
            const tabLabel = `${ACTION_TYPE_META[tab.type].tabLabel}: ${cleanTitle}`;
            return (
              <div
                key={tab.tabId}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTabId(tab.tabId);
                  setValidationError(null);
                  setConfirmDelete(false);
                }}
                className={`group flex items-center gap-2 pl-3 pr-2 py-2 rounded-t-xl border-t border-x text-xs font-semibold cursor-pointer transition-all max-w-[190px] sm:max-w-[230px] shrink-0 select-none ${
                  isActive
                    ? 'bg-[#0B0F10] border-white/15 text-white -mb-px pb-2.5'
                    : 'bg-[#101417] border-white/5 text-gray-400 hover:text-gray-200 hover:bg-[#151a1e] mb-0.5'
                }`}
              >
                <span
                  className="shrink-0 flex items-center"
                  style={{ color: ACTION_TYPE_META[tab.type].accentHex }}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                </span>
                <span className="truncate">{tabLabel}</span>
                {tab.isDirty && (
                  <span
                    className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                    title="Rascunho não salvo (mantido em memória)"
                  />
                )}
                <button
                  type="button"
                  onClick={(e) => handleCloseBrowserTab(e, tab.tabId)}
                  className="p-0.5 rounded hover:bg-white/15 text-gray-500 hover:text-white transition-colors shrink-0"
                  aria-label={`Fechar aba ${tabLabel}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* "+" New Browser Tab Button & "+ Abrir existente" Trigger (clean tab bar) */}
          <div className="flex items-center gap-1.5 pb-1.5 pl-1 shrink-0">
            <button
              type="button"
              onClick={() => handleCreateBrowserTab(null, activeTab.type)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#4850FF] text-gray-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Abrir nova aba de rascunho"
              aria-label="Abrir nova aba"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowQuickSwitchMenu(true)}
              className={`px-2.5 h-7 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                showQuickSwitchMenu
                  ? 'bg-[#4850FF] text-white'
                  : 'bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10'
              }`}
            >
              + Abrir existente
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Status Legend Collapsible Banner */}
          {showStatusLegend && (
            <div className="bg-[#121619] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#98A9FF]">
                  Significado dos Status Gerenciais e Cores
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStatusLegend(false)}
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  Fechar
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(Object.keys(MANAGEMENT_STATUS_MAP) as ManagementStatus[]).map((key) => {
                  const st = MANAGEMENT_STATUS_MAP[key];
                  return (
                    <div
                      key={key}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/30 border border-white/5"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 ${st.dotClass}`}
                      />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${st.textClass}`}>{st.label}</p>
                        <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
                          {st.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6 Action Type Tabs + Multi-Folder Picker + Status Gerencial Selector */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div
              className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap"
              role="tablist"
              aria-label="Tipo de Ação"
            >
              {TYPE_ORDER.map((t) => {
                const meta = ACTION_TYPE_META[t];
                const active = activeTab.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleSwitchType(t)}
                    className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? meta.activeTabClass
                        : 'bg-[#1c2124] text-gray-400 border-white/5 hover:text-white hover:bg-[#252b2f]'
                    }`}
                  >
                    {meta.tabLabel}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Multi-Folder Picker Popover (Item 6) */}
              <FolderAssignPopover
                folders={folders}
                selectedFolderIds={activeTab.folderIds}
                onChangeFolderIds={(nextIds) => updateActiveTab({ folderIds: nextIds })}
                buttonLabel={
                  activeTab.folderIds.length === 0
                    ? 'Solta (Sem pasta)'
                    : activeTab.folderIds.length === 1
                    ? folders.find((f) => f.id === activeTab.folderIds[0])?.name ?? '1 pasta'
                    : `${activeTab.folderIds.length} pastas`
                }
                align="left"
              />

              {/* Status Gerencial Selector */}
              <div className="flex items-center gap-2.5 bg-[#14181b] border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
                <span className={`w-3 h-3 rounded-full shrink-0 ${activeStatusMeta.dotClass}`} />
                <label
                  htmlFor="status-gerencial-select"
                  className="text-[11px] font-bold text-gray-400 uppercase whitespace-nowrap"
                >
                  Status:
                </label>
                <select
                  id="status-gerencial-select"
                  value={activeTab.managementStatus}
                  onChange={(e) =>
                    updateActiveTab({ managementStatus: e.target.value as ManagementStatus })
                  }
                  className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer ${activeStatusMeta.textClass}`}
                >
                  {(Object.keys(MANAGEMENT_STATUS_MAP) as ManagementStatus[]).map((stKey) => (
                    <option key={stKey} value={stKey} className="bg-[#111618] text-white">
                      {MANAGEMENT_STATUS_MAP[stKey].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Assigned Folder Path Chips (if any) */}
          {activeTab.folderIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 -mt-2">
              <span className="text-[10px] font-bold uppercase text-gray-500 mr-1">
                Pastas vinculadas:
              </span>
              {activeTab.folderIds.map((fid) => {
                const folderObj = folders.find((f) => f.id === fid);
                if (!folderObj) return null;
                return (
                  <span
                    key={fid}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-gray-200"
                  >
                    <span
                      className="flex items-center"
                      style={{ color: folderObj.color }}
                    >
                      <Folder className="w-3 h-3" />
                    </span>
                    <span>{getFolderPathLabel(folders, fid)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveTab({
                          folderIds: activeTab.folderIds.filter((id) => id !== fid),
                        })
                      }
                      className="text-gray-400 hover:text-red-400 ml-0.5 cursor-pointer"
                      aria-label={`Remover da pasta ${folderObj.name}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Large Editable Action Title */}
          <div>
            <input
              type="text"
              value={activeTab.title}
              onChange={(e) => updateActiveTab({ title: e.target.value })}
              placeholder="Título da Ação"
              className="w-full bg-transparent border-b border-white/10 focus:border-[#4850FF] pb-2 text-xl sm:text-3xl font-heading font-black text-white placeholder-gray-600 focus:outline-none transition-colors"
            />
          </div>

          {validationError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Main 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 block">
                  Descrição e Detalhes
                </label>
                <textarea
                  value={activeTab.description}
                  onChange={(e) => updateActiveTab({ description: e.target.value })}
                  rows={4}
                  placeholder="Descreva os detalhes, contexto, critérios de conclusão ou observações..."
                  className="w-full bg-[#1a1f22] border border-white/10 focus:border-[#4850FF] rounded-xl p-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Subtarefas Simples (Checklist Interno 1:N) */}
              <div className="space-y-2.5 bg-[#12161a] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#98A9FF]" />
                    <label className="text-xs font-bold text-gray-200 tracking-wider uppercase">
                      Subtarefas (Checklist)
                    </label>
                  </div>
                  {activeTab.subtasks && activeTab.subtasks.length > 0 && (
                    <span className="text-[11px] font-mono text-gray-300 bg-white/10 px-2 py-0.5 rounded">
                      {activeTab.subtasks.filter((s) => s.is_completed).length}/
                      {activeTab.subtasks.length} concluídas
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Adicionar subtarefa (Enter para salvar)..."
                    className="flex-1 bg-[#1a1f22] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4850FF]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="px-3 py-2 bg-[#4850FF] hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>

                {activeTab.subtasks && activeTab.subtasks.length > 0 && (
                  <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto">
                    {activeTab.subtasks.map((st, sIdx) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors group"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(st.id)}
                          className="flex-shrink-0 cursor-pointer focus:outline-none"
                          title={st.is_completed ? 'Reabrir subtarefa' : 'Concluir subtarefa'}
                        >
                          {st.is_completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500 hover:text-gray-300" />
                          )}
                        </button>
                        <span
                          className={`flex-1 text-xs truncate ${
                            st.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'
                          }`}
                        >
                          {st.title}
                        </span>
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={sIdx === 0}
                            onClick={() => handleMoveSubtask(sIdx, 'up')}
                            className="p-1 hover:text-white disabled:opacity-20 text-gray-400 text-[10px]"
                            title="Mover para cima"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={sIdx === (activeTab.subtasks?.length || 0) - 1}
                            onClick={() => handleMoveSubtask(sIdx, 'down')}
                            className="p-1 hover:text-white disabled:opacity-20 text-gray-400 text-[10px]"
                            title="Mover para baixo"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(st.id)}
                            className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                            title="Excluir subtarefa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FAZER */}
              {activeTab.type === 'fazer' && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-400">
                    Outras opções a definir para Detalhes
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-[#0b2a42]/65 border border-dashed border-sky-400/40 space-y-2">
                      <label className="text-[11px] font-black tracking-wider text-sky-300 uppercase block">
                        DEFINA DATA
                      </label>
                      <input
                        type="date"
                        value={activeTab.dueDate}
                        onChange={(e) => updateActiveTab({ dueDate: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-400 tabular-nums"
                      />
                    </div>
                    <div className="p-4 rounded-xl bg-[#0b2a42]/65 border border-dashed border-sky-400/40 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-black tracking-wider text-sky-300 uppercase block">
                          DEFINA HORA (Opcional)
                        </label>
                        {activeTab.dueTime && (
                          <button
                            type="button"
                            onClick={() => updateActiveTab({ dueTime: '' })}
                            className="text-[10px] text-sky-300 hover:text-white underline cursor-pointer"
                          >
                            Limpar
                          </button>
                        )}
                      </div>
                      <input
                        type="time"
                        value={activeTab.dueTime}
                        onChange={(e) => updateActiveTab({ dueTime: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-sky-400 tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Defina Referência (Linkar To-do) */}
                  <div className="p-4 rounded-xl bg-[#0b2a42]/65 border border-dashed border-sky-400/40 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-black tracking-wider text-sky-300 uppercase flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5" />
                        DEFINA REFERÊNCIA (Linkar To-do)
                      </label>
                      {activeTab.selectedRefId && activeTab.refCategory !== 'nenhum' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveTab({ refCategory: 'nenhum', selectedRefId: null })
                          }
                          className="text-[10px] text-sky-300 hover:text-white underline cursor-pointer"
                        >
                          Limpar vínculo
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: 'nenhum', label: 'NENHUM' },
                          { id: 'meta', label: 'MISSÕES' },
                          { id: 'boss', label: 'BOSS' },
                          { id: 'conquista', label: 'CONQUISTAS' },
                        ] as { id: ReferenceCategory; label: string }[]
                      ).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() =>
                            updateActiveTab({
                              refCategory: cat.id,
                              selectedRefId: cat.id === 'nenhum' ? null : activeTab.selectedRefId,
                            })
                          }
                          className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                            activeTab.refCategory === cat.id
                              ? 'bg-white text-[#0B0F10]'
                              : 'bg-white/15 text-gray-200 hover:bg-white/25'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {activeTab.refCategory !== 'nenhum' ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={activeTab.refSearch}
                            onChange={(e) => updateActiveTab({ refSearch: e.target.value })}
                            placeholder={`Buscar ${ACTION_TYPE_META[activeTab.refCategory].tabLabel} existentes...`}
                            className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-400"
                          />
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                          {linkableParents.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2 text-center">
                              Nenhuma opção encontrada para este filtro.
                            </p>
                          ) : (
                            linkableParents.map((parent) => {
                              const isLinked = activeTab.selectedRefId === parent.id;
                              return (
                                <button
                                  key={parent.id}
                                  type="button"
                                  onClick={() => updateActiveTab({ selectedRefId: parent.id })}
                                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs border transition-colors cursor-pointer ${
                                    isLinked
                                      ? 'bg-sky-500/20 border-sky-400 text-white'
                                      : 'bg-black/35 border-white/5 text-gray-300 hover:bg-black/55'
                                  }`}
                                >
                                  <span className="font-semibold truncate">{parent.title}</span>
                                  <span className="text-[10px] text-sky-300 shrink-0 tabular-nums">
                                    {parent.pillars[0] ?? 'Geral'} · {parent.xp_reward} XP
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-2.5 rounded-lg bg-black/35 border border-white/5 text-xs text-gray-400">
                        Selecione Missões, BOSS ou Conquistas acima para vincular este Fazer.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DIÁRIAS & INIMIGO */}
              {(activeTab.type === 'diaria' || activeTab.type === 'problema') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                      CAMPO OBRIGATÓRIO
                    </span>
                    <div className={`p-4 rounded-xl border space-y-4 ${activeTypeMeta.panelClass}`}>
                      <h4 className="text-xs font-black tracking-wider uppercase text-white">
                        DEFINA FREQUÊNCIA
                      </h4>

                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-gray-200 block">
                          Frequência Diária
                        </span>
                        <div className="space-y-1.5">
                          {activeTab.diariaTimes.map((t, idx) => (
                            <div key={`${t}-${idx}`} className="flex items-center gap-1.5">
                              <span className="px-2 py-1.5 rounded bg-black/40 text-[11px] font-mono font-bold text-white shrink-0 tabular-nums">
                                #{idx + 1}
                              </span>
                              <input
                                type="time"
                                value={t}
                                onChange={(e) => {
                                  const next = [...activeTab.diariaTimes];
                                  next[idx] = e.target.value;
                                  updateActiveTab({ diariaTimes: next });
                                }}
                                className="flex-1 bg-black/50 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono tabular-nums focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateActiveTab({
                                    diariaTimes: activeTab.diariaTimes.filter((_, i) => i !== idx),
                                  })
                                }
                                className="p-1.5 rounded bg-red-600/80 hover:bg-red-500 text-white transition-colors cursor-pointer"
                                aria-label="Remover horário diário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={newDiariaTime}
                            onChange={(e) => setNewDiariaTime(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={handleAddDiariaTime}
                            className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-[11px] font-semibold text-gray-200 block">
                          Frequência Semanal
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {WEEKDAY_OPTIONS.map((day) => {
                            const active = activeTab.semanalDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => handleToggleWeekday(day)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-white text-[#0B0F10]'
                                    : 'bg-black/40 text-gray-300 hover:bg-black/60'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-[11px] font-semibold text-gray-200 block">
                          Frequência Mensal
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeTab.mensalDays.map((mDay) => (
                            <span
                              key={mDay}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-black/50 text-[10px] font-bold text-white"
                            >
                              {mDay}
                              <button
                                type="button"
                                onClick={() =>
                                  updateActiveTab({
                                    mensalDays: activeTab.mensalDays.filter((d) => d !== mDay),
                                  })
                                }
                                className="text-red-400 hover:text-red-300 cursor-pointer"
                                aria-label={`Remover ${mDay}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={newMensalDay}
                            onChange={(e) => setNewMensalDay(e.target.value)}
                            placeholder="Dia"
                            className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={handleAddMensalDay}
                            className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Dia
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-300/80 italic">
                        Defina pelo menos um desses campos
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                      CAMPO OPCIONAL
                    </span>
                    <div
                      className={`p-4 rounded-xl border border-dashed space-y-4 ${activeTypeMeta.panelClass}`}
                    >
                      <h4 className="text-xs font-black tracking-wider uppercase text-white">
                        DEFINA TEMPO
                      </h4>

                      <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateActiveTab({ timeMode: 'range' })}
                          className={`py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            activeTab.timeMode === 'range'
                              ? 'bg-white/15 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Horário Fixo
                        </button>
                        <button
                          type="button"
                          onClick={() => updateActiveTab({ timeMode: 'expectation' })}
                          className={`py-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            activeTab.timeMode === 'expectation'
                              ? 'bg-white/15 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Expectativa
                        </button>
                      </div>

                      {activeTab.timeMode === 'range' ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] text-gray-300 block">
                              Horário Inicial
                            </label>
                            <input
                              type="time"
                              value={activeTab.timeStart}
                              onChange={(e) => updateActiveTab({ timeStart: e.target.value })}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono tabular-nums"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] text-gray-300 block">
                              Horário Final
                            </label>
                            <input
                              type="time"
                              value={activeTab.timeEnd}
                              onChange={(e) => updateActiveTab({ timeEnd: e.target.value })}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono tabular-nums"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-300 block">
                            Expectativa de tempo (Ex: 10 min, 4 horas)
                          </label>
                          <input
                            type="text"
                            value={activeTab.timeExpectation}
                            onChange={(e) => updateActiveTab({ timeExpectation: e.target.value })}
                            placeholder="Ex: 45 min"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MISSÃO, BOSS, CONQUISTA */}
              {(activeTab.type === 'meta' ||
                activeTab.type === 'boss' ||
                activeTab.type === 'conquista') && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border space-y-4 ${activeTypeMeta.panelClass}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 block">
                          CAMPOS OBRIGATÓRIOS PARA{' '}
                          {activeTab.type === 'meta'
                            ? 'MISSÕES'
                            : activeTab.type === 'boss'
                            ? 'BOSS'
                            : 'CONQUISTA'}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-0.5">
                          Crie requisitos OU Selecione seus &quot;FAZER&quot;
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-white/80 tabular-nums">
                        {activeTab.requirements.length} req.
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {activeTab.requirements.map((req, index) => (
                        <div
                          key={req.id}
                          className="flex items-center gap-2 bg-black/45 border border-white/10 rounded-lg p-2"
                        >
                          <span className="px-2 py-1 rounded bg-white/10 text-[11px] font-mono font-bold text-white shrink-0 tabular-nums">
                            #{index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {req.title}
                            </p>
                            <p className="text-[10px] text-gray-400 tabular-nums">
                              {req.source === 'criado' ? 'Criado inline' : 'Referenciado'} ·{' '}
                              {req.xp_reward} XP · {req.ese_reward} E$E
                              {req.timeLabel ? ` · ${req.timeLabel}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateActiveTab({
                                requirements: activeTab.requirements.filter((r) => r.id !== req.id),
                              })
                            }
                            className="p-1.5 rounded bg-red-600/80 hover:bg-red-500 text-white transition-colors shrink-0 cursor-pointer"
                            aria-label="Remover requisito"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInlineCreator((v) => !v);
                          setShowExistingPicker(false);
                        }}
                        className="py-2 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> CRIAR
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExistingPicker((v) => !v);
                          setShowInlineCreator(false);
                        }}
                        className="py-2 px-3 rounded-lg bg-black/45 hover:bg-black/65 border border-white/15 text-white text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" /> SELECIONE EXISTENTE
                      </button>
                    </div>

                    {showInlineCreator && (
                      <div className="p-3 rounded-lg bg-black/55 border border-white/15 space-y-2.5">
                        <input
                          type="text"
                          value={inlineReqTitle}
                          onChange={(e) => setInlineReqTitle(e.target.value)}
                          placeholder="Nome do novo requisito FAZER..."
                          className="w-full bg-[#111618] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4850FF]"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">
                              XP (1-25)
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={25}
                              value={inlineReqXp}
                              onChange={(e) => setInlineReqXp(Number(e.target.value))}
                              className="w-full bg-[#111618] border border-white/10 rounded px-2 py-1.5 text-xs text-white tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">
                              E$E (0-10)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={inlineReqEse}
                              onChange={(e) => setInlineReqEse(Number(e.target.value))}
                              className="w-full bg-[#111618] border border-white/10 rounded px-2 py-1.5 text-xs text-white tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1">
                              Horário
                            </label>
                            <input
                              type="time"
                              value={inlineReqTime}
                              onChange={(e) => setInlineReqTime(e.target.value)}
                              className="w-full bg-[#111618] border border-white/10 rounded px-2 py-1.5 text-xs text-white tabular-nums"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowInlineCreator(false)}
                            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleAddInlineRequirement}
                            className="px-3 py-1.5 rounded-lg bg-[#4850FF] hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                          >
                            Adicionar Requisito
                          </button>
                        </div>
                      </div>
                    )}

                    {showExistingPicker && (
                      <div className="p-3 rounded-lg bg-black/55 border border-white/15 space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={existingFazerSearch}
                            onChange={(e) => setExistingFazerSearch(e.target.value)}
                            placeholder="Buscar ações FAZER existentes..."
                            className="w-full bg-[#111618] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500"
                          />
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {availableFazerActions.length === 0 ? (
                            <p className="text-[11px] text-gray-400 italic text-center py-2">
                              Nenhum &quot;Fazer&quot; disponível para vincular.
                            </p>
                          ) : (
                            availableFazerActions.map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => handleSelectExistingFazer(f)}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/15 text-xs text-left text-gray-200 transition-colors cursor-pointer"
                              >
                                <span className="truncate font-medium">{f.title}</span>
                                <span className="text-[10px] text-[#98A9FF] shrink-0 tabular-nums">
                                  +{f.xp_reward} XP
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <p className="text-xs text-gray-200">
                        {activeTab.type === 'meta'
                          ? 'Nessa missão cada requisito vale:'
                          : activeTab.type === 'boss'
                          ? 'Nesse BOSS cada requisito vale:'
                          : 'Nessa CONQUISTA cada requisito vale:'}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-lg sm:text-xl font-heading font-black text-white tabular-nums shrink-0">
                          {formatWeightPerReq(
                            activeTab.requirements.length,
                            activeTab.type === 'boss'
                          )}
                        </span>
                        <div className="flex-1 h-4 bg-white/85 rounded-md overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-sm transition-all duration-200 ${
                              activeTab.type === 'meta'
                                ? 'bg-purple-600'
                                : activeTab.type === 'boss'
                                ? 'bg-red-600'
                                : 'bg-yellow-600'
                            }`}
                            style={{
                              width: `${
                                activeTab.requirements.length > 0
                                  ? Math.min(100, 100 / activeTab.requirements.length)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {(activeTab.type === 'boss' || activeTab.type === 'conquista') && (
                      <div className="pt-2 border-t border-white/10 space-y-1.5">
                        <label className="text-xs font-bold text-white block">
                          {activeTab.type === 'boss'
                            ? 'DERROTANDO BOSS, sua nova VOCAÇÃO será:'
                            : 'Desbloqueando sua CONQUISTA, sua nova VOCAÇÃO será:'}
                        </label>
                        <input
                          type="text"
                          value={activeTab.newVocation}
                          onChange={(e) => updateActiveTab({ newVocation: e.target.value })}
                          placeholder="Ex: Programador Full Stack"
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
                        />
                      </div>
                    )}
                  </div>

                  <div className={`p-4 rounded-xl border space-y-2 ${activeTypeMeta.panelClass}`}>
                    <h4 className="text-xs font-black tracking-wider uppercase text-white">
                      DEFINA DATA E HORA
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-gray-300 block mb-1">Data:</label>
                        <input
                          type="date"
                          value={activeTab.dueDate}
                          onChange={(e) => updateActiveTab({ dueDate: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-300 block mb-1">
                          Hora (Opcional):
                        </label>
                        <input
                          type="time"
                          value={activeTab.dueTime}
                          onChange={(e) => updateActiveTab({ dueTime: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN (5 cols): Pilares, Sacrifícios, Recompensas & Perdas */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-[#181c20] border border-white/10 rounded-xl p-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-heading font-black tracking-wider uppercase text-white">
                    PILARES
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {KOSMO_PILLARS.map((pillar) => {
                      const active = activeTab.selectedPillars.includes(pillar.name);
                      return (
                        <button
                          key={pillar.id}
                          type="button"
                          onClick={() => togglePillar(pillar.name)}
                          className={`px-2 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all border truncate cursor-pointer ${
                            active
                              ? 'bg-[#4850FF] text-white border-[#98A9FF]/50 shadow-[0_0_12px_rgba(72,80,255,0.3)]'
                              : 'bg-[#2c333a] text-gray-300 border-transparent hover:bg-[#374049]'
                          }`}
                        >
                          {pillar.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <h4 className="text-sm font-heading font-black tracking-wider uppercase text-white">
                    SACRIFÍCIOS
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {SACRIFICE_PRIORITIES.map((sac) => {
                      const active = activeTab.selectedSacrifices.includes(sac);
                      return (
                        <button
                          key={sac}
                          type="button"
                          onClick={() => toggleSacrifice(sac)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all border cursor-pointer ${
                            active
                              ? 'bg-purple-600 text-white border-purple-400/50 shadow-[0_0_12px_rgba(147,51,234,0.3)]'
                              : 'bg-[#2c333a] text-gray-300 border-transparent hover:bg-[#374049]'
                          }`}
                        >
                          {sac}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-[#181c20] border border-white/10 rounded-xl p-4 space-y-5">
                <div className="space-y-3">
                  <h4
                    className={`text-sm font-heading font-black tracking-wider uppercase ${
                      limits.hasPenalties ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    RECOMPENSAS
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 block uppercase">
                        XP (MAX {limits.xpMax})
                      </label>
                      <input
                        type="number"
                        min={limits.xpMin}
                        max={limits.xpMax}
                        value={activeTab.xpReward}
                        onChange={(e) => updateActiveTab({ xpReward: Number(e.target.value) })}
                        className="w-full bg-[#101316] border border-white/10 focus:border-[#4850FF] rounded-lg px-3 py-2 text-xs font-bold text-white text-center tabular-nums focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-500 block text-center tabular-nums">
                        Min={limits.xpMin}xp · Max={limits.xpMax}xp
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 block uppercase">
                        E$E (MAX {limits.eseMax})
                      </label>
                      <input
                        type="number"
                        min={limits.eseMin}
                        max={limits.eseMax}
                        value={activeTab.eseReward}
                        onChange={(e) => updateActiveTab({ eseReward: Number(e.target.value) })}
                        className="w-full bg-[#101316] border border-white/10 focus:border-[#4850FF] rounded-lg px-3 py-2 text-xs font-bold text-[#98A9FF] text-center tabular-nums focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-500 block text-center tabular-nums">
                        Min={limits.eseMin}E$E · Max={limits.eseMax}E$E
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 block uppercase">
                        IMPACTO PILAR (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={limits.pilarImpactMin}
                        max={limits.pilarImpactMax}
                        value={activeTab.pilarImpact}
                        onChange={(e) =>
                          updateActiveTab({ pilarImpact: Number(e.target.value) })
                        }
                        className="w-full bg-[#101316] border border-white/10 focus:border-[#4850FF] rounded-lg px-3 py-2 text-xs font-bold text-emerald-400 text-center tabular-nums focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-500 block text-center tabular-nums">
                        Min={limits.pilarImpactMin}% · Max={limits.pilarImpactMax}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-300 block uppercase">
                        AVANÇO RADAR (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={limits.radarImpactMin}
                        max={limits.radarImpactMax}
                        value={activeTab.radarImpact}
                        onChange={(e) =>
                          updateActiveTab({ radarImpact: Number(e.target.value) })
                        }
                        className="w-full bg-[#101316] border border-white/10 focus:border-[#4850FF] rounded-lg px-3 py-2 text-xs font-bold text-purple-400 text-center tabular-nums focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-500 block text-center tabular-nums">
                        Min={limits.radarImpactMin}% · Max={limits.radarImpactMax}%
                      </span>
                    </div>
                  </div>
                </div>

                {limits.hasPenalties && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-heading font-black tracking-wider uppercase text-red-400">
                      PERDAS
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-red-300/80 block uppercase">
                          XP (MAX {Math.abs(limits.lossXpMin ?? 2500)})
                        </label>
                        <input
                          type="number"
                          min={limits.lossXpMin}
                          max={limits.lossXpMax}
                          value={activeTab.lossXp}
                          onChange={(e) => updateActiveTab({ lossXp: Number(e.target.value) })}
                          className="w-full bg-[#1a0c0c] border border-red-500/30 focus:border-red-400 rounded-lg px-3 py-2 text-xs font-bold text-red-300 text-center tabular-nums focus:outline-none"
                        />
                        <span className="text-[10px] text-gray-500 block text-center tabular-nums">
                          {limits.lossXpMax}xp a {limits.lossXpMin}xp
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-red-300/80 block uppercase">
                          E$E (MAX {Math.abs(limits.lossEseMin ?? 1000)})
                        </label>
                        <input
                          type="number"
                          min={limits.lossEseMin}
                          max={limits.lossEseMax}
                          value={activeTab.lossEse}
                          onChange={(e) => updateActiveTab({ lossEse: Number(e.target.value) })}
                          className="w-full bg-[#1a0c0c] border border-red-500/30 focus:border-red-400 rounded-lg px-3 py-2 text-xs font-bold text-red-300 text-center tabular-nums focus:outline-none"
                        />
                        <span className="text-[10px] text-gray-500 block text-center tabular-nums">
                          {limits.lossEseMax}E$E a {limits.lossEseMin}E$E
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-red-300/80 block uppercase">
                          IMPACTO PILAR (%)
                        </label>
                        <input
                          type="number"
                          min={limits.lossPilarMin}
                          max={limits.lossPilarMax}
                          value={activeTab.lossPilar}
                          onChange={(e) =>
                            updateActiveTab({ lossPilar: Number(e.target.value) })
                          }
                          className="w-full bg-[#1a0c0c] border border-red-500/30 focus:border-red-400 rounded-lg px-3 py-2 text-xs font-bold text-red-300 text-center tabular-nums focus:outline-none"
                        />
                        <span className="text-[10px] text-gray-500 block text-center tabular-nums">
                          {limits.lossPilarMax}% a {limits.lossPilarMin}%
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-red-300/80 block uppercase">
                          AVANÇO RADAR (%)
                        </label>
                        <input
                          type="number"
                          min={limits.lossRadarMin}
                          max={limits.lossRadarMax}
                          value={activeTab.lossRadar}
                          onChange={(e) =>
                            updateActiveTab({ lossRadar: Number(e.target.value) })
                          }
                          className="w-full bg-[#1a0c0c] border border-red-500/30 focus:border-red-400 rounded-lg px-3 py-2 text-xs font-bold text-red-300 text-center tabular-nums focus:outline-none"
                        />
                        <span className="text-[10px] text-gray-500 block text-center tabular-nums">
                          {limits.lossRadarMax}% a {limits.lossRadarMin}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 italic leading-relaxed">
                      Recomendamos colocar a mesma quantidade (equivalente) nos campos acima, ou
                      deixar as perdas maiores que as recompensas, para maior desafio e vontade de
                      derrotar; se não, não haverá o efeito esperado...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ferramentas para Ação (Em breve) */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-gray-400 block">
              FERRAMENTAS PARA AÇÃO (EM BREVE)
            </span>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Timer, label: 'POMODORO' },
                { icon: Smile, label: 'HUMOR' },
                { icon: Rocket, label: 'BOOST X1.5' },
                { icon: BarChart3, label: 'IMPACTO' },
              ].map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <button
                    key={tool.label}
                    type="button"
                    disabled
                    title="Disponível em breve no plano Pro"
                    className="w-20 sm:w-24 h-20 rounded-xl bg-white/[0.03] border border-dashed border-white/15 flex flex-col items-center justify-center gap-1.5 opacity-45 cursor-not-allowed select-none"
                  >
                    <ToolIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">
                      {tool.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save + Share + Delete */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#0008AE] hover:bg-[#4850FF] text-white font-heading font-black text-base tracking-widest uppercase transition-colors shadow-[0_0_24px_rgba(0,8,174,0.45)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              SALVAR AÇÃO
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const previewAction: ActionItem = {
                    id: activeTab.sourceActionId ?? 'preview',
                    title: activeTab.title,
                    description: activeTab.description,
                    type: activeTab.type,
                    status:
                      activeTab.managementStatus === 'concluido' ? 'concluido' : 'pendente',
                    management_status: activeTab.managementStatus,
                    pillars: activeTab.selectedPillars,
                    sacrifice_priorities: activeTab.selectedSacrifices,
                    xp_reward: activeTab.xpReward,
                    ese_reward: activeTab.eseReward,
                    pilar_impact: activeTab.pilarImpact,
                    radar_impact: activeTab.radarImpact,
                    due_date: activeTab.dueDate,
                    due_time: activeTab.dueTime,
                    folderIds: activeTab.folderIds,
                    order_index: 1,
                    created_at: new Date().toISOString(),
                  };
                  onShare?.(previewAction);
                }}
                className="py-3 px-4 rounded-xl bg-transparent border border-dashed border-white/25 hover:border-white/50 hover:bg-white/5 text-gray-300 hover:text-white text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                COMPARTILHAR NA REDE SOCIAL
              </button>

              {isEditing && onDelete && activeTab.sourceActionId ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDelete(activeTab.sourceActionId!)}
                      className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-widest uppercase transition-colors cursor-pointer"
                    >
                      CONFIRMAR EXCLUSÃO
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="py-3 px-4 rounded-xl bg-white/10 text-gray-300 text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="py-3 px-4 rounded-xl bg-[#3d0e0e] hover:bg-red-900/80 border border-red-500/30 text-red-300 hover:text-white text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    DELETAR AÇÃO
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleCloseBrowserTab(e, activeTab.tabId)}
                  className="py-3 px-4 rounded-xl bg-[#3d0e0e]/60 hover:bg-[#3d0e0e] border border-red-500/20 text-red-300 text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer"
                >
                  DESCARTAR RASCUNHO
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>

    {/* Centered Full Overlay Modal for "+ Abrir existente" (never clipped by tab strip overflow) */}
    {showQuickSwitchMenu && (
      <div
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Abrir ação existente em nova aba"
        onClick={() => setShowQuickSwitchMenu(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#0B0F10] border border-white/15 rounded-2xl overflow-hidden shadow-2xl my-auto max-h-[88vh] flex flex-col"
        >
          {/* Space-Blue Modal Header */}
          <header className="bg-gradient-to-r from-[#01055B] to-[#01022A] border-b border-white/10 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <h3 className="font-heading font-black text-sm sm:text-base tracking-wider uppercase text-white">
                Abrir Ação Existente
              </h3>
              <p className="text-[11px] text-[#98A9FF] truncate">
                Navegue por Pastas, Calendário, Tabela ou Cronologia e selecione uma ou mais ações
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickSwitchMenu(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 cursor-pointer"
              aria-label="Fechar navegador de ações"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Controls: Mode Switcher + Search + Contextual Filter */}
          <div className="p-4 border-b border-white/10 bg-[#0d1114] space-y-3 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-black/50 rounded-xl border border-white/10">
              {(
                [
                  { id: 'pastas', label: 'Pastas', icon: Folder },
                  { id: 'calendario', label: 'Calendário', icon: Calendar },
                  { id: 'tabela', label: 'Tabela', icon: Table2 },
                  { id: 'cronologia', label: 'Cronologia', icon: Clock },
                ] as {
                  id: QuickOpenBrowseMode;
                  label: string;
                  icon: React.ComponentType<{ className?: string }>;
                }[]
              ).map((m) => {
                const Icon = m.icon;
                const active = quickBrowseMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setQuickBrowseMode(m.id)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#4850FF] text-white shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Buscar por título, pilar ou tipo..."
                  autoFocus
                  className="w-full bg-black/50 border border-white/10 focus:border-[#4850FF] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              {quickBrowseMode === 'pastas' && (
                <select
                  value={quickFolderFilter}
                  onChange={(e) => setQuickFolderFilter(e.target.value)}
                  aria-label="Filtrar por pasta"
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none sm:max-w-[230px]"
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
              )}
            </div>

            {quickBrowseMode === 'tabela' && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => setQuickTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                    quickTypeFilter === 'all'
                      ? 'bg-white text-[#0B0F10]'
                      : 'bg-white/10 text-gray-300 hover:bg-white/15'
                  }`}
                >
                  Todos
                </button>
                {TYPE_ORDER.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQuickTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                      quickTypeFilter === t
                        ? 'bg-[#4850FF] text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/15'
                    }`}
                  >
                    {ACTION_TYPE_META[t].tabLabel}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comfortable Results List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {quickOpenFilteredActions.length === 0 ? (
              <div className="py-12 text-center space-y-1.5">
                <p className="text-sm font-bold text-white">Nenhuma ação encontrada</p>
                <p className="text-xs text-gray-400">
                  Altere a busca ou escolha outra pasta/categoria acima.
                </p>
              </div>
            ) : (
              quickOpenFilteredActions.map((act) => {
                const alreadyInTab = tabs.some((t) => t.sourceActionId === act.id);
                const isSelected = quickSelectedIds.includes(act.id);
                const tm = ACTION_TYPE_META[act.type];
                const st = MANAGEMENT_STATUS_MAP[act.management_status];
                const folderNames = act.folderIds
                  .map((fid) => folders.find((f) => f.id === fid)?.name)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div
                    key={act.id}
                    onClick={() => handleToggleQuickSelect(act.id)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#4850FF]/15 border-[#4850FF]'
                        : 'bg-[#121619] border-white/10 hover:border-white/25 hover:bg-[#161b1f]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        aria-label={`Selecionar ${act.title}`}
                        className="w-4 h-4 accent-[#4850FF] shrink-0 cursor-pointer"
                      />
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${st.dotClass}`}
                        title={st.label}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {act.title}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black border shrink-0 ${tm.badgeClass}`}
                          >
                            {tm.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate tabular-nums mt-0.5">
                          {act.due_date ? act.due_date : 'Sem data'}
                          {act.due_time ? ` às ${act.due_time}` : ''}
                          {folderNames ? ` · Pastas: ${folderNames}` : ' · Solta (Sem pasta)'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateBrowserTab(act, act.type);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-colors ${
                        alreadyInTab
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-[#4850FF]/20 text-[#98A9FF] border border-[#4850FF]/35 hover:bg-[#4850FF] hover:text-white'
                      }`}
                    >
                      {alreadyInTab ? 'Ir para aba' : 'Abrir'}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Multi-Select Action Bar */}
          <footer className="px-4 py-3 border-t border-white/10 bg-[#0d1114] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2 text-xs text-gray-300 tabular-nums">
              <span className="font-bold text-white">
                {quickSelectedIds.length}{' '}
                {quickSelectedIds.length === 1 ? 'selecionada' : 'selecionadas'}
              </span>
              {quickSelectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuickSelectedIds([])}
                  className="text-[11px] text-[#98A9FF] hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuickSwitchMenu(false)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={quickSelectedIds.length === 0}
                onClick={handleOpenMultipleExisting}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  quickSelectedIds.length > 0
                    ? 'bg-[#0008AE] hover:bg-[#4850FF] text-white shadow-[0_0_16px_rgba(72,80,255,0.4)]'
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
              >
                Abrir Selecionadas ({quickSelectedIds.length})
              </button>
            </div>
          </footer>
        </div>
      </div>
    )}
    </>
  );
};
