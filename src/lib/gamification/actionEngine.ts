import { supabase } from '@/src/lib/supabase';
import { calculateLevelInfo } from '@/src/lib/calculateLevelInfo';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionEngineResult {
  ok: boolean;
  error?: string;
  xpGained?: number;
  eseGained?: number;
  leveledUp?: boolean;
  newLevel?: number;
}

// showPopup is a client-side callback; pass a no-op on the server if unneeded.
type PopupFn = (title: string, message: string, type: string) => void;

// ─── completeAction ───────────────────────────────────────────────────────────

export async function completeAction(
  action: any,
  userId: string,
  showPopup: PopupFn = () => {}
): Promise<ActionEngineResult> {
  if (action.status === 'concluido') return { ok: false, error: 'already_done' };

  const nowIso = new Date().toISOString();

  // A. Update action status
  const { error: actErr } = await supabase
    .from('actions')
    .update({ status: 'concluido', completed_at: nowIso })
    .eq('id', action.id);
  if (actErr) return { ok: false, error: actErr.message };

  let notificationsTriggered = false;
  const xpReward = Number(action.xp_reward || 0);
  const eseReward = Number(action.ese_reward || 0);

  // B. Fetch latest profile to avoid stale XP
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, ese_balance, level, offensive_days, last_active_date')
    .eq('id', userId)
    .single();

  const oldLevel = calculateLevelInfo(profile?.xp || 0).level;
  const newXp = (profile?.xp || 0) + xpReward;
  const newEse = (profile?.ese_balance || 0) + eseReward;
  const levelInfo = calculateLevelInfo(newXp);

  await supabase
    .from('profiles')
    .update({ xp: newXp, ese_balance: newEse, level: levelInfo.level })
    .eq('id', userId);

  // 🎉 Level Up
  if (levelInfo.level > oldLevel) {
    const t = '🎉 LEVEL UP!';
    const m = `Sua Persona atingiu o Nível ${levelInfo.level}! Continue evoluindo.`;
    await supabase.from('notifications').insert({ user_id: userId, title: t, message: m, type: 'level_up', read: false });
    showPopup(t, m, 'level_up');
    notificationsTriggered = true;
  }

  // C. Pillar impact
  const pilarImpact = Number(action.pilar_impact || 0);
  const pilarName = action.pillar;
  if (pilarName && pilarImpact > 0) {
    const { data: pillarData } = await supabase
      .from('pillars')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', pilarName)
      .single();

    if (pillarData) {
      let finalProgress = Number(pillarData.progress || 0) + pilarImpact;
      let finalLevel = Number(pillarData.level || 1);
      if (finalProgress >= 100) {
        finalLevel += Math.floor(finalProgress / 100);
        finalProgress = finalProgress % 100;
      }
      await supabase.from('pillars').update({ progress: finalProgress, level: finalLevel }).eq('id', pillarData.id);

      if (finalLevel > Number(pillarData.level || 1)) {
        const t = '📈 PILAR EVOLUIU!';
        const m = `O pilar "${pilarName}" atingiu o Nível ${finalLevel}!`;
        await supabase.from('notifications').insert({ user_id: userId, title: t, message: m, type: 'pilar_up', read: false });
        showPopup(t, m, 'pilar_up');
        notificationsTriggered = true;
      }
    }
  }

  // D. Sacrifice radar impact
  const radarImpact = Number(action.radar_impact || 0);
  if (action.sacrifice_priority && radarImpact > 0) {
    const { data: radarPilar } = await supabase
      .from('grafico_sacrificios')
      .select('*')
      .eq('user_id', userId)
      .eq('prioridade', action.sacrifice_priority)
      .single();

    if (radarPilar) {
      await supabase
        .from('grafico_sacrificios')
        .update({ valor: Math.min(100, Number(radarPilar.valor || 0) + radarImpact) })
        .eq('id', radarPilar.id);
    } else {
      await supabase
        .from('grafico_sacrificios')
        .insert({ user_id: userId, prioridade: action.sacrifice_priority, valor: Math.min(100, 50 + radarImpact) });
    }
  }

  // E. Offensive streak (diárias only)
  if (action.type === 'diaria') {
    const todayStr = new Date().toLocaleDateString('en-CA');
    if (profile?.last_active_date !== todayStr) {
      const newOfensiva = (profile?.offensive_days || 0) + 1;
      await supabase
        .from('profiles')
        .update({ offensive_days: newOfensiva, last_active_date: todayStr })
        .eq('id', userId);

      if ([1, 2, 3].includes(newOfensiva) || newOfensiva % 7 === 0) {
        const t = '🔥 MINHA OFENSIVA!';
        const m = `Você atingiu ${newOfensiva} dia${newOfensiva > 1 ? 's' : ''} seguido${newOfensiva > 1 ? 's' : ''}!`;
        await supabase.from('notifications').insert({ user_id: userId, title: t, message: m, type: 'ofensiva', read: false });
        showPopup(t, m, 'ofensiva');
        notificationsTriggered = true;
      }
    }
  }

  void notificationsTriggered; // used by caller to decide if they want to refetch notifs

  return {
    ok: true,
    xpGained: xpReward,
    eseGained: eseReward,
    leveledUp: levelInfo.level > oldLevel,
    newLevel: levelInfo.level,
  };
}

