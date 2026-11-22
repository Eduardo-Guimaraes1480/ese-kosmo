import { supabase } from '@/src/lib/supabase';
import {
  ActionSchedule,
  FrequencyType,
  ImpactDegree,
  ManagementStatus,
} from '@/src/types/ese-kosmo';
import {
  ActionDraftTab,
  ActionItem,
  ActionType,
  FrequencyConfig,
  LinkedRequirement,
  SacrificePriority,
  SimpleSubtask,
} from '@/src/components/prototypes/types';
import { syncActionFolders } from '@/src/lib/actions/folderService';
import { parsePlanErrorMessage } from '@/src/lib/plans/planService';
// =============================================================================
// MAPEAMENTO E CONVERSORES DE DOMÍNIO
// =============================================================================

export function toDbManagementStatus(status: string | undefined): ManagementStatus {
  if (!status) return 'nao_resolvido';
  if (status === 'pausado_futuro' || status === 'pausado') return 'pausado';
  if (status === 'atrasado_pendente' || status === 'atrasado') return 'atrasado';
  if (
    status === 'nao_definido' ||
    status === 'nao_resolvido' ||
    status === 'em_andamento' ||
    status === 'concluido' ||
    status === 'transferido'
  ) {
    return status;
  }
  return 'nao_resolvido';
}

const WEEKDAY_LABEL_TO_NUM: Record<string, number> = {
  DOM: 0,
  SEG: 1,
  TER: 2,
  QUA: 3,
  QUI: 4,
  SEX: 5,
  SAB: 6,
  SÁB: 6,
};

const NUM_TO_WEEKDAY_LABEL: Record<number, string> = {
  0: 'DOM',
  1: 'SEG',
  2: 'TER',
  3: 'QUA',
  4: 'QUI',
  5: 'SEX',
  6: 'SAB',
};

// =============================================================================
// CONSULTAS COM RELAÇÕES COMPLETAS (RLS: auth.uid() = user_id)
// =============================================================================

