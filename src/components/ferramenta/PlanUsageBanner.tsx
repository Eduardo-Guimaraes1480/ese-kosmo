'use client';

import React from 'react';
import { AlertCircle, Zap, ShieldAlert } from 'lucide-react';
import { PlanTypeUsageItem, PlanType } from '@/src/types/ese-kosmo';

export interface PlanUsageBadgeProps {
  usageItem?: PlanTypeUsageItem;
  plan?: PlanType;
  className?: string;
  onUpgradeClick?: () => void;
}

export const PlanUsageBadge: React.FC<PlanUsageBadgeProps> = ({
  usageItem,
  plan = 'free',
  className = '',
  onUpgradeClick,
}) => {
  if (plan === 'pro' || plan === 'ultra') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
        title="Plano com ações ilimitadas"
      >
        <Zap className="w-2.5 h-2.5" /> ILIMITADO
      </span>
    );
  }

  if (!usageItem || usageItem.limit === null) return null;

  const { used, limit, percentage = 0, isLimitReached, isNearLimit } = usageItem;

  if (isLimitReached) {
    return (
      <button
        type="button"
        onClick={onUpgradeClick}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-colors animate-pulse cursor-pointer ${className}`}
        title="Limite do plano Free atingido. Clique para ver planos."
      >
        <ShieldAlert className="w-3 h-3 text-red-400" />
        {used}/{limit} · ATINGIDO
      </button>
    );
  }

  if (isNearLimit) {
    return (
      <button
        type="button"
        onClick={onUpgradeClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/25 transition-colors cursor-pointer ${className}`}
        title={`${percentage}% do limite utilizado. Clique para detalhes.`}
      >
        <AlertCircle className="w-2.5 h-2.5 text-yellow-400" />
        {used}/{limit} ({percentage}%)
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-white/5 text-gray-400 border border-white/10 ${className}`}
      title={`${used} de ${limit} usados no período`}
    >
      {used}/{limit}
    </span>
  );
};
