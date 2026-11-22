import { supabase } from '@/src/lib/supabase';
import { PlanType, UserPlanInfo, PlanTypeUsageItem } from '@/src/types/ese-kosmo';
import { ActionItem } from '@/src/components/prototypes/types';

export const FREE_LIMITS = {
  diaria: 20,
  fazer_daily: 10,
  meta_monthly: 5,
  boss_monthly: 1,
  problema_daily: 10,
  conquista_monthly: 3,
  folders: 10,
  history: 15,
} as const;

export interface PlanLimitError {
  isPlanLimit: boolean;
  resourceType?: string;
  limit?: number;
  message: string;
}

/**
 * Intercepta mensagens de erro do PostgreSQL (trigger enforce_action_plan_limits / enforce_folder_plan_limits)
 * e formata para exibição clara na interface.
 */
export function parsePlanErrorMessage(error: any): PlanLimitError {
  const rawMsg = error?.message || (typeof error === 'string' ? error : '');

  // Formato: LIMIT_REACHED:<tipo>:<limite>:<mensagem>
  if (rawMsg.includes('LIMIT_REACHED:')) {
    const parts = rawMsg.split('LIMIT_REACHED:')[1].split(':');
    const resourceType = parts[0] || 'recurso';
    const limit = parseInt(parts[1], 10) || 0;
    const message = parts.slice(2).join(':') || 'Limite do plano Free atingido.';
    return {
      isPlanLimit: true,
      resourceType,
      limit,
      message: message.trim(),
    };
  }

  if (rawMsg.toLowerCase().includes('plano free permite no máximo')) {
    return {
      isPlanLimit: true,
      message: rawMsg.trim(),
    };
  }

  return {
    isPlanLimit: false,
    message: rawMsg || 'Ocorreu um erro ao processar a operação.',
  };
}

/**
 * Busca o uso e limites do plano do usuário via RPC transacional Supabase.
 * Se falhar (offline / fallback), computa estimativa com segurança.
 */
export async function getUserPlanInfo(
  userId: string,
  currentPlan: PlanType = 'free',
  fallbackActions?: ActionItem[],
  fallbackFoldersCount?: number
): Promise<UserPlanInfo> {
  const isPaid = currentPlan === 'pro' || currentPlan === 'ultra';

  try {
    const { data, error } = await supabase.rpc('get_user_plan_usage', {
      p_user_id: userId,
    });

    if (!error && data) {
      const raw = data as any;
      const usage = raw.usage || {};

      const enrichItem = (item: any, defaultPeriod: 'daily' | 'monthly' | 'total'): PlanTypeUsageItem => {
        const used = item?.used ?? 0;
        const limit = item?.limit ?? (isPaid ? null : 10);
        const percentage = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
        return {
          used,
          limit,
          period: item?.period || defaultPeriod,
          percentage,
          isNearLimit: limit !== null && percentage >= 80,
          isLimitReached: limit !== null && used >= limit,
        };
      };

      return {
        plan: (raw.plan as PlanType) || currentPlan,
        is_unlimited: raw.is_unlimited ?? isPaid,
        usage: {
          diaria: enrichItem(usage.diaria, 'total'),
          fazer: enrichItem(usage.fazer, 'daily'),
          meta: enrichItem(usage.meta, 'monthly'),
          boss: enrichItem(usage.boss, 'monthly'),
          problema: enrichItem(usage.problema, 'daily'),
          conquista: enrichItem(usage.conquista, 'monthly'),
          folders: enrichItem(usage.folders, 'total'),
          history: {
            limit: raw.is_unlimited ? null : 15,
          },
        },
        features: {
          pomodoro: raw.features?.pomodoro ?? isPaid,
          boost: raw.features?.boost ?? isPaid,
          humor: raw.features?.humor ?? isPaid,
          unlimited_database: raw.features?.unlimited_database ?? isPaid,
          ai_assistant: raw.features?.ai_assistant ?? (currentPlan === 'ultra'),
        },
      };
    }
  } catch (err) {
    console.warn('[planService] Falha ao chamar RPC get_user_plan_usage, usando fallback:', err);
  }

  // Fallback computado localmente se RPC não responder
  const acts = fallbackActions || [];
  const todayStr = new Date().toLocaleDateString('en-CA');
  const currentMonth = new Date().toISOString().slice(0, 7);

  const diariaCount = acts.filter((a) => a.type === 'diaria').length;
  const fazerTodayCount = acts.filter(
    (a) => a.type === 'fazer' && a.created_at?.startsWith(todayStr)
  ).length;
  const metaMonthCount = acts.filter(
    (a) => a.type === 'meta' && a.created_at?.startsWith(currentMonth)
  ).length;
  const bossMonthCount = acts.filter(
    (a) => a.type === 'boss' && a.created_at?.startsWith(currentMonth)
  ).length;
  const problemaTodayCount = acts.filter(
    (a) => a.type === 'problema' && a.created_at?.startsWith(todayStr)
  ).length;
  const conquistaMonthCount = acts.filter(
    (a) => a.type === 'conquista' && a.created_at?.startsWith(currentMonth)
  ).length;
  const foldersCount = fallbackFoldersCount ?? 0;

  const buildFallbackItem = (
    used: number,
    limitVal: number | null,
    period: 'daily' | 'monthly' | 'total'
  ): PlanTypeUsageItem => {
    const limit = isPaid ? null : limitVal;
    const percentage = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    return {
      used,
      limit,
      period,
      percentage,
      isNearLimit: limit !== null && percentage >= 80,
      isLimitReached: limit !== null && used >= limit,
    };
  };

  return {
    plan: currentPlan,
    is_unlimited: isPaid,
    usage: {
      diaria: buildFallbackItem(diariaCount, FREE_LIMITS.diaria, 'total'),
      fazer: buildFallbackItem(fazerTodayCount, FREE_LIMITS.fazer_daily, 'daily'),
      meta: buildFallbackItem(metaMonthCount, FREE_LIMITS.meta_monthly, 'monthly'),
      boss: buildFallbackItem(bossMonthCount, FREE_LIMITS.boss_monthly, 'monthly'),
      problema: buildFallbackItem(problemaTodayCount, FREE_LIMITS.problema_daily, 'daily'),
      conquista: buildFallbackItem(conquistaMonthCount, FREE_LIMITS.conquista_monthly, 'monthly'),
      folders: buildFallbackItem(foldersCount, FREE_LIMITS.folders, 'total'),
      history: {
        limit: isPaid ? null : FREE_LIMITS.history,
      },
    },
    features: {
      pomodoro: isPaid,
      boost: isPaid,
      humor: isPaid,
      unlimited_database: isPaid,
      ai_assistant: currentPlan === 'ultra',
    },
  };
}

/**
 * Filtra a lista de histórico (ações concluídas) respeitando os limites do plano:
 * - Free: 15 mais recentes
 * - Pro / Ultra: ilimitado
 */
export function applyPlanHistoryLimit<T>(items: T[], plan: PlanType): T[] {
  if (plan === 'pro' || plan === 'ultra') {
    return items;
  }
  return items.slice(0, FREE_LIMITS.history);
}