export async function fetchActionsWithRelations(userId: string): Promise<ActionItem[]> {
  // 1. Buscar todas as ações do usuário
  const { data: actionsData, error: actionsError } = await supabase
    .from('actions')
    .select('*')
    .eq('user_id', userId)
    .order('order_index', { ascending: true });

  if (actionsError) throw actionsError;
  if (!actionsData || actionsData.length === 0) return [];

  const actionIds = actionsData.map((a) => a.id);

  // 2. Buscar subtarefas simples em lote
  const { data: subtasksData, error: subtasksError } = await supabase
    .from('action_subtasks')
    .select('*')
    .eq('user_id', userId)
    .in('action_id', actionIds)
    .order('order_index', { ascending: true });

  if (subtasksError) throw subtasksError;

  // 3. Buscar agendamentos em lote
  const { data: schedulesData, error: schedulesError } = await supabase
    .from('action_schedules')
    .select('*')
    .eq('user_id', userId)
    .in('action_id', actionIds);

  if (schedulesError) throw schedulesError;

  // 4. Buscar requisitos vinculados (como parent_action_id)
  const { data: reqsData, error: reqsError } = await supabase
    .from('action_requirements')
    .select('*')
    .eq('user_id', userId)
    .in('parent_action_id', actionIds)
    .order('order_index', { ascending: true });

  if (reqsError) throw reqsError;

  // 5. Buscar vínculos de pastas (action_folder_items) em lote
  const { data: folderItemsData, error: folderItemsError } = await supabase
    .from('action_folder_items')
    .select('action_id, folder_id')
    .eq('user_id', userId)
    .in('action_id', actionIds)
    .order('order_index', { ascending: true });

  // Silenciosamente ignorar se a tabela ainda não existir (migration não aplicada)
  const folderItemsRaw = folderItemsError ? [] : (folderItemsData ?? []);

  // Mapa de ações por ID para rápida resolução
  const actionsMap = new Map<string, any>(actionsData.map((a) => [a.id, a]));

  // Agrupamentos por action_id
  const subtasksMap = new Map<string, SimpleSubtask[]>();
  for (const st of subtasksData || []) {
    const list = subtasksMap.get(st.action_id) || [];
    list.push({
      id: st.id,
      title: st.title,
      is_completed: st.is_completed,
      order_index: st.order_index,
    });
    subtasksMap.set(st.action_id, list);
  }

  const schedulesMap = new Map<string, ActionSchedule>();
  for (const sc of schedulesData || []) {
    schedulesMap.set(sc.action_id, sc as ActionSchedule);
  }

  const requirementsMap = new Map<string, LinkedRequirement[]>();
  for (const r of reqsData || []) {
    const reqAction = actionsMap.get(r.req_action_id);
    const list = requirementsMap.get(r.parent_action_id) || [];
    list.push({
      id: r.id,
      linkedActionId: r.req_action_id,
      title: reqAction?.title || 'Requisito vinculado',
      description: reqAction?.description || undefined,
      xp_reward: reqAction?.xp_reward ?? 15,
      ese_reward: reqAction?.ese_reward ?? 5,
      timeLabel: reqAction?.due_time || undefined,
      done: reqAction?.status === 'concluido',
      source: r.origin === 'created' ? 'criado' : 'referenciado',
    });
    requirementsMap.set(r.parent_action_id, list);
  }

  // Mapa de folderIds por action_id
  const folderIdsMap = new Map<string, string[]>();
  for (const item of folderItemsRaw as { action_id: string; folder_id: string }[]) {
    const list = folderIdsMap.get(item.action_id) || [];
    list.push(item.folder_id);
    folderIdsMap.set(item.action_id, list);
  }

  // Montar ActionItems
  return actionsData.map((raw): ActionItem => {
    const schedule = schedulesMap.get(raw.id);
    const subtasks = subtasksMap.get(raw.id) || [];
    const requirements = requirementsMap.get(raw.id) || [];

    // Frequência
    let frequency: FrequencyConfig | undefined = undefined;
    if (schedule) {
      const semanalDays = (schedule.days_of_week || []).map(
        (n) => NUM_TO_WEEKDAY_LABEL[n] || 'SEG'
      );
      const mensalDays = (schedule.days_of_month || []).map((m) => `DIA ${m}`);
      frequency = {
        diariaTimes: schedule.times_of_day || ['07:00'],
        semanalDays: semanalDays.length ? semanalDays : ['SEG'],
        mensalDays: mensalDays.length ? mensalDays : ['DIA 10'],
        timeStart: schedule.times_of_day?.[0] || undefined,
        timeEnd: schedule.times_of_day?.[1] || undefined,
        timeExpectation: schedule.duration_minutes
          ? `${schedule.duration_minutes} min`
          : undefined,
        occurrenceLabel:
          schedule.times_of_day && schedule.times_of_day.length > 1
            ? `1/${schedule.times_of_day.length}`
            : undefined,
      };
    }

    // Penalidades
    const penalties = raw.penalty_active
      ? {
          xp_loss: raw.penalty_value || (raw.type === 'boss' ? -250 : -50),
          ese_loss: raw.type === 'boss' ? -100 : -20,
          pilar_loss: raw.type === 'boss' ? -15 : -5,
          radar_loss: -5,
        }
      : undefined;

    // Data/hora de vencimento
    let dueDate = '2026-11-21';
    let dueTime = '21:00';
    if (raw.due_date) {
      if (raw.due_date.includes('T')) {
        const parts = raw.due_date.split('T');
        dueDate = parts[0];
        dueTime = parts[1].slice(0, 5);
      } else {
        dueDate = raw.due_date;
      }
    }

    return {
      id: raw.id,
      title: raw.title,
      description: raw.description || '',
      type: (raw.type || 'fazer') as ActionType,
      status: raw.status === 'concluido' ? 'concluido' : 'pendente',
      management_status: toDbManagementStatus(raw.management_status),
      pillars: raw.pillar ? [raw.pillar] : ['Geral'],
      sacrifice_priorities: raw.sacrifice_priority
        ? [raw.sacrifice_priority as SacrificePriority]
        : ['Saúde'],
      xp_reward: raw.xp_reward ?? 10,
      ese_reward: raw.ese_reward ?? 5,
      pilar_impact: raw.pilar_impact ?? 0.5,
      radar_impact: raw.radar_impact ?? 0.5,
      due_date: dueDate,
      due_time: dueTime,
      folderIds: folderIdsMap.get(raw.id) || [],
      order_index: raw.order_index ?? 0,
      reference_type: undefined,
      reference_id: null,
      reference_title: null,
      frequency,
      requirements: requirements.length ? requirements : undefined,
      subtasks: subtasks.length ? subtasks : undefined,
      penalties,
      new_vocation: raw.unlocked_vocation || undefined,
      vocation_bonus: raw.unlocked_vocation
        ? `(+15%) ${raw.unlocked_vocation.toUpperCase()}`
        : undefined,
      vocation_icon: raw.type === 'boss' ? 'flame' : 'sparkles',
      completed_at: raw.completed_at,
      created_at: raw.created_at,
    };
  });
}

