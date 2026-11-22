import { supabase } from '@/src/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionEngineResult {
  ok: boolean;
  error?: string;
  xpGained?: number;
  eseGained?: number;
  leveledUp?: boolean;
  newLevel?: number;
  newXp?: number;
  newEse?: number;
}

export interface PenaltyResult {
  ok: boolean;
  error?: string;
  newHp?: number;
  newEse?: number;
  hpZeroed?: boolean;
}

type PopupFn = (title: string, message: string, type: string) => void;

// ─── completeAction ───────────────────────────────────────────────────────────
// Delegates to the atomic PostgreSQL stored procedure `complete_action`.
// All XP, E$E, level, pillar, radar and streak logic runs server-side in a
// single transaction with FOR UPDATE locks — eliminates race conditions.

export async function completeAction(
  action: { id: string; status?: string; type?: string },
  _userId: string,  // kept for API compatibility; RPC uses auth.uid() internally
  showPopup: PopupFn = () => {}
): Promise<ActionEngineResult> {
  if (action.status === 'concluido') return { ok: false, error: 'already_done' };

  const { data, error } = await supabase.rpc('complete_action', {
    p_action_id: action.id,
  });

  if (error) {
    console.error('[completeAction] RPC error:', error);
    return { ok: false, error: error.message };
  }

  const result = data as {
    ok: boolean;
    error?: string;
    xpGained?: number;
    eseGained?: number;
    leveledUp?: boolean;
    newLevel?: number;
    newXp?: number;
    newEse?: number;
  };

  if (!result?.ok) {
    const errCode = result?.error ?? 'unknown_error';
    console.warn('[completeAction] Server rejected:', errCode);
    return { ok: false, error: errCode };
  }

  // Trigger popup feedback for level-up (server already created the notification)
  if (result.leveledUp && result.newLevel) {
    showPopup(
      '🎉 LEVEL UP!',
      `Sua Persona atingiu o Nível ${result.newLevel}! Continue evoluindo.`,
      'level_up'
    );
  }

  return {
    ok: true,
    xpGained: result.xpGained ?? 0,
    eseGained: result.eseGained ?? 0,
    leveledUp: result.leveledUp ?? false,
    newLevel: result.newLevel,
    newXp: result.newXp,
    newEse: result.newEse,
  };
}

// ─── undoAction ───────────────────────────────────────────────────────────────
// Delegates to the atomic PostgreSQL stored procedure `reopen_action`.
// XP, E$E, level, pillar and radar are reverted server-side atomically.
// Streak (ofensiva) is intentionally NOT reverted by design.

export async function undoAction(
  action: { id: string; status?: string },
  _userId: string   // kept for API compatibility; RPC uses auth.uid() internally
): Promise<ActionEngineResult> {
  if (action.status !== 'concluido') return { ok: false, error: 'not_completed' };

  const { data, error } = await supabase.rpc('reopen_action', {
    p_action_id: action.id,
  });

  if (error) {
    console.error('[undoAction] RPC error:', error);
    return { ok: false, error: error.message };
  }

  const result = data as {
    ok: boolean;
    error?: string;
    newXp?: number;
    newEse?: number;
    newLevel?: number;
  };

  if (!result?.ok) {
    console.warn('[undoAction] Server rejected:', result?.error);
    return { ok: false, error: result?.error ?? 'unknown_error' };
  }

  return {
    ok: true,
    newXp: result.newXp,
    newEse: result.newEse,
    newLevel: result.newLevel,
  };
}

// ─── applyPenalty ─────────────────────────────────────────────────────────────
// Delegates to the atomic PostgreSQL stored procedure `apply_penalty`.
// Idempotent — safe to call multiple times (server rejects if already applied).

export async function applyPenalty(
  actionId: string,
  showPopup: PopupFn = () => {}
): Promise<PenaltyResult> {
  const { data, error } = await supabase.rpc('apply_penalty', {
    p_action_id: actionId,
  });

  if (error) {
    console.error('[applyPenalty] RPC error:', error);
    return { ok: false, error: error.message };
  }

  const result = data as {
    ok: boolean;
    error?: string;
    newHp?: number;
    newEse?: number;
    hpZeroed?: boolean;
  };

  if (!result?.ok) {
    // Expected non-error states (already applied, action completed, etc.)
    const knownSilent = ['penalty_already_applied', 'action_already_completed', 'no_penalty_active'];
    if (!knownSilent.includes(result?.error ?? '')) {
      console.warn('[applyPenalty] Server rejected:', result?.error);
    }
    return { ok: false, error: result?.error ?? 'unknown_error' };
  }

  if (result.hpZeroed) {
    showPopup(
      '☠️ HP ZERADO!',
      'Todos os seus pilares perderam 1 nível, o Gráfico de Sacrifícios foi zerado e você perdeu 100 E$E!',
      'hp_zero'
    );
  }

  return {
    ok: true,
    newHp: result.newHp,
    newEse: result.newEse,
    hpZeroed: result.hpZeroed ?? false,
  };
}