// ─── undoAction ───────────────────────────────────────────────────────────────

export async function undoAction(
  action: any,
  userId: string
): Promise<ActionEngineResult> {
  if (action.status !== 'concluido') return { ok: false, error: 'not_completed' };

  const { error: actErr } = await supabase
    .from('actions')
    .update({ status: 'pendente', completed_at: null })
    .eq('id', action.id);
  if (actErr) return { ok: false, error: actErr.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, ese_balance')
    .eq('id', userId)
    .single();

  const xpReward = Number(action.xp_reward || 0);
  const eseReward = Number(action.ese_reward || 0);
  const newXp = Math.max(0, (profile?.xp || 0) - xpReward);
  const newEse = Math.max(0, (profile?.ese_balance || 0) - eseReward);
  const levelInfo = calculateLevelInfo(newXp);

  await supabase
    .from('profiles')
    .update({ xp: newXp, ese_balance: newEse, level: levelInfo.level })
    .eq('id', userId);

  // Revert pillar
  const pilarImpact = Number(action.pilar_impact || 0);
  const pilarName = action.pillar;
  if (pilarName && pilarImpact > 0) {
    const { data: pillarData } = await supabase
      .from('pillars')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', pilarName)
      .single();

    if (pillarData) {
      let finalProgress = Number(pillarData.progress || 0) - pilarImpact;
      let finalLevel = Number(pillarData.level || 1);
      if (finalProgress < 0) {
        if (finalLevel > 1) {
          const levelsLost = Math.ceil(Math.abs(finalProgress) / 100);
          finalLevel = Math.max(1, finalLevel - levelsLost);
          finalProgress = 100 - (Math.abs(finalProgress) % 100);
          if (finalProgress === 100) finalProgress = 0;
        } else {
          finalProgress = 0;
        }
      }
      await supabase.from('pillars').update({ progress: finalProgress, level: finalLevel }).eq('id', pillarData.id);
    }
  }

  // Revert radar
  const radarImpact = Number(action.radar_impact || 0);
  if (action.sacrifice_priority && radarImpact > 0) {
    const { data: radarPilar } = await supabase
      .from('grafico_sacrificios')
      .select('*')
      .eq('user_id', userId)
      .eq('prioridade', action.sacrifice_priority)
      .single();

    if (radarPilar) {
      await supabase
        .from('grafico_sacrificios')
        .update({ valor: Math.max(0, Number(radarPilar.valor || 0) - radarImpact) })
        .eq('id', radarPilar.id);
    }
  }

  return { ok: true };
}