// =============================================================================
// SALVAMENTO COMPLETO DE AÇÃO (CREATE OU UPDATE + SUBTASKS + REQS + SCHEDULE)
// =============================================================================

export async function saveActionWithRelations(
  userId: string,
  draft: ActionDraftTab,
  sourceActionId?: string | null
): Promise<{ actionId: string; inlineCreatedActions: ActionItem[] }> {
  // 1. Preparar campos canônicos da tabela actions
  const primaryPillar = draft.selectedPillars[0] || 'Geral';
  const primarySacrifice = draft.selectedSacrifices[0] || 'Saúde';
  const mgmtStatus = toDbManagementStatus(draft.managementStatus);

  let impactDegree: ImpactDegree = 'moderado';
  if (draft.pilarImpact <= 0.2) impactDegree = 'pequeno';
  else if (draft.pilarImpact >= 1.0) impactDegree = 'alto';

  const isBossOrProblema = draft.type === 'boss' || draft.type === 'problema';
  const penaltyHp = draft.type === 'boss' ? 20 : draft.type === 'problema' ? 5 : 0;

  const dueIso = draft.dueDate
    ? `${draft.dueDate}T${draft.dueTime ? `${draft.dueTime}:00` : '23:59:59'}`
    : null;

  const actionPayload = {
    user_id: userId,
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    type: draft.type,
    status: mgmtStatus === 'concluido' ? 'concluido' : 'pendente',
    management_status: mgmtStatus,
    pillar: primaryPillar,
    sacrifice_priority: primarySacrifice,
    xp_reward: draft.xpReward,
    ese_reward: draft.eseReward,
    pilar_impact: draft.pilarImpact,
    radar_impact: draft.radarImpact,
    impact_degree: impactDegree,
    due_date: dueIso,
    start_date: draft.dueDate ? `${draft.dueDate}T00:00:00` : null,
    level_jump: draft.type === 'boss' ? 1 : 0,
    unlocked_vocation: draft.newVocation.trim() || null,
    is_system: false,
    penalty_active: isBossOrProblema,
    penalty_hp: penaltyHp,
    penalty_type: isBossOrProblema ? 'hp_only' : null,
    penalty_value: draft.lossXp || 0,
    is_shared: false,
    visibility: 'privado',
  };

  let targetActionId: string;

  if (sourceActionId) {
    // Atualização de ação existente
    const { error: updateError } = await supabase
      .from('actions')
      .update(actionPayload)
      .eq('id', sourceActionId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
    targetActionId = sourceActionId;
  } else {
    // Criação de nova ação
    const { data: insertData, error: insertError } = await supabase
      .from('actions')
      .insert(actionPayload)
      .select('id')
      .single();

    if (insertError) {
      const planErr = parsePlanErrorMessage(insertError);
      throw new Error(planErr.message);
    }
    targetActionId = insertData.id;
  }

  // 2. Persistir Subtarefas Simples (1:N via action_subtasks)
  if (draft.subtasks) {
    // Buscar subtarefas existentes para sincronização
    const { data: existingSubtasks } = await supabase
      .from('action_subtasks')
      .select('id')
      .eq('action_id', targetActionId)
      .eq('user_id', userId);

    const existingIds = new Set((existingSubtasks || []).map((s) => s.id));
    const activeDraftIds = new Set(
      draft.subtasks
        .map((s) => s.id)
        .filter((id) => !id.startsWith('subtask-temp-') && !id.startsWith('subtask-draft-'))
    );

    // Excluir subtarefas removidas
    const toDeleteIds = Array.from(existingIds).filter((id) => !activeDraftIds.has(id));
    if (toDeleteIds.length > 0) {
      await supabase
        .from('action_subtasks')
        .delete()
        .in('id', toDeleteIds)
        .eq('user_id', userId);
    }

    // Inserir ou atualizar subtarefas
    for (let i = 0; i < draft.subtasks.length; i++) {
      const st = draft.subtasks[i];
      const isNew = st.id.startsWith('subtask-temp-') || st.id.startsWith('subtask-draft-');

      if (isNew) {
        await supabase.from('action_subtasks').insert({
          action_id: targetActionId,
          user_id: userId,
          title: st.title.trim(),
          is_completed: st.is_completed,
          order_index: i,
        });
      } else {
        await supabase
          .from('action_subtasks')
          .update({
            title: st.title.trim(),
            is_completed: st.is_completed,
            order_index: i,
          })
          .eq('id', st.id)
          .eq('user_id', userId);
      }
    }
  }

  // 3. Persistir Requisitos Vinculados (N:N via action_requirements)
  const inlineCreatedActions: ActionItem[] = [];

  if (draft.type === 'meta' || draft.type === 'boss' || draft.type === 'conquista') {
    const activeReqActionIds: string[] = [];

    for (let idx = 0; idx < draft.requirements.length; idx++) {
      const req = draft.requirements[idx];
      let reqActionId: string;

      if (req.source === 'criado') {
        // Se já tiver uma ação vinculada no banco, reutiliza
        if (req.linkedActionId) {
          reqActionId = req.linkedActionId;
        } else {
          // Cria uma nova ação real do tipo 'fazer'
          const { data: newFazer, error: fazerError } = await supabase
            .from('actions')
            .insert({
              user_id: userId,
              title: req.title.trim(),
              description: req.description || `Requisito vinculado a ${draft.title.trim()}`,
              type: 'fazer',
              status: req.done ? 'concluido' : 'pendente',
              management_status: req.done ? 'concluido' : 'nao_resolvido',
              pillar: primaryPillar,
              sacrifice_priority: primarySacrifice,
              xp_reward: req.xp_reward,
              ese_reward: req.ese_reward,
              pilar_impact: 0.5,
              radar_impact: 0.5,
              impact_degree: 'pequeno',
              due_date: dueIso,
            })
            .select('*')
            .single();

          if (fazerError) throw fazerError;
          reqActionId = newFazer.id;

          inlineCreatedActions.push({
            id: newFazer.id,
            title: newFazer.title,
            description: newFazer.description || '',
            type: 'fazer',
            status: newFazer.status as any,
            management_status: 'nao_resolvido',
            pillars: [primaryPillar],
            sacrifice_priorities: [primarySacrifice],
            xp_reward: newFazer.xp_reward,
            ese_reward: newFazer.ese_reward,
            pilar_impact: 0.5,
            radar_impact: 0.5,
            due_date: draft.dueDate,
            due_time: req.timeLabel || draft.dueTime,
            folderIds: [],
            order_index: idx,
            created_at: newFazer.created_at,
          });
        }
      } else {
        // Requisito referenciado existente
        reqActionId = req.linkedActionId || req.id;
      }

      activeReqActionIds.push(reqActionId);

      // Upsert na tabela de junção action_requirements
      const { data: existingLink } = await supabase
        .from('action_requirements')
        .select('id')
        .eq('parent_action_id', targetActionId)
        .eq('req_action_id', reqActionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingLink) {
        await supabase
          .from('action_requirements')
          .update({
            order_index: idx,
            origin: req.source === 'criado' ? 'created' : 'referenced',
          })
          .eq('id', existingLink.id);
      } else {
        await supabase.from('action_requirements').insert({
          parent_action_id: targetActionId,
          req_action_id: reqActionId,
          user_id: userId,
          origin: req.source === 'criado' ? 'created' : 'referenced',
          order_index: idx,
        });
      }
    }

    // Remover vínculos desmarcados (sem apagar as ações 'fazer' originais!)
    if (activeReqActionIds.length > 0) {
      await supabase
        .from('action_requirements')
        .delete()
        .eq('parent_action_id', targetActionId)
        .eq('user_id', userId)
        .not('req_action_id', 'in', `(${activeReqActionIds.join(',')})`);
    } else {
      await supabase
        .from('action_requirements')
        .delete()
        .eq('parent_action_id', targetActionId)
        .eq('user_id', userId);
    }
  }

  // 4. Persistir Agendamento e Recorrência (action_schedules)
  if (draft.type === 'diaria' || draft.type === 'problema') {
    let freqType: FrequencyType = 'daily';
    let daysOfWeek: number[] | null = null;
    let daysOfMonth: number[] | null = null;

    if (
      draft.semanalDays.length > 0 &&
      draft.semanalDays[0] !== 'TODOS OS DIAS' &&
      draft.semanalDays.length < 7
    ) {
      freqType = 'weekly';
      daysOfWeek = draft.semanalDays.map((d) => WEEKDAY_LABEL_TO_NUM[d] ?? 1);
    } else if (draft.mensalDays.length > 0) {
      freqType = 'monthly';
      daysOfMonth = draft.mensalDays
        .map((m) => parseInt(m.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 31);
    }

    let durationMinutes: number | null = null;
    if (draft.timeMode === 'expectation' && draft.timeExpectation) {
      const match = draft.timeExpectation.match(/\d+/);
      if (match) durationMinutes = parseInt(match[0], 10);
    }

    const { data: existingSchedule } = await supabase
      .from('action_schedules')
      .select('id')
      .eq('action_id', targetActionId)
      .eq('user_id', userId)
      .maybeSingle();

    const scheduleData = {
      action_id: targetActionId,
      user_id: userId,
      frequency_type: freqType,
      days_of_week: daysOfWeek,
      days_of_month: daysOfMonth,
      times_of_day: draft.diariaTimes.length ? draft.diariaTimes : ['07:00'],
      duration_minutes: durationMinutes,
      start_date: draft.dueDate || '2026-11-21',
    };

    if (existingSchedule) {
      await supabase
        .from('action_schedules')
        .update(scheduleData)
        .eq('id', existingSchedule.id);
    } else {
      await supabase.from('action_schedules').insert(scheduleData);
    }
  }

  // 5. Persistir Vínculos de Pastas (action_folder_items)
  if (draft.folderIds) {
    try {
      await syncActionFolders(userId, targetActionId, draft.folderIds);
    } catch (folderErr) {
      console.error('Erro ao sincronizar pastas da ação:', folderErr);
      // Não falhar o salvamento geral da ação se a tabela de pastas ainda não estiver acessível
    }
  }

  return { actionId: targetActionId, inlineCreatedActions };
}

// =============================================================================
// EXCLUSÃO SEGURA DE AÇÃO
// =============================================================================

export async function deleteActionWithRelations(
  userId: string,
  actionId: string
): Promise<void> {
  // 1. Verificar se a ação existe e se é ação de sistema protegida
  const { data: action, error: fetchErr } = await supabase
    .from('actions')
    .select('id, is_system, type, title')
    .eq('id', actionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchErr) {
    const fetchErrMsg = fetchErr.message || fetchErr.details || 'Erro ao consultar ação antes da exclusão.';
    throw new Error(fetchErrMsg);
  }

  if (!action) {
    throw new Error('Ação não encontrada ou você não tem permissão para excluí-la.');
  }

  if (action.is_system) {
    throw new Error('Ações de sistema (como marcos de nível e conquistas automáticas) não podem ser excluídas.');
  }

  // 2. Exclusão no Supabase (deleções em cascata cuidam de subtasks, schedules e links)
  const { error } = await supabase
    .from('actions')
    .delete()
    .eq('id', actionId)
    .eq('user_id', userId);

  if (error) {
    const errorDetails = error.message || error.details || error.hint || 'Falha ao excluir ação no banco de dados.';
    throw new Error(errorDetails);
  }
}

// =============================================================================
// ALTERAÇÃO DE STATUS DE GESTÃO (DECOUPLADO DO STATUS GAMIFICADO)
// =============================================================================

export async function updateActionManagementStatus(
  userId: string,
  actionId: string,
  newStatus: ManagementStatus
): Promise<void> {
  const dbStatus = toDbManagementStatus(newStatus);
  const { error } = await supabase
    .from('actions')
    .update({ management_status: dbStatus })
    .eq('id', actionId)
    .eq('user_id', userId);

  if (error) throw error;
}
